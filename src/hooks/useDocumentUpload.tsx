import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ValidationResult, UploadedFile, PipelineStatus, ProcessingStatus } from '@/types/validation';
import { extractDocument, ExtractionError, detectKind, type ExtractionResult } from '@/lib/documentExtraction';
import type { Json } from '@/integrations/supabase/types';

const toJson = (v: unknown): Json => JSON.parse(JSON.stringify(v ?? null));

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const BUCKET = 'reports';

export const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface StorageUploadResult {
  filePath: string;
  signedUrl: string;
  metadata: {
    originalName: string;
    sanitizedName: string;
    size: number;
    type: string;
    uploadedAt: string;
    companyName?: string;
    reportYear?: number;
  };
}

export interface AnalysisOutcome {
  reportId: string;
  analysis: any;
  warnings: string[];
}

type StatusListener = (s: PipelineStatus) => void;

interface PipelineEntry {
  file: File;
  hash?: string;
  storagePath?: string;
  extraction?: ExtractionResult;
  validation?: ValidationResult;
  reportId?: string;
  runId?: string;
}

// Progress bands per stage so the bar reflects real work
const BAND: Record<ProcessingStatus, [number, number]> = {
  UPLOADING: [0, 18],
  UPLOADED: [18, 20],
  EXTRACTING: [20, 52],
  VALIDATING: [52, 62],
  VALIDATED: [62, 62],
  REJECTED: [62, 62],
  ANALYZING: [62, 92],
  GENERATING_REPORT: [92, 99],
  COMPLETED: [100, 100],
  FAILED: [0, 0],
};
const within = (status: ProcessingStatus, frac: number) => {
  const [lo, hi] = BAND[status];
  return Math.round(lo + (hi - lo) * Math.max(0, Math.min(1, frac)));
};
const uiStatus = (s: ProcessingStatus): UploadedFile['status'] =>
  s === 'UPLOADING' ? 'uploading' : s === 'UPLOADED' ? 'uploaded' : s === 'EXTRACTING' ? 'extracting' : s === 'VALIDATING' ? 'validating' :
  s === 'VALIDATED' ? 'validated' : s === 'REJECTED' ? 'rejected' : s === 'ANALYZING' ? 'analyzing' : s === 'GENERATING_REPORT' ? 'generating_report' :
  s === 'COMPLETED' ? 'completed' : 'error';

