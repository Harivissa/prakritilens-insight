import { useState, useCallback } from 'react';
import { useDocumentUpload } from './useDocumentUpload';
import type { PipelineStatus } from '@/types/validation';

/**
 * Deterministic content hash used by legacy callers for de-duplication display.
 * The pipeline itself stores a SHA-256 of the file bytes on the report row.
 */
export const generateContentHash = (text: string): string => {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[^\w\s]/g, '');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Compatibility wrapper around the real upload → extract → validate → analyse pipeline.
 * `analyzeDocument` rejects non-ESG documents (no scores are produced for them) and
 * returns the persisted analysis for accepted ones.
 */
export function useESGScoring() {
  const pipeline = useDocumentUpload();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; percent: number; details?: string }>({ stage: '', percent: 0 });

  const onStatus = (s: PipelineStatus) => setProgress({ stage: s.status, percent: s.progress, details: s.label });

  const analyzeDocument = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try {
      const { id, validation } = await pipeline.uploadAndValidate(file, onStatus);
      if (!id) throw new Error('File was not accepted for upload.');
      if (!validation) {
        const entry = pipeline.files.find((f) => f.id === id);
        throw new Error(entry?.error || 'Document could not be processed.');
      }
      if (validation.classification === 'INVALID' || validation.final_validation_status === 'Rejected: Not an ESG report') {
        throw new Error(validation.rejection_reason || 'This document is not an ESG / sustainability / annual report and was not analysed.');
      }
      const { reportId, analysis } = await pipeline.runAnalysis(id, { onStatus });
      return { ...analysis, reportId, extractedText: '', validation_status: 'validated' };
    } finally {
      setIsAnalyzing(false);
    }
  }, [pipeline]);

  return { analyzeDocument, isAnalyzing, progress };
}
