import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ValidationResult, UploadedFile } from '@/types/validation';

// Accepted file types
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

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

  // Sanitize filename
  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 100);
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

  // Extract text from document
  const extractText = async (file: File): Promise<{ text: string; pageCount: number }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`,
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

  // Validate document content
  const validateDocument = async (text: string, fileName: string, pageCount: number): Promise<ValidationResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Authentication required');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-document`,
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

  // Process single file through the pipeline
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

      // Step 1: Upload progress simulation (actual upload happens with extraction)
      updateFile(id, { status: 'uploading', progress: 10 });
      await new Promise(r => setTimeout(r, 200));
      updateFile(id, { progress: 30 });

      // Step 2: Extract text
      updateFile(id, { status: 'extracting', progress: 40 });
      
      let extractedText: string;
      let pageCount: number;
      
      try {
        const extraction = await extractText(fileEntry.file);
        extractedText = extraction.text;
        pageCount = extraction.pageCount;
        
        if (!extractedText || extractedText.length < 100) {
          throw new Error('Could not extract sufficient text from document');
        }
        
        updateFile(id, { progress: 60 });
      } catch (extractError) {
        console.error('Extraction error:', extractError);
        updateFile(id, {
          status: 'error',
          error: extractError instanceof Error ? extractError.message : 'Text extraction failed',
        });
        return null;
      }

      // Step 3: Validate content
      updateFile(id, { status: 'validating', progress: 70 });
      
      try {
        const validation = await validateDocument(extractedText, fileEntry.name, pageCount);
        updateFile(id, { progress: 90 });
        
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

  // Upload and process file
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
    updateFile,
    clearFiles,
    acceptedTypes: ACCEPTED_TYPES,
  };
}
