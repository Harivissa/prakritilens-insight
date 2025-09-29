import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  user_id: string;
  report_file: string | null;
  score: number;
  company_name: string | null;
  file_name: string | null;
  analysis_data: any;
  created_at: string;
  updated_at: string;
}

export const useReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use direct query with type casting until types are regenerated
      const { data, error } = await (supabase as any)
        .from('reports')
        .select('*')
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

  const saveReport = async (reportData: {
    score: number;
    company_name: string;
    file_name: string;
    analysis_data: any;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await (supabase as any)
        .from('reports')
        .insert([
          {
            user_id: user.id,
            score: reportData.score,
            company_name: reportData.company_name,
            file_name: reportData.file_name,
            analysis_data: reportData.analysis_data,
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "The report has been deleted successfully.",
      });

      await fetchReports(); // Refresh the reports list
    } catch (error: any) {
      toast({
        title: "Error deleting report",
        description: error.message,
        variant: "destructive",
      });
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