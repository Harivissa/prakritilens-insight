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
  /** OCR attempts spent on this page (scanned mode) */
  ocrAttempts?: number;
}

/** How the PDF was read: 'text' = text layer, 'scanned' = mostly image pages (OCR), 'mixed' = some OCR pages */
export type PdfMode = 'text' | 'scanned' | 'mixed';

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
  /** PDF only */
  mode?: PdfMode;
  /** Total OCR re-tries performed (renders beyond the first per page) */
  ocrRetries?: number;
  /** Pages that stayed unreadable after every OCR attempt */
  unreadablePages?: number[];
}

export interface ExtractionProgress {
  stage: 'opening' | 'extracting' | 'ocr' | 'done';
  page: number;
  totalPages: number;
  ocrPages?: number;
  detail?: string;
  mode?: PdfMode;
  /** Current OCR attempt for `page` (1-based) */
  attempt?: number;
  /** OCR pages finished so far */
  ocrDone?: number;
}

const MIN_PAGE_CHARS_FOR_TEXT = 40;
const MAX_OCR_PAGES_MIXED = 40;
const MAX_OCR_PAGES_SCANNED = 60;
const OCR_CONCURRENCY = 3;
/** A document is treated as scanned when at least this share of pages has no usable text layer */
const SCANNED_SHARE = 0.5;
/** Minimum readability (0..1) for OCR / text-layer output to be accepted without another attempt */
const READABLE_THRESHOLD = 0.6;

/**
 * Escalating render settings for OCR. Each retry renders the page larger and with
 * contrast enhancement so faint scans, small print and low-quality photocopies get a second chance.
 */
const OCR_ATTEMPTS: RenderSettings[] = [
  { maxWidth: 1600, format: 'jpeg', quality: 0.82, enhance: false },
  { maxWidth: 2400, format: 'jpeg', quality: 0.9, enhance: true },
  { maxWidth: 2800, format: 'png', enhance: true, binarize: true },
];
const OCR_TRANSIENT_RETRIES = 2;

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.csv'];

interface RenderSettings { maxWidth: number; format: 'jpeg' | 'png'; quality?: number; enhance: boolean; binarize?: boolean }

/**
 * 0..1 estimate of whether text looks like real language rather than OCR noise or a
 * garbled font encoding. Word-like tokens, letter share and sane word length all count.
 */
export function readabilityScore(text: string): number {
  const stripped = text.replace(/\s+/g, '');
  if (stripped.length < MIN_PAGE_CHARS_FOR_TEXT) return 0;
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const wordLike = tokens.filter((t) => /^[A-Za-z][A-Za-z'’\-]{1,}[.,;:!?)]*$/.test(t) || /^[($€£]?[\d][\d.,%]*[)%]?$/.test(t) || /^[A-Za-z0-9][A-Za-z0-9.,;:%()\-'’/&|]*$/.test(t) && /[aeiouAEIOU0-9]/.test(t)).length;
  const letters = (stripped.match(/[A-Za-z]/g) ?? []).length;
  const digits = (stripped.match(/\d/g) ?? []).length;
  const letterShare = (letters + digits) / stripped.length;
  const avgLen = stripped.length / tokens.length;
  let score = 0.7 * (wordLike / tokens.length) + 0.3 * letterShare;
  if (avgLen > 16) score *= 0.5; // glued-together glyphs
  if (avgLen < 2.2) score *= 0.6; // exploded single characters
  return Math.max(0, Math.min(1, score));
}

export const isReadable = (text: string) => readabilityScore(text) >= READABLE_THRESHOLD;

