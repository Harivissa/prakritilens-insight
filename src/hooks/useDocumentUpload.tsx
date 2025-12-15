import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ValidationResult, UploadedFile } from '@/types/validation';

// Supabase project URL
const SUPABASE_URL = 'https://rtztgxtqlyrixmskozfi.supabase.co';

// Accepted file types
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

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

export function useDocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate file type
  const validateFileType = (file: File): boolean => {
    const validTypes = Object.keys(ACCEPTED_TYPES);
    const validExtensions = Object.values(ACCEPTED_TYPES).flat();
    const fileName = file.name.toLowerCase();
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => fileName.endsWith(ext));
  };

  // Sanitize filename - remove unsafe characters
  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100);
  };

  // Generate storage path with proper folder structure
  const generateStoragePath = (
    userId: string, 
    file: File, 
    validation?: ValidationResult
  ): string => {
    const sanitizedName = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const year = validation?.detected_year || new Date().getFullYear();
    const companySlug = validation?.company_name 
      ? sanitizeFilename(validation.company_name.substring(0, 30))
      : 'unknown';
    
    // Folder structure: user_id/year/company/timestamp_filename
    return `${userId}/${year}/${companySlug}/${timestamp}_${sanitizedName}`;
  };

  // Update file status
  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  // Add file to queue
  const addFile = useCallback((file: File): string => {
    const id = crypto.randomUUID();
    const uploadedFile: UploadedFile = {
      id,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      uploadedAt: new Date(),
    };
    setFiles(prev => [...prev, uploadedFile]);
    return id;
  }, []);

  // Remove file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Upload file to Supabase Storage with proper folder structure
  const uploadToStorage = async (
    file: File, 
    validation?: ValidationResult
  ): Promise<StorageUploadResult> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');

    const filePath = generateStoragePath(user.id, file, validation);
    const sanitizedName = sanitizeFilename(file.name);

    console.log(`Uploading to storage: ${filePath}`);

    // Upload with content type
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Create signed URL (7 days validity)
    const { data: signed, error: signError } = await supabase.storage
      .from('reports')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    if (signError || !signed?.signedUrl) {
      throw new Error('Failed to create secure file access URL');
    }

    return {
      filePath,
      signedUrl: signed.signedUrl,
      metadata: {
        originalName: file.name,
        sanitizedName,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        companyName: validation?.company_name,
        reportYear: validation?.detected_year || undefined,
      },
    };
  };

  // Delete file from storage
  const deleteFromStorage = async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage
      .from('reports')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting file from storage:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  };

  // Extract text from document via edge function
  const extractText = async (file: File): Promise<{ text: string; pageCount: number }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/extract-pdf-text`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Extraction failed' }));
      throw new Error(error.error || `Extraction failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return {
      text: result.text || '',
      pageCount: result.pageCount || 1,
    };
  };

  // Validate document content via edge function
  const validateDocument = async (
    text: string, 
    fileName: string, 
    pageCount: number
  ): Promise<ValidationResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/validate-document`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, fileName, pageCount }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Validation failed' }));
      throw new Error(error.error || `Validation failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  };

  // Process single file through the complete pipeline
  const processFile = useCallback(async (id: string): Promise<ValidationResult | null> => {
    const fileEntry = files.find(f => f.id === id);
    if (!fileEntry) return null;

    setIsProcessing(true);

    try {
      // Validate file type
      if (!validateFileType(fileEntry.file)) {
        updateFile(id, {
          status: 'error',
          error: `Invalid file type. Accepted: PDF, DOCX, TXT, CSV`,
        });
        return null;
      }

      // Validate file size
      if (fileEntry.file.size > MAX_FILE_SIZE) {
        updateFile(id, {
          status: 'error',
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
        return null;
      }

      // Step 1: Initial upload indicator
      updateFile(id, { status: 'uploading', progress: 10 });
      await new Promise(r => setTimeout(r, 300));
      updateFile(id, { progress: 25 });

      // Step 2: Extract text
      updateFile(id, { status: 'extracting', progress: 35 });
      
      let extractedText: string;
      let pageCount: number;
      
      try {
        const extraction = await extractText(fileEntry.file);
        extractedText = extraction.text;
        pageCount = extraction.pageCount;
        
        if (!extractedText || extractedText.length < 100) {
          throw new Error('Could not extract sufficient text from document. File may be corrupted or password-protected.');
        }
        
        updateFile(id, { progress: 55 });
      } catch (extractError) {
        console.error('Extraction error:', extractError);
        updateFile(id, {
          status: 'error',
          error: extractError instanceof Error ? extractError.message : 'Text extraction failed',
        });
        return null;
      }

      // Step 3: Validate content
      updateFile(id, { status: 'validating', progress: 65 });
      
      try {
        const validation = await validateDocument(extractedText, fileEntry.name, pageCount);
        updateFile(id, { progress: 85 });
        
        // Determine final status based on validation
        if (validation.final_validation_status === 'Rejected: Not an ESG report') {
          updateFile(id, {
            status: 'rejected',
            progress: 100,
            validationResult: validation,
            error: validation.rejection_reason,
          });
          return validation;
        } else {
          updateFile(id, {
            status: 'validated',
            progress: 100,
            validationResult: validation,
          });
          return validation;
        }
      } catch (validationError) {
        console.error('Validation error:', validationError);
        updateFile(id, {
          status: 'error',
          error: validationError instanceof Error ? validationError.message : 'Validation failed',
        });
        return null;
      }

    } catch (error) {
      console.error('Process file error:', error);
      updateFile(id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [files, updateFile]);

  // Upload and process file - main entry point
  const uploadAndValidate = useCallback(async (file: File): Promise<{ id: string; validation: ValidationResult | null }> => {
    // Validate file type first
    if (!validateFileType(file)) {
      toast({
        title: 'Invalid File Type',
        description: 'Accepted formats: PDF, DOCX, TXT, CSV',
        variant: 'destructive',
      });
      return { id: '', validation: null };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        variant: 'destructive',
      });
      return { id: '', validation: null };
    }

    const id = addFile(file);
    const validation = await processFile(id);
    
    return { id, validation };
  }, [addFile, processFile]);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  return {
    files,
    isProcessing,
    addFile,
    removeFile,
    processFile,
    uploadAndValidate,
    uploadToStorage,
    deleteFromStorage,
    updateFile,
    clearFiles,
    acceptedTypes: ACCEPTED_TYPES,
    sanitizeFilename,
  };
}
