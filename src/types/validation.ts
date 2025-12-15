// Document Validation Types for PrakritiLens

export interface ValidationResult {
  company_name: string;
  detected_year: number | null;
  page_count: number;
  document_type: 'Annual Report' | 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Unknown';
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

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'extracting' | 'validating' | 'validated' | 'analyzing' | 'completed' | 'error' | 'rejected';
  progress: number;
  error?: string;
  validationResult?: ValidationResult;
  analysisResult?: any;
  uploadedAt: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
