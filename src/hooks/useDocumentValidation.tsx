import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ValidationResult } from '@/components/DocumentValidationResult';

interface UseDocumentValidationReturn {
  validateDocument: (file: File) => Promise<ValidationResult | null>;
  isValidating: boolean;
  validationResult: ValidationResult | null;
  clearValidation: () => void;
}

// Extract text from different file types
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Handle plain text files
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await file.text();
  }

  // Handle CSV files
  if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    return await file.text();
  }

  // Handle PDF files - use the extract-pdf-text edge function
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to validate documents');
    }

    const response = await fetch(
      `https://rtztgxtqlyrixmskozfi.supabase.co/functions/v1/extract-pdf-text`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to extract PDF text: ${error}`);
    }

    const result = await response.json();
    return result.text || '';
  }

  // Handle DOCX files - read as ArrayBuffer and extract text
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')) {
    // For DOCX, we'll use a simplified approach - send to edge function
    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to validate documents');
    }

    const response = await fetch(
      `https://rtztgxtqlyrixmskozfi.supabase.co/functions/v1/extract-pdf-text`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      // Fallback: try to extract basic text from the file
      const arrayBuffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = textDecoder.decode(arrayBuffer);
      // Extract visible text between XML tags
      const textContent = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
        ?.map(match => match.replace(/<[^>]+>/g, ''))
        .join(' ') || '';
      return textContent;
    }

    const result = await response.json();
    return result.text || '';
  }

  // For other files, try to read as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Unsupported file type: ${fileType || 'unknown'}`);
  }
}

export function useDocumentValidation(): UseDocumentValidationReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateDocument = useCallback(async (file: File): Promise<ValidationResult | null> => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Check file size (warn for very large files)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 100) {
        toast({
          title: 'Large File Detected',
          description: `Processing ${fileSizeMB.toFixed(1)}MB file. This may take a moment...`,
        });
      }

      // Extract text from the file
      console.log(`Extracting text from ${file.name}...`);
      const extractedText = await extractTextFromFile(file);

      if (!extractedText || extractedText.length < 100) {
        toast({
          title: 'Extraction Failed',
          description: 'Could not extract sufficient text from the document. Please ensure the file is not corrupted or password-protected.',
          variant: 'destructive',
        });
        return null;
      }

      console.log(`Extracted ${extractedText.length} characters, sending for validation...`);

      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to validate documents.',
          variant: 'destructive',
        });
        return null;
      }

      // Call the validation edge function
      const response = await fetch(
        `https://rtztgxtqlyrixmskozfi.supabase.co/functions/v1/validate-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: extractedText,
            fileName: file.name,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Validation failed: ${error}`);
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);

      // Show appropriate toast based on result
      if (result.final_validation_status === 'Accepted: ESG/Sustainability Report') {
        toast({
          title: '✅ Document Validated',
          description: `${result.company_name} - ${result.document_type} recognized`,
        });
      } else if (result.final_validation_status === 'Maybe: Needs manual confirmation') {
        toast({
          title: '⚠️ Review Recommended',
          description: 'This document may contain ESG content. Please review the details.',
        });
      } else {
        toast({
          title: '❌ Document Not Recognized',
          description: 'This file does not appear to be an ESG/Sustainability report.',
          variant: 'destructive',
        });
      }

      return result;

    } catch (error: any) {
      console.error('Document validation error:', error);
      toast({
        title: 'Validation Error',
        description: error.message || 'Failed to validate document. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  return {
    validateDocument,
    isValidating,
    validationResult,
    clearValidation,
  };
}
