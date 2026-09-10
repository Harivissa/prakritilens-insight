import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  user_id: string;
  company_name: string | null;
  file_name: string | null;
  file_url: string | null;
  score: number | null;
  hash: string;
  analysis_data: any;
  created_at: string;
  updated_at: string;
  report_year?: number | null;
  page_count?: number | null;
  status?: string;
  document_type?: string | null;
  storage_path?: string | null;
  confidence_level?: string | null;
  validation_status?: string | null;
  metadata?: any;
  quality?: any;
}

export type SaveReportInput = {
  score: number | null;
  company_name: string;
  file_name: string;
  file_url: string;
  file_path?: string;
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

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Only finished analyses are shown; in-flight or failed runs are never presented as results
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports((data || []) as Report[]);
    } catch (error: any) {
      console.error('Failed to load reports:', error);
      toast({ title: 'Could not load reports', description: error.message, variant: 'destructive' });
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Legacy direct save. The main pipeline (useDocumentUpload.runAnalysis) persists reports itself;
   * this remains for callers that already hold a completed, evidence-backed analysis.
   */
  const saveReport = async (reportData: SaveReportInput) => {
    if (!user) throw new Error('User not authenticated');
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          user_id: user.id,
          score: reportData.score,
          company_name: reportData.company_name,
          file_name: reportData.file_name,
          file_url: reportData.file_url,
          storage_path: reportData.file_path ?? null,
          hash: reportData.hash || crypto.randomUUID(),
          analysis_data: reportData.analysis_data,
          report_year: reportData.report_year,
          page_count: reportData.page_count,
          validation_status: reportData.validation_status || 'validated',
          confidence_level: reportData.confidence_level,
          status: 'COMPLETED',
        }])
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Report saved', description: 'Your ESG assessment report has been saved successfully.' });
      await fetchReports();
      return data;
    } catch (error: any) {
      toast({ title: 'Error saving report', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    if (file.size > 100 * 1024 * 1024) throw new Error(`File size exceeds the 100MB limit.`);
    const fileName = `${user.id}/${new Date().getFullYear()}/unknown_company/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from('reports').upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    const { data: signed, error: signError } = await supabase.storage.from('reports').createSignedUrl(fileName, 60 * 60 * 24 * 7);
    if (signError || !signed?.signedUrl) throw new Error('Failed to create secure file access URL');
    return signed.signedUrl;
  };

  /** Deletes the report row (cascades to pages, metrics, scores, evidence, embeddings, chats) and its stored file. */
  const deleteReport = async (reportId: string, fileUrl?: string) => {
    if (!user) throw new Error('User not authenticated');
    try {
      const { data: row } = await supabase.from('reports').select('storage_path, file_url').eq('id', reportId).eq('user_id', user.id).maybeSingle();
      let path = row?.storage_path ?? null;
      const url = fileUrl ?? row?.file_url ?? undefined;
      if (!path && url) {
        const parts = url.split('/');
        const idx = parts.findIndex((p) => p === 'reports');
        if (idx !== -1 && parts[idx + 1]) path = decodeURIComponent(parts.slice(idx + 1).join('/').split('?')[0]);
      }
      if (path) {
        const { error: storageError } = await supabase.storage.from('reports').remove([path]);
        if (storageError) console.error('Error deleting file from storage:', storageError);
      }
      const { error } = await supabase.from('reports').delete().eq('id', reportId).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Report deleted', description: 'The report, its extracted data, chat history and stored file have been deleted.' });
      await fetchReports();
    } catch (error: any) {
      toast({ title: 'Error deleting report', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    if (user) fetchReports();
  }, [user, fetchReports]);

  return { reports, loading, saveReport, uploadFile, deleteReport, fetchReports };
};