class OcrServiceError extends Error {
  retryAfterMs?: number;
  constructor(message: string, public status: number, public code?: string) { super(message); }
  get transient() { return this.status === 429 || this.status >= 500 || this.status === 0; }
  get terminal() { return this.status === 401 || this.status === 402 || this.status === 403; }
}

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
  let garbledPages = 0;

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
    const hasText = text.replace(/\s+/g, '').length >= MIN_PAGE_CHARS_FOR_TEXT;
    if (!hasText) {
      ocrQueue.push(i);
      pages.push({ page: i, text: '', source: 'text' });
    } else if (!isReadable(text)) {
      // Text layer exists but is garbage (broken font encoding / vector outlines) — treat like a scan.
      garbledPages++;
      ocrQueue.push(i);
      pages.push({ page: i, text: '', source: 'text' });
    } else {
      pages.push({ page: i, text, source: 'text' });
    }
    if (i % 5 === 0 || i === totalPages) onProgress?.({ stage: 'extracting', page: i, totalPages, ocrPages: ocrQueue.length });
  }

  const mode: PdfMode = ocrQueue.length === 0 ? 'text' : ocrQueue.length / totalPages >= SCANNED_SHARE ? 'scanned' : 'mixed';
  if (garbledPages) warnings.push(`${garbledPages} page(s) had an unreadable text layer and were re-read with OCR.`);

  // ---- OCR image-only / garbled pages (scanned mode retries until readable) ----
  let ocrDone = 0;
  let ocrRetries = 0;
  let ocrTruncated = false;
  const unreadablePages: number[] = [];
  if (ocrQueue.length > 0) {
    const maxOcr = mode === 'scanned' ? MAX_OCR_PAGES_SCANNED : MAX_OCR_PAGES_MIXED;
    const targets = ocrQueue.slice(0, maxOcr);
    if (ocrQueue.length > maxOcr) {
      ocrTruncated = true;
      warnings.push(`${ocrQueue.length} pages have no readable text layer; OCR was applied to the first ${maxOcr} only.`);
    }
    onProgress?.({ stage: 'ocr', page: targets[0], totalPages, ocrPages: targets.length, ocrDone: 0, mode, attempt: 1, detail: `OCR 0/${targets.length}` });

    let failures = 0;
    let fatal: OcrServiceError | null = null;
    const worker = async (pageNums: number[]) => {
      for (const pn of pageNums) {
        if (signal?.aborted) throw new ExtractionError('ABORTED', 'Extraction cancelled');
        if (fatal) return;
        const entry = pages[pn - 1];
        let best = { text: '', score: 0 };
        let attemptsUsed = 0;
        try {
          for (let a = 0; a < OCR_ATTEMPTS.length; a++) {
            attemptsUsed = a + 1;
            if (a > 0) ocrRetries++;
            onProgress?.({ stage: 'ocr', page: pn, totalPages, ocrPages: targets.length, ocrDone, mode, attempt: a + 1, detail: `OCR ${ocrDone}/${targets.length}` });
            const dataUrl = await renderPageToImage(pdf, pn, OCR_ATTEMPTS[a]);
            const text = await ocrWithTransientRetry(dataUrl, pn, signal);
            const score = readabilityScore(text);
            if (score > best.score) best = { text, score };
            if (score >= READABLE_THRESHOLD) break;
            if (a === OCR_ATTEMPTS.length - 1 && text.trim().length === 0 && best.text.length === 0) break; // genuinely blank page
          }
        } catch (e) {
          if (e instanceof OcrServiceError && e.terminal) { fatal = e; return; }
          if (e instanceof ExtractionError) throw e;
          failures++;
          warnings.push(`Page ${pn}: OCR failed (${(e as Error).message})`);
        } finally {
          ocrDone++;
          onProgress?.({ stage: 'ocr', page: pn, totalPages, ocrPages: targets.length, ocrDone, mode, attempt: attemptsUsed, detail: `OCR ${ocrDone}/${targets.length}` });
        }
        entry.ocrAttempts = attemptsUsed;
        if (best.text.trim()) {
          entry.text = best.text;
          entry.source = 'ocr';
          if (best.score < READABLE_THRESHOLD) {
            unreadablePages.push(pn);
            warnings.push(`Page ${pn}: OCR text still looks noisy after ${attemptsUsed} attempts (readability ${(best.score * 100).toFixed(0)}%).`);
          }
        } else if (attemptsUsed > 0) {
          unreadablePages.push(pn);
        }
      }
    };
    const buckets: number[][] = Array.from({ length: OCR_CONCURRENCY }, () => []);
    targets.forEach((pn, idx) => buckets[idx % OCR_CONCURRENCY].push(pn));
    await Promise.all(buckets.map(worker));

    if (fatal) {
      pdf.destroy();
      const f = fatal as OcrServiceError;
      throw new ExtractionError('OCR_FAILED', `OCR is unavailable right now (${f.message}). ${mode === 'scanned' ? 'This PDF is scanned, so it cannot be read until OCR is available.' : 'Image-only pages could not be read.'}`);
    }
    const readableOcr = targets.filter((pn) => pages[pn - 1].source === 'ocr' && !unreadablePages.includes(pn)).length;
    if (mode === 'scanned' && targets.length > 0 && readableOcr === 0) {
      pdf.destroy();
      throw new ExtractionError('OCR_FAILED', `This PDF is scanned and OCR could not read any of its ${targets.length} pages after ${OCR_ATTEMPTS.length} attempts each${failures ? ` (${failures} service failures)` : ''}. Try a higher-resolution scan.`);
    }
    if (mode === 'scanned' && readableOcr < targets.length * 0.5) {
      warnings.push(`Scanned PDF: only ${readableOcr} of ${targets.length} pages were readable after OCR retries; analysis will be based on those pages.`);
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
  onProgress?.({ stage: 'done', page: totalPages, totalPages, ocrPages, mode });
  return {
    pages: nonEmpty,
    pageCount: totalPages,
    method,
    totalChars,
    emptyPages: totalPages - nonEmpty.length,
    ocrPages,
    warnings: ocrTruncated ? warnings : warnings.slice(0, 20),
    pageBasis: 'real',
    mode,
    ocrRetries,
    unreadablePages,
  };
}

/** Retries the OCR service on rate limits / transient failures with backoff; terminal errors propagate. */
async function ocrWithTransientRetry(dataUrl: string, page: number, signal?: AbortSignal): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i <= OCR_TRANSIENT_RETRIES; i++) {
    if (signal?.aborted) throw new ExtractionError('ABORTED', 'Extraction cancelled');
    try {
      return await ocrViaEdge(dataUrl, page);
    } catch (e) {
      lastErr = e;
      if (!(e instanceof OcrServiceError) || !e.transient || i === OCR_TRANSIENT_RETRIES) throw e;
      const wait = e.retryAfterMs ?? 1500 * 2 ** i + Math.random() * 500;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
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

/** Server-side OCR accepts data URLs up to ~6 MB; stay under it even for large PNG renders. */
const MAX_OCR_DATA_URL = 5.5 * 1024 * 1024;

async function renderPageToImage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number, s: RenderSettings): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(4, s.maxWidth / base.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: s.enhance });
  if (!ctx) throw new Error('Canvas not available');
  // White backdrop: scans with transparency otherwise OCR as black pages.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  if (s.enhance) enhanceForOcr(ctx, canvas.width, canvas.height, !!s.binarize);
  let dataUrl = s.format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', s.quality ?? 0.85);
  if (dataUrl.length > MAX_OCR_DATA_URL) dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  page.cleanup();
  canvas.width = 0; canvas.height = 0;
  return dataUrl;
}

