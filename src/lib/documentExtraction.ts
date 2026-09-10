// Page-preserving document extraction that runs in the browser.
// PDF: real per-page text via PDF.js (bundled worker), OCR fallback for image-only pages.
// DOCX: mammoth. TXT/CSV: plain text. No guessing — failures surface as typed errors.

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '@/integrations/supabase/client';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export type ExtractionErrorCode = 'PASSWORD_PROTECTED' | 'CORRUPT' | 'EMPTY' | 'UNSUPPORTED' | 'OCR_FAILED' | 'ABORTED';

export class ExtractionError extends Error {
  constructor(public code: ExtractionErrorCode, message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

export interface PageText {
  page: number;
  text: string;
  source: 'text' | 'ocr' | 'approximate';
}

export interface ExtractionResult {
  pages: PageText[];
  pageCount: number;
  method: 'pdf-text' | 'pdf-ocr' | 'pdf-mixed' | 'docx' | 'text';
  totalChars: number;
  emptyPages: number;
  ocrPages: number;
  warnings: string[];
  /** Real printed page numbers (PDF) or approximate blocks (DOCX/TXT) */
  pageBasis: 'real' | 'approximate';
}

export interface ExtractionProgress {
  stage: 'opening' | 'extracting' | 'ocr' | 'done';
  page: number;
  totalPages: number;
  ocrPages?: number;
  detail?: string;
}

const MIN_PAGE_CHARS_FOR_TEXT = 40;
const MAX_OCR_PAGES = 40;
const OCR_CONCURRENCY = 3;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv'];

export function detectKind(file: File): 'pdf' | 'docx' | 'text' | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) return 'docx';
  if (file.type === 'text/plain' || file.type === 'text/csv' || name.endsWith('.txt') || name.endsWith('.csv')) return 'text';
  return null;
}

export async function extractDocument(
  file: File,
  onProgress?: (p: ExtractionProgress) => void,
  signal?: AbortSignal,
): Promise<ExtractionResult> {
  const kind = detectKind(file);
  if (!kind) throw new ExtractionError('UNSUPPORTED', 'Unsupported file type. Upload a PDF, DOCX, TXT or CSV file.');
  if (kind === 'pdf') return extractPdf(file, onProgress, signal);
  if (kind === 'docx') return extractDocx(file, onProgress);
  return extractPlainText(file, onProgress);
}

// ---------------------------------------------------------------- PDF

async function extractPdf(file: File, onProgress?: (p: ExtractionProgress) => void, signal?: AbortSignal): Promise<ExtractionResult> {
  onProgress?.({ stage: 'opening', page: 0, totalPages: 0 });
  const data = new Uint8Array(await file.arrayBuffer());

  let pdf: pdfjsLib.PDFDocumentProxy;
  try {
    pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === 'PasswordException') throw new ExtractionError('PASSWORD_PROTECTED', 'This PDF is password-protected. Remove the password and upload it again.');
    if (err?.name === 'InvalidPDFException') throw new ExtractionError('CORRUPT', 'This file is not a valid PDF or is corrupted.');
    throw new ExtractionError('CORRUPT', `The PDF could not be opened: ${err?.message ?? 'unknown error'}`);
  }

  const totalPages = pdf.numPages;
  const pages: PageText[] = [];
  const ocrQueue: number[] = [];
  const warnings: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (signal?.aborted) throw new ExtractionError('ABORTED', 'Extraction cancelled');
    let text = '';
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text = assembleText(content.items as TextItemLike[]);
      page.cleanup();
    } catch (e) {
      warnings.push(`Page ${i}: text layer unreadable (${(e as Error).message})`);
    }
    if (text.replace(/\s+/g, '').length < MIN_PAGE_CHARS_FOR_TEXT) {
      ocrQueue.push(i);
      pages.push({ page: i, text: '', source: 'text' });
    } else {
      pages.push({ page: i, text, source: 'text' });
    }
    if (i % 5 === 0 || i === totalPages) onProgress?.({ stage: 'extracting', page: i, totalPages, ocrPages: ocrQueue.length });
  }

  // ---- OCR image-only pages ----
  let ocrDone = 0;
  let ocrTruncated = false;
  if (ocrQueue.length > 0) {
    const targets = ocrQueue.slice(0, MAX_OCR_PAGES);
    if (ocrQueue.length > MAX_OCR_PAGES) {
      ocrTruncated = true;
      warnings.push(`${ocrQueue.length} pages have no text layer; OCR was applied to the first ${MAX_OCR_PAGES} only.`);
    }
    let failures = 0;
    const worker = async (pageNums: number[]) => {
      for (const pn of pageNums) {
        if (signal?.aborted) throw new ExtractionError('ABORTED', 'Extraction cancelled');
        try {
          const dataUrl = await renderPageToImage(pdf, pn);
          const text = await ocrViaEdge(dataUrl, pn);
          const entry = pages[pn - 1];
          if (text.trim()) { entry.text = text; entry.source = 'ocr'; }
        } catch (e) {
          failures++;
          warnings.push(`Page ${pn}: OCR failed (${(e as Error).message})`);
        } finally {
          ocrDone++;
          onProgress?.({ stage: 'ocr', page: pn, totalPages, ocrPages: targets.length, detail: `OCR ${ocrDone}/${targets.length}` });
        }
      }
    };
    const buckets: number[][] = Array.from({ length: OCR_CONCURRENCY }, () => []);
    targets.forEach((pn, idx) => buckets[idx % OCR_CONCURRENCY].push(pn));
    await Promise.all(buckets.map(worker));
    if (failures === targets.length && targets.length > 0 && pages.every((p) => !p.text.trim())) {
      throw new ExtractionError('OCR_FAILED', 'The PDF appears to be image-only and OCR could not read it.');
    }
  }

  pdf.destroy();

  const nonEmpty = pages.filter((p) => p.text.trim().length > 0);
  const totalChars = nonEmpty.reduce((a, p) => a + p.text.length, 0);
  const ocrPages = pages.filter((p) => p.source === 'ocr').length;
  if (totalChars < 200) {
    throw new ExtractionError('EMPTY', ocrQueue.length ? 'No readable text could be recovered from this PDF (image-only pages could not be read).' : 'This PDF contains no extractable text.');
  }
  const method = ocrPages === 0 ? 'pdf-text' : ocrPages === nonEmpty.length ? 'pdf-ocr' : 'pdf-mixed';
  onProgress?.({ stage: 'done', page: totalPages, totalPages, ocrPages });
  return {
    pages: nonEmpty,
    pageCount: totalPages,
    method,
    totalChars,
    emptyPages: totalPages - nonEmpty.length,
    ocrPages,
    warnings: ocrTruncated ? warnings : warnings.slice(0, 20),
    pageBasis: 'real',
  };
}

