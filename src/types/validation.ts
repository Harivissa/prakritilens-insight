// Document Validation & Processing Types for PrakritiLens

export type DocumentClassification = 'VALID' | 'PARTIAL' | 'INVALID';

export interface ReportMetadata {
  company_name: string;
  reporting_year: number | null;
  reporting_period: string | null;
  industry: string;
  headquarters_country: string;
  document_type: string;
  source: 'ai+heuristic' | 'heuristic';
}

export interface ValidationResult {
  // ---- New contract ----
  classification?: DocumentClassification;
  confidence?: number;
  reasons?: string[];
  signals?: Record<string, unknown>;
  metadata?: ReportMetadata;
  ai_review_available?: boolean;
  ai_review_error?: string | null;
  // ---- Legacy fields consumed by the existing UI ----
  company_name: string;
  detected_year: number | null;
  page_count?: number;
  document_type: 'Annual Report' | 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Unknown';
  contains_esg_sections?: boolean;
  esg_keywords_detected: number;
  keyword_breakdown: {
    environmental: number;
    social: number;
    governance: number;
    frameworks: number;
  };
  detected_frameworks: string[];
  semantic_match_score: number;
  section_headers_found: string[];
  final_validation_status: 'Accepted: ESG/Sustainability Report' | 'Maybe: Needs manual confirmation' | 'Rejected: Not an ESG report';
  confidence_level: 'High' | 'Medium' | 'Low';
  rejection_reason?: string;
  extracted_preview: string;
  validation_details?: {
    keyword_score: number;
    structure_score: number;
    semantic_score: number;
    total_score: number;
  };
}

/** Real processing states of the pipeline */
export type ProcessingStatus =
  | 'UPLOADING'
  | 'UPLOADED'
  | 'EXTRACTING'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'REJECTED'
  | 'ANALYZING'
  | 'GENERATING_REPORT'
  | 'COMPLETED'
  | 'FAILED';

export interface PipelineStatus {
  status: ProcessingStatus;
  /** 0-100 across the whole pipeline */
  progress: number;
  /** Human readable stage description, e.g. "Extracting page 42 of 180" */
  label: string;
  error?: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'extracting' | 'validating' | 'validated' | 'analyzing' | 'generating_report' | 'completed' | 'error' | 'rejected';
  pipelineStatus?: ProcessingStatus;
  stageLabel?: string;
  progress: number;
  error?: string;
  validationResult?: ValidationResult;
  analysisResult?: any;
  reportId?: string;
  storagePath?: string;
  extraction?: {
    pageCount: number;
    method: string;
    totalChars: number;
    ocrPages: number;
    warnings: string[];
  };
  uploadedAt: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
