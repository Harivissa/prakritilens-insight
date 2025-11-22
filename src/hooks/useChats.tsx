import { useState } from 'react';
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

// Non-persistent chat hook - each session starts fresh  
export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [sending, setSending] = useState(false);

  const sendMessage = async (message: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    // Add user message to temporary state immediately
    const userMessage: Chat = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      message,
      response: '',
      metadata: null,
      created_at: new Date().toISOString()
    };
    
    setChats(prev => [...prev, userMessage]);
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { message }
      });

      if (error) throw error;

      // Update with AI response in temporary state
      const aiResponse: Chat = {
        id: `temp-response-${Date.now()}`,
        user_id: user.id,
        message,
        response: data.response,
        metadata: null,
        created_at: new Date().toISOString()
      };

      // Replace the user message with the complete chat entry
      setChats(prev => {
        const filtered = prev.filter(c => c.id !== userMessage.id);
        return [...filtered, aiResponse];
      });
      
      return data.response;
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove failed message
      setChats(prev => prev.filter(c => c.id !== userMessage.id));
      
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
    // Just clear local state - no database operations
    setChats([]);
    toast({
      title: "Chat cleared",
      description: "Conversation has been reset.",
    });
  };

  return {
    chats,
    loading: false, // No loading since we don't fetch history
    sending,
    sendMessage,
    clearChats,
    fetchChats: () => {} // No-op since we don't persist
  };
};