/** Grayscale + percentile contrast stretch (optionally adaptive threshold) to lift faint or low-contrast scans. */
function enhanceForOcr(ctx: CanvasRenderingContext2D, w: number, h: number, binarize: boolean) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const n = w * h;
  const gray = new Uint8ClampedArray(n);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const g = (d[p] * 299 + d[p + 1] * 587 + d[p + 2] * 114) / 1000;
    gray[i] = g;
    hist[g | 0]++;
  }
  // 1st / 99th percentile bounds
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.01) { hi = v; break; } }
  const range = Math.max(1, hi - lo);
  let sum = 0;
  for (let i = 0; i < n; i++) { const v = Math.max(0, Math.min(255, ((gray[i] - lo) / range) * 255)); gray[i] = v; sum += v; }
  const threshold = binarize ? Math.min(200, Math.max(110, (sum / n) * 0.85)) : 0;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const v = binarize ? (gray[i] < threshold ? 0 : 255) : gray[i];
    d[p] = d[p + 1] = d[p + 2] = v;
    d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

async function ocrViaEdge(dataUrl: string, page: number): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new OcrServiceError('Not authenticated', 401);
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/ocr-page`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, page }),
    });
  } catch (e) {
    throw new OcrServiceError(`network error (${(e as Error).message})`, 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new OcrServiceError(body.error || `OCR service error ${res.status}`, res.status, body.code);
    const ra = Number(res.headers.get('Retry-After'));
    if (Number.isFinite(ra) && ra > 0) err.retryAfterMs = ra * 1000;
    throw err;
  }
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