export function useDocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const entries = useRef(new Map<string, PipelineEntry>());

  const sanitizeFilename = (name: string): string =>
    name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').substring(0, 100);

  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const addFile = useCallback((file: File): string => {
    const id = crypto.randomUUID();
    entries.current.set(id, { file });
    setFiles((prev) => [...prev, { id, file, name: file.name, size: file.size, type: file.type, status: 'pending', progress: 0, uploadedAt: new Date() }]);
    return id;
  }, []);

  const removeFile = useCallback((id: string) => {
    entries.current.delete(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearFiles = useCallback(() => { entries.current.clear(); setFiles([]); }, []);

  const emit = (id: string, listener: StatusListener | undefined, s: PipelineStatus, extra: Partial<UploadedFile> = {}) => {
    updateFile(id, { status: uiStatus(s.status), pipelineStatus: s.status, progress: s.progress, stageLabel: s.label, error: s.error, ...extra });
    listener?.(s);
  };

  // ------------------------------------------------------------------ storage

  const requireSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required. Please sign in again.');
    return session;
  };

  /** Upload with real byte-level progress through a signed upload URL. */
  const uploadWithProgress = async (path: string, file: File, onProgress: (frac: number) => void): Promise<void> => {
    const session = await requireSession();
    const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error(`Could not start upload: ${error?.message ?? 'no upload URL'}`);
    const url = `${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}?token=${encodeURIComponent(signed.token)}`;
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('apikey', SUPABASE_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      xhr.onerror = () => reject(new Error('Network error during upload. Check your connection and try again.'));
      xhr.onabort = () => reject(new Error('Upload aborted'));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let msg = `Upload failed (${xhr.status})`;
          try { msg = JSON.parse(xhr.responseText).message || JSON.parse(xhr.responseText).error || msg; } catch { /* ignore */ }
          reject(new Error(msg));
        }
      };
      const form = new FormData();
      form.append('cacheControl', '3600');
      form.append('', file, file.name);
      xhr.send(form);
    });
  };

  /** Confirm the object exists in storage with the expected size. */
  const verifyStored = async (path: string, expectedSize: number): Promise<void> => {
    const folder = path.substring(0, path.lastIndexOf('/'));
    const name = path.substring(path.lastIndexOf('/') + 1);
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { search: name, limit: 5 });
    if (error) throw new Error(`Could not verify upload: ${error.message}`);
    const obj = data?.find((o) => o.name === name);
    if (!obj) throw new Error('Upload verification failed: file not found in storage.');
    const size = (obj.metadata as { size?: number } | null)?.size;
    if (typeof size === 'number' && size !== expectedSize) throw new Error(`Upload verification failed: stored size ${size} differs from ${expectedSize}.`);
  };

  const deleteFromStorage = async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) console.error('Error deleting file from storage:', error);
  };

  /** Legacy helper kept for callers that only need a storage upload. */
  const uploadToStorage = async (file: File, validation?: ValidationResult): Promise<StorageUploadResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    const filePath = finalStoragePath(user.id, file, validation);
    await uploadWithProgress(filePath, file, () => {});
    const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 60 * 60 * 24 * 7);
    if (error || !signed?.signedUrl) throw new Error('Failed to create secure file access URL');
    return {
      filePath, signedUrl: signed.signedUrl,
      metadata: { originalName: file.name, sanitizedName: sanitizeFilename(file.name), size: file.size, type: file.type, uploadedAt: new Date().toISOString(), companyName: validation?.company_name, reportYear: validation?.detected_year || undefined },
    };
  };

  const finalStoragePath = (userId: string, file: File, validation?: ValidationResult) => {
    const year = validation?.detected_year || new Date().getFullYear();
    const company = validation?.company_name && validation.company_name !== 'Not disclosed' ? sanitizeFilename(validation.company_name.substring(0, 30)) : 'unknown_company';
    return `${userId}/${year}/${company}/${Date.now()}_${sanitizeFilename(file.name)}`;
  };

  // ------------------------------------------------------------------ helpers

  const sha256 = async (file: File): Promise<string> => {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const callFunction = async <T,>(name: string, body: unknown): Promise<T> => {
    const session = await requireSession();
    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(`Network error while contacting the ${name.replace(/-/g, ' ')} service.`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      const code = data?.code ? ` [${data.code}]` : '';
      throw new Error(`${data?.error || `${name} failed (${res.status})`}${code}`);
    }
    return data as T;
  };

  // ------------------------------------------------------------------ stage 1: upload + extract + validate

  const uploadAndValidate = useCallback(async (file: File, onStatus?: StatusListener): Promise<{ id: string; validation: ValidationResult | null }> => {
    if (!detectKind(file)) {
      toast({ title: 'Invalid File Type', description: 'Accepted formats: PDF, DOCX, TXT, CSV', variant: 'destructive' });
      return { id: '', validation: null };
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File Too Large', description: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`, variant: 'destructive' });
      return { id: '', validation: null };
    }
    if (file.size === 0) {
      toast({ title: 'Empty File', description: 'The selected file is empty.', variant: 'destructive' });
      return { id: '', validation: null };
    }

    const id = addFile(file);
    const entry = entries.current.get(id)!;
    setIsProcessing(true);
    let uploadedPath: string | undefined;

    try {
      const session = await requireSession();
      const userId = session.user.id;

      // Duplicate detection by content hash
      entry.hash = await sha256(file);
      const { data: dup } = await supabase.from('reports').select('id, company_name, created_at, status').eq('user_id', userId).eq('hash', entry.hash).limit(1);
      if (dup && dup.length > 0 && dup[0].status !== 'FAILED') {
        throw new Error(`This exact file was already analysed on ${new Date(dup[0].created_at).toLocaleDateString()} (${dup[0].company_name || 'company not disclosed'}). Delete that report to analyse it again.`);
      }

      // UPLOADING
      emit(id, onStatus, { status: 'UPLOADING', progress: 0, label: 'Uploading to secure storage…' });
      const stagingPath = `${userId}/${new Date().getFullYear()}/_incoming/${Date.now()}_${sanitizeFilename(file.name)}`;
      await uploadWithProgress(stagingPath, file, (frac) => emit(id, onStatus, { status: 'UPLOADING', progress: within('UPLOADING', frac), label: `Uploading… ${Math.round(frac * 100)}%` }));
      uploadedPath = stagingPath;

      // UPLOADED (verified)
      await verifyStored(stagingPath, file.size);
      entry.storagePath = stagingPath;
      emit(id, onStatus, { status: 'UPLOADED', progress: within('UPLOADED', 1), label: 'Upload verified' }, { storagePath: stagingPath });

      // EXTRACTING
      emit(id, onStatus, { status: 'EXTRACTING', progress: within('EXTRACTING', 0), label: 'Opening document…' });
      const extraction = await extractDocument(file, (p) => {
        if (p.stage === 'extracting') emit(id, onStatus, { status: 'EXTRACTING', progress: within('EXTRACTING', (p.page / Math.max(p.totalPages, 1)) * 0.5), label: `Extracting page ${p.page} of ${p.totalPages}${p.ocrPages ? ` (${p.ocrPages} image pages queued for OCR)` : ''}` });
        else if (p.stage === 'ocr') {
          const done = p.ocrDone ?? 0;
          const total = Math.max(p.ocrPages ?? 1, 1);
          const modeLabel = p.mode === 'scanned' ? 'Scanned PDF detected — reading pages with OCR' : 'Reading image pages with OCR';
          const attempt = p.attempt && p.attempt > 1 ? ` · retry ${p.attempt - 1} at higher resolution` : '';
          emit(id, onStatus, { status: 'EXTRACTING', progress: within('EXTRACTING', 0.5 + 0.5 * (done / total)), label: `${modeLabel} — page ${p.page}, ${done}/${total} done${attempt}` });
        }
      });
      entry.extraction = extraction;
      updateFile(id, { extraction: { pageCount: extraction.pageCount, method: extraction.method, totalChars: extraction.totalChars, ocrPages: extraction.ocrPages, warnings: extraction.warnings, mode: extraction.mode, ocrRetries: extraction.ocrRetries, unreadablePages: extraction.unreadablePages } });

      // VALIDATING
      emit(id, onStatus, { status: 'VALIDATING', progress: within('VALIDATING', 0.2), label: `Checking whether this is an ESG report (${extraction.pages.length} pages, ${extraction.totalChars.toLocaleString()} characters)…` });
      const validation = await callFunction<ValidationResult>('validate-document', {
        fileName: file.name,
        pages: extraction.pages.map((p) => ({ page: p.page, text: p.text })),
        extractionMethod: extraction.method,
      });
      if (extraction.pageBasis === 'real') validation.page_count = extraction.pageCount;
      entry.validation = validation;

      if (validation.classification === 'INVALID' || validation.final_validation_status === 'Rejected: Not an ESG report') {
        await deleteFromStorage(stagingPath);
        entry.storagePath = undefined;
        emit(id, onStatus, { status: 'REJECTED', progress: 100, label: 'Rejected: not an ESG report', error: validation.rejection_reason }, { validationResult: validation, storagePath: undefined });
        return { id, validation };
      }
      emit(id, onStatus, { status: 'VALIDATED', progress: within('VALIDATED', 1), label: validation.classification === 'PARTIAL' ? 'Needs your confirmation' : 'Validated as ESG report' }, { validationResult: validation });
      return { id, validation };
    } catch (error) {
      const message = describeError(error);
      console.error('Upload/validation pipeline failed:', error);
      if (uploadedPath) await deleteFromStorage(uploadedPath);
      entry.storagePath = undefined;
      emit(id, onStatus, { status: 'FAILED', progress: 0, label: 'Failed', error: message });
      return { id, validation: null };
    } finally {
      setIsProcessing(false);
    }
  }, [addFile, updateFile]);

  // ------------------------------------------------------------------ stage 2: analyse (after user confirmation)

  const runAnalysis = useCallback(async (id: string, options: { onStatus?: StatusListener; weights?: { environmental: number; social: number; governance: number } } = {}): Promise<AnalysisOutcome> => {
    const { onStatus, weights } = options;
    const entry = entries.current.get(id);
    if (!entry || !entry.extraction || !entry.validation || !entry.storagePath) {
      throw new Error('This file has not been validated yet. Upload it again.');
    }
    setIsProcessing(true);
    const warnings: string[] = [];
    let reportId: string | undefined;
    let finalPath = entry.storagePath;

    try {
      const session = await requireSession();
      const userId = session.user.id;
      const { file, extraction, validation } = entry;
      const meta = validation.metadata;
      const companyName = meta?.company_name && meta.company_name.trim() ? meta.company_name : (validation.company_name || 'Not disclosed');
      const reportYear = meta?.reporting_year ?? validation.detected_year ?? null;

      emit(id, onStatus, { status: 'ANALYZING', progress: within('ANALYZING', 0.02), label: 'Preparing report record…' });

      // Move into the final folder structure now that we know year/company
      const target = finalStoragePath(userId, file, { ...validation, company_name: companyName, detected_year: reportYear });
      const { error: moveErr } = await supabase.storage.from(BUCKET).move(entry.storagePath, target);
      if (!moveErr) { finalPath = target; entry.storagePath = target; }
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(finalPath, 60 * 60 * 24 * 7);

      // Report row (status ANALYZING) — becomes COMPLETED only when the backend finishes
      const { data: report, error: rErr } = await supabase.from('reports').insert({
        user_id: userId,
        company_name: companyName,
        file_name: file.name,
        file_url: signed?.signedUrl ?? null,
        storage_path: finalPath,
        hash: entry.hash ?? crypto.randomUUID(),
        score: null,
        analysis_data: null,
        report_year: reportYear,
        page_count: extraction.pageCount,
        validation_status: validation.final_validation_status,
        confidence_level: validation.confidence_level,
        document_type: meta?.document_type ?? validation.document_type,
        metadata: toJson({ ...(meta ?? {}), company_name: companyName, reporting_year: reportYear, extraction: { method: extraction.method, mode: extraction.mode ?? null, total_chars: extraction.totalChars, ocr_pages: extraction.ocrPages, ocr_retries: extraction.ocrRetries ?? 0, unreadable_pages: extraction.unreadablePages ?? [], page_basis: extraction.pageBasis, warnings: extraction.warnings.slice(0, 10) }, file: { name: file.name, size: file.size, type: file.type } }),
        validation: toJson({ classification: validation.classification, confidence: validation.confidence, reasons: validation.reasons, signals: validation.signals, ai_review_available: validation.ai_review_available }),
        status: 'ANALYZING',
      }).select('id').single();
      if (rErr || !report) throw new Error(`Could not create report record: ${rErr?.message ?? 'unknown error'}`);
      reportId = report.id;
      entry.reportId = reportId;
      updateFile(id, { reportId });

      await supabase.from('report_documents').insert({ report_id: reportId, user_id: userId, storage_path: finalPath, file_name: file.name, mime_type: file.type || null, size_bytes: file.size, page_count: extraction.pageCount, extraction_method: extraction.method });

      // Store page text (source of truth for analysis, chat and citations)
      const rows = extraction.pages.map((p) => ({ report_id: reportId!, user_id: userId, page_number: p.page, text: p.text, char_count: p.text.length, source: p.source }));
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase.from('document_pages').insert(rows.slice(i, i + 100));
        if (error) throw new Error(`Could not store page text: ${error.message}`);
        emit(id, onStatus, { status: 'ANALYZING', progress: within('ANALYZING', 0.02 + 0.13 * Math.min(1, (i + 100) / rows.length)), label: `Storing page text ${Math.min(i + 100, rows.length)}/${rows.length}…` });
      }

      const { data: run } = await supabase.from('analysis_runs').insert({ report_id: reportId, user_id: userId, status: 'ANALYZING', stage: 'queued', progress: 55 }).select('id').single();
      entry.runId = run?.id;

      // Poll the run row for real backend stage updates while the analysis executes
      const stageLabels: Record<string, string> = {
        queued: 'Waiting for analysis engine…', started: 'Analysis started…', selecting_pages: 'Selecting the most relevant pages…',
        extracting_metrics: 'Extracting ESG metrics with evidence (AI)…', verifying_evidence: 'Verifying every citation against the document…',
        scoring: 'Computing scores from verified metrics…', saving_results: 'Saving results…', completed: 'Analysis complete',
      };
      let polling = true;
      const poll = (async () => {
        while (polling && run?.id) {
          await new Promise((r) => setTimeout(r, 2500));
          if (!polling) break;
          const { data } = await supabase.from('analysis_runs').select('stage, progress, status').eq('id', run.id).maybeSingle();
          if (data?.stage && data.status === 'ANALYZING') {
            const frac = Math.max(0.15, Math.min(0.98, ((data.progress ?? 55) - 55) / 45));
            emit(id, onStatus, { status: 'ANALYZING', progress: within('ANALYZING', frac), label: stageLabels[data.stage] ?? data.stage });
          }
        }
      })();

      let analysis: any;
      try {
        const result = await callFunction<{ analysis: any }>('analyze-esg', { reportId, runId: run?.id, weights });
        analysis = result.analysis;
      } finally {
        polling = false;
        await poll.catch(() => {});
      }

      // GENERATING_REPORT: build retrieval index for the chatbot
      emit(id, onStatus, { status: 'GENERATING_REPORT', progress: within('GENERATING_REPORT', 0.3), label: 'Indexing report for the AI assistant…' });
      try {
        await callFunction('generate-embeddings', { reportId });
      } catch (e) {
        warnings.push(`Chat index could not be built: ${describeError(e)}`);
      }

      emit(id, onStatus, { status: 'COMPLETED', progress: 100, label: 'Completed' }, { analysisResult: analysis });
      return { reportId: reportId!, analysis, warnings };
    } catch (error) {
      const message = describeError(error);
      console.error('Analysis pipeline failed:', error);
      // Roll back: no half-finished reports
      if (reportId) await supabase.from('reports').delete().eq('id', reportId);
      if (finalPath) await deleteFromStorage(finalPath);
      entry.storagePath = undefined;
      entry.reportId = undefined;
      emit(id, onStatus, { status: 'FAILED', progress: 0, label: 'Analysis failed', error: message });
      throw new Error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [updateFile]);

  /** Discard a validated-but-not-analysed file (user declined) */
  const discard = useCallback(async (id: string) => {
    const entry = entries.current.get(id);
    if (entry?.storagePath && !entry.reportId) await deleteFromStorage(entry.storagePath);
    if (entry) entry.storagePath = undefined;
  }, []);

  const getEntry = useCallback((id: string) => {
    const e = entries.current.get(id);
    return e ? { validation: e.validation, extraction: e.extraction, reportId: e.reportId, storagePath: e.storagePath } : undefined;
  }, []);

  return {
    files,
    isProcessing,
    addFile,
    removeFile,
    uploadAndValidate,
    runAnalysis,
    discard,
    getEntry,
    uploadToStorage,
    deleteFromStorage,
    updateFile,
    clearFiles,
    acceptedTypes: ACCEPTED_TYPES,
    sanitizeFilename,
  };
}

function describeError(error: unknown): string {
  if (error instanceof ExtractionError) return error.message;
  if (error instanceof Error) {
    const m = error.message;
    if (/RATE_LIMITED/.test(m)) return 'The AI service is busy (rate limited). Please try again in a minute.';
    if (/QUOTA_EXCEEDED/.test(m)) return 'The AI service quota is exhausted. Contact the administrator.';
    if (/INVALID_API_KEY|MISSING_API_KEY/.test(m)) return 'The AI service is not configured correctly. Contact the administrator.';
    if (/TIMEOUT/.test(m)) return 'The AI service timed out. Try again; very large documents may need a second attempt.';
    if (/MALFORMED_RESPONSE/.test(m)) return 'The AI service returned an unreadable response. Please retry.';
    if (/Failed to fetch|NetworkError|Network error/i.test(m)) return 'Network error. Check your connection and try again.';
    return m;
  }
  return 'Unexpected error';
}
