import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ChatCitation {
  page: number | null;
  snippet: string;
}

export interface Chat {
  id: string;
  user_id: string;
  message: string;
  response: string;
  metadata: {
    reportId?: string | null;
    reportName?: string | null;
    citations?: ChatCitation[];
    confidence?: number;
    in_scope?: boolean;
    general_knowledge?: boolean;
  } | null;
  created_at: string;
}

export type ChatTone = 'professional' | 'concise' | 'detailed' | 'simple';

export interface SendOptions {
  /** Pin the conversation to a specific analysed report. Defaults to the latest completed report. */
  reportId?: string | null;
  tone?: ChatTone;
}

/**
 * Report-aware ESG chat. Each browser session starts with an empty window;
 * the server keeps the conversation (for multi-turn context) until the user clears it.
 */
export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [sending, setSending] = useState(false);
  const conversationId = useRef<string | null>(null);
  const [activeReport, setActiveReport] = useState<{ id: string | null; name: string | null }>({ id: null, name: null });

  const sendMessage = useCallback(async (message: string, options: SendOptions = {}): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const text = message.trim();
    if (!text) throw new Error('Message is empty');

    const pending: Chat = { id: `pending-${Date.now()}`, user_id: user.id, message: text, response: '', metadata: null, created_at: new Date().toISOString() };
    setChats((prev) => [...prev, pending]);
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired. Please sign in again.');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-chat`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: conversationId.current, reportId: options.reportId ?? activeReport.id ?? undefined, tone: options.tone ?? 'professional' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        const code = data?.code;
        if (code === 'RATE_LIMITED') throw new Error('The assistant is busy right now (rate limited). Try again in a minute.');
        if (code === 'QUOTA_EXCEEDED') throw new Error('The AI service quota is exhausted. Contact the administrator.');
        throw new Error(data?.error || `Assistant unavailable (${res.status})`);
      }

      conversationId.current = data.conversationId ?? conversationId.current;
      if (data.reportId !== undefined) setActiveReport({ id: data.reportId ?? null, name: data.reportName ?? null });

      const complete: Chat = {
        id: `msg-${Date.now()}`,
        user_id: user.id,
        message: text,
        response: data.response,
        metadata: { reportId: data.reportId ?? null, reportName: data.reportName ?? null, citations: data.citations ?? [], confidence: data.confidence, in_scope: data.in_scope, general_knowledge: data.general_knowledge },
        created_at: new Date().toISOString(),
      };
      setChats((prev) => [...prev.filter((c) => c.id !== pending.id), complete]);
      return data.response as string;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setChats((prev) => prev.filter((c) => c.id !== pending.id));
      toast({ title: 'Message not sent', description: error.message || 'Failed to reach the AI assistant', variant: 'destructive' });
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, activeReport.id]);

  /** Clears the on-screen conversation and deletes its stored history. */
  const clearChats = useCallback(async () => {
    const id = conversationId.current;
    conversationId.current = null;
    setChats([]);
    if (id && user) {
      await supabase.from('chat_messages').delete().eq('conversation_id', id).eq('user_id', user.id);
      await supabase.from('chat_conversations').delete().eq('id', id).eq('user_id', user.id);
    }
    toast({ title: 'Chat cleared', description: 'Conversation and its stored history have been deleted.' });
  }, [user]);

  /** Switch the report the assistant answers about (starts a new conversation). */
  const selectReport = useCallback((reportId: string | null, name?: string | null) => {
    conversationId.current = null;
    setChats([]);
    setActiveReport({ id: reportId, name: name ?? null });
  }, []);

  return {
    chats,
    loading: false,
    sending,
    sendMessage,
    clearChats,
    selectReport,
    activeReport,
    fetchChats: () => {},
  };
};
