import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  user_id: string;
  company_name: string | null;
  file_name: string | null;
  file_url: string | null;
  score: number;
  hash: string;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

export type SaveReportInput = {
  score: number;
  company_name: string;
  file_name: string;
  file_url: string;
  file_path?: string; // Storage path for deletion
  hash?: string;
  analysis_data: any;
  report_year?: number;
  page_count?: number;
  validation_status?: string;
  confidence_level?: string;
};

export const useReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      // Fallback for missing table
      console.warn('Reports table not found, creating empty state');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (reportData: SaveReportInput) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            user_id: user.id,
            score: reportData.score,
            company_name: reportData.company_name,
            file_name: reportData.file_name,
            file_url: reportData.file_url,
            hash: reportData.hash || crypto.randomUUID(),
            analysis_data: reportData.analysis_data,
            report_year: reportData.report_year,
            page_count: reportData.page_count,
            validation_status: reportData.validation_status || 'validated',
            confidence_level: reportData.confidence_level,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Report saved",
        description: "Your ESG assessment report has been saved successfully.",
      });

      await fetchReports(); // Refresh the reports list
      return data;
    } catch (error: any) {
      toast({
        title: "Error saving report",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const fileSize = file.size;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      // Check file size against reasonable limits
      if (fileSize > 50 * 1024 * 1024) { // 50MB limit
        throw new Error(`File size (${fileSizeMB}MB) exceeds the 50MB limit. Please compress or split your document.`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log(`Uploading file: ${file.name} (${fileSizeMB}MB)`);

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Provide user-friendly error messages
        if (uploadError.message?.includes('File size')) {
          throw new Error(`File too large: ${fileSizeMB}MB. Maximum allowed is 50MB.`);
        } else if (uploadError.message?.includes('storage')) {
          throw new Error('Storage service temporarily unavailable. Please try again.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // Bucket is private: return a signed URL valid for 7 days
      const { data: signed, error: signError } = await supabase.storage
        .from('reports')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);

      if (signError || !signed?.signedUrl) {
        console.error('Signed URL creation error:', signError);
        throw new Error('Failed to create secure file access URL');
      }

      console.log(`File uploaded successfully: ${file.name}`);
      return signed.signedUrl;
      
    } catch (error: any) {
      console.error('File upload error:', error);
      
      // Don't show toast here as it's handled by the calling component
      throw error;
    }
  };

  const deleteReport = async (reportId: string, fileUrl?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // If there's a file URL, delete the file from storage first
      if (fileUrl) {
        try {
          // Extract the file path from the signed URL
          const urlParts = fileUrl.split('/');
          const bucketIndex = urlParts.findIndex(part => part === 'reports');
          
          if (bucketIndex !== -1 && urlParts[bucketIndex + 1]) {
            // Reconstruct the file path
            const filePath = urlParts.slice(bucketIndex + 1).join('/').split('?')[0];
            
            const { error: storageError } = await supabase.storage
              .from('reports')
              .remove([filePath]);

            if (storageError) {
              console.error('Error deleting file from storage:', storageError);
              // Continue with report deletion even if file deletion fails
            }
          }
        } catch (storageError) {
          console.error('Error processing file deletion:', storageError);
          // Continue with report deletion
        }
      }

      // Delete the report from the database
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "The report and associated files have been deleted successfully.",
      });

      await fetchReports(); // Refresh the reports list
    } catch (error: any) {
      toast({
        title: "Error deleting report",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  return {
    reports,
    loading,
    saveReport,
    uploadFile,
    deleteReport,
    fetchReports
  };
};