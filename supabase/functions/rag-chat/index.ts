import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, conversationId, reportId } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('RAG chat request:', { conversationId, reportId, messageLength: message.length });

    // Get or create conversation
    let convId = conversationId;
    if (!convId && reportId) {
      const { data: newConv, error: convError } = await supabaseClient
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          report_id: reportId,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .single();
      
      if (convError) throw convError;
      convId = newConv.id;
    }

    // Get conversation history
    const { data: history, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyError) throw historyError;

    // Get relevant document chunks via similarity search
    // For now, we'll get the most recent chunks from the report
    const { data: chunks, error: chunksError } = await supabaseClient
      .from('document_embeddings')
      .select('chunk_text, page_number, metadata')
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(10);

    if (chunksError) {
      console.warn('No embeddings found for report, using general context');
    }

    // Build context from chunks
    const contextText = chunks && chunks.length > 0 
      ? chunks.map((c, i) => `[Page ${c.page_number || 'unknown'}] ${c.chunk_text}`).join('\n\n')
      : 'No document context available. Please use general ESG knowledge.';

    // Build messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are an ESG and sustainability expert AI assistant for PrakritiLens. Your role is to answer questions about ESG reports and sustainability topics.

CRITICAL RULES:
1. ALWAYS base your answers on the provided document context when available
2. ALWAYS cite page numbers and exact snippets when referencing the report
3. If the document doesn't contain information to answer the question, say so explicitly
4. Provide concise, actionable insights
5. Use proper ESG terminology (GRI, SASB, TCFD, Scope 1/2/3, etc.)
6. Be conversational but professional
7. If asked the same question, provide new perspectives or additional evidence

DOCUMENT CONTEXT:
${contextText}

When citing evidence, format like: "According to page X: [snippet]"
When uncertain, suggest: "I don't have enough information in the uploaded report. Would you like me to explain general ESG best practices for this topic?"`
      },
      ...history,
      { role: 'user', content: message }
    ];

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid OpenAI response');
    }

    const assistantMessage = data.choices[0].message.content;

    // Extract evidence citations from the response
    const evidenceRegex = /page (\d+)[:\s]+([^\.]+)/gi;
    const evidenceMatches = Array.from(assistantMessage.matchAll(evidenceRegex));
    const evidence = evidenceMatches.map((match) => ({
      page: parseInt((match as any)[1] || '0'),
      snippet: ((match as any)[2] || '').trim()
    }));

    // Save messages to database
    await supabaseClient.from('chat_messages').insert([
      {
        conversation_id: convId,
        user_id: user.id,
        role: 'user',
        content: message
      },
      {
        conversation_id: convId,
        user_id: user.id,
        role: 'assistant',
        content: assistantMessage,
        evidence: evidence
      }
    ]);

    console.log('Chat response generated with', evidence.length, 'citations');

    return new Response(
      JSON.stringify({
        conversationId: convId,
        response: assistantMessage,
        evidence,
        context_used: chunks ? chunks.length : 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in rag-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});