interface TextItemLike { str?: string; hasEOL?: boolean; transform?: number[]; width?: number }

/** Rebuild lines from positioned glyph runs so table rows stay on one line. */
function assembleText(items: TextItemLike[]): string {
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  for (const it of items) {
    if (!it.str && !it.hasEOL) continue;
    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;
    let line = lines.length ? lines[lines.length - 1] : undefined;
    if (!line || Math.abs(line.y - y) > 3) {
      line = lines.find((l) => Math.abs(l.y - y) <= 3);
      if (!line) { line = { y, parts: [] }; lines.push(line); }
    }
    if (it.str) line.parts.push({ x, str: it.str });
  }
  lines.sort((a, b) => b.y - a.y);
  const out: string[] = [];
  for (const line of lines) {
    line.parts.sort((a, b) => a.x - b.x);
    let s = '';
    let lastEnd = -Infinity;
    for (const p of line.parts) {
      const gap = p.x - lastEnd;
      if (s && gap > 12) s += ' | ';
      else if (s && gap > 1 && !s.endsWith(' ') && !p.str.startsWith(' ')) s += ' ';
      s += p.str;
      lastEnd = p.x + (p.str.length * 4.5);
    }
    if (s.trim()) out.push(s.replace(/\s+\|\s+/g, ' | ').trim());
  }
  return out.join('\n');
}

async function renderPageToImage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(2, 1600 / base.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  page.cleanup();
  canvas.width = 0; canvas.height = 0;
  return dataUrl;
}

async function ocrViaEdge(dataUrl: string, page: number): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ocr-page`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl, page }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `OCR service error ${res.status}`);
  return typeof body.text === 'string' ? body.text : '';
}

// ---------------------------------------------------------------- DOCX

async function extractDocx(file: File, onProgress?: (p: ExtractionProgress) => void): Promise<ExtractionResult> {
  onProgress?.({ stage: 'opening', page: 0, totalPages: 0 });
  const mammoth = await import('mammoth');
  let text = '';
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value ?? '';
  } catch (e) {
    throw new ExtractionError('CORRUPT', `The DOCX file could not be read: ${(e as Error).message}`);
  }
  return paginate(text, 'docx', onProgress);
}

// ---------------------------------------------------------------- TXT / CSV

async function extractPlainText(file: File, onProgress?: (p: ExtractionProgress) => void): Promise<ExtractionResult> {
  onProgress?.({ stage: 'opening', page: 0, totalPages: 0 });
  const text = await file.text();
  return paginate(text, 'text', onProgress);
}

function paginate(text: string, method: 'docx' | 'text', onProgress?: (p: ExtractionProgress) => void): ExtractionResult {
  const clean = text.replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
  if (clean.length < 200) throw new ExtractionError('EMPTY', 'The document contains almost no text.');
  const TARGET = 3000;
  const paragraphs = clean.split(/\n{2,}|\n(?=[A-Z0-9])/);
  const pages: PageText[] = [];
  let buf = '';
  for (const para of paragraphs) {
    if (buf.length + para.length > TARGET && buf) { pages.push({ page: pages.length + 1, text: buf.trim(), source: 'approximate' }); buf = ''; }
    buf += para + '\n';
  }
  if (buf.trim()) pages.push({ page: pages.length + 1, text: buf.trim(), source: 'approximate' });
  onProgress?.({ stage: 'done', page: pages.length, totalPages: pages.length });
  return {
    pages,
    pageCount: pages.length,
    method,
    totalChars: clean.length,
    emptyPages: 0,
    ocrPages: 0,
    warnings: ['Page numbers are approximate for this file type (blocks of ~3000 characters).'],
    pageBasis: 'approximate',
  };
}
