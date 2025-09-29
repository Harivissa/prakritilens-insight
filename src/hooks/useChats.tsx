import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Chat {
  id: string;
  user_id: string;
  message: string;
  response: string;
  metadata: any;
  created_at: string;
}

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchChats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChats(data || []);
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error fetching chat history",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message }
      });

      if (error) throw error;

      // Refresh chats to get the latest conversation
      await fetchChats();
      
      return data.response;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message to AI assistant",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  };

  const clearChats = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setChats([]);
      toast({
        title: "Chat history cleared",
        description: "All chat messages have been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error clearing chats",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  return {
    chats,
    loading,
    sending,
    sendMessage,
    clearChats,
    fetchChats
  };
};