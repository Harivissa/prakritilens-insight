import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts for different tones
const TONE_PROMPTS = {
  formal: `You are Prakriti, a professional ESG analyst assistant for PrakritiLens. Communicate in a formal, business-appropriate tone suitable for executive briefings and board presentations. Use precise terminology and maintain a professional demeanor.`,
  
  technical: `You are Prakriti, a technical ESG analyst assistant for PrakritiLens. Communicate using detailed technical language, specific metrics, and framework-specific terminology (GRI, SASB, TCFD, CDP, CSRD). Provide in-depth analysis suitable for sustainability professionals.`,
  
  beginner: `You are Prakriti, a friendly ESG assistant for PrakritiLens. Explain sustainability concepts in simple, accessible terms. Avoid jargon and use analogies when helpful. Your goal is to help newcomers understand ESG topics easily.`
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

    const { message, conversationId, reportId, tone = 'formal' } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('RAG chat request:', { conversationId, reportId, messageLength: message.length, tone });

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

    // Get conversation history (last 15 messages for context)
    const { data: history, error: historyError } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(15);

    if (historyError) throw historyError;

    // Get relevant document chunks via embedding similarity
    // First, generate embedding for the user's query
    let relevantChunks: any[] = [];
    
    try {
      // Generate embedding for the query using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: message
        }),
      });

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data?.[0]?.embedding;

      if (queryEmbedding) {
        // Perform similarity search using the embedding
        // For now, use a simpler approach - get chunks and filter by keywords
        const keywords = message.toLowerCase().split(' ').filter(w => w.length > 3);
        
        const { data: chunks, error: chunksError } = await supabaseClient
          .from('document_embeddings')
          .select('chunk_text, page_number, metadata')
          .eq('report_id', reportId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(20);

        if (!chunksError && chunks) {
          // Score chunks by keyword relevance
          const scoredChunks = chunks.map(chunk => {
            const text = chunk.chunk_text.toLowerCase();
            const score = keywords.reduce((acc, keyword) => {
              return acc + (text.includes(keyword) ? 1 : 0);
            }, 0);
            return { ...chunk, relevanceScore: score };
          });

          // Sort by relevance and take top 8
          relevantChunks = scoredChunks
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 8);
        }
      }
    } catch (embError) {
      console.warn('Embedding search failed, falling back to basic retrieval:', embError);
    }

    // Fallback: get chunks without similarity search
    if (relevantChunks.length === 0) {
      const { data: fallbackChunks, error: chunksError } = await supabaseClient
        .from('document_embeddings')
        .select('chunk_text, page_number, metadata')
        .eq('report_id', reportId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(10);

      if (!chunksError && fallbackChunks) {
        relevantChunks = fallbackChunks;
      }
    }

    // Build context from chunks
    const contextText = relevantChunks.length > 0 
      ? relevantChunks.map((c, i) => `[Page ${c.page_number || 'unknown'}] ${c.chunk_text}`).join('\n\n')
      : 'No document context available. Please use general ESG knowledge.';

    // Select tone-specific prompt
    const tonePrompt = TONE_PROMPTS[tone as keyof typeof TONE_PROMPTS] || TONE_PROMPTS.formal;

    // Build messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `${tonePrompt}

You are an expert in ESG (Environmental, Social, and Governance) and sustainability topics. Your primary role is to answer questions about the uploaded ESG report using the provided document context.

CRITICAL RULES - FOLLOW EXACTLY:
1. ALWAYS base your answers on the provided document context when available
2. ALWAYS cite page numbers when referencing information from the report
3. Format citations like: "According to page X: [relevant snippet]"
4. If the document doesn't contain information to answer the question, say explicitly:
   "The uploaded report does not provide enough information about [topic]. However, based on general ESG best practices..."
5. Provide concise, actionable insights
6. Use proper ESG terminology (GRI, SASB, TCFD, Scope 1/2/3, etc.) appropriate to the selected tone
7. If asked the same question, provide new perspectives or additional evidence
8. When discussing metrics, always include units and context
9. For risks, suggest potential mitigation strategies
10. For opportunities, explain potential impact and implementation considerations

DOCUMENT CONTEXT FROM UPLOADED REPORT:
${contextText}

When you cite evidence, be specific. For example:
- "The report states on page 14 that carbon emissions decreased by 15% year-over-year..."
- "According to the diversity metrics on page 27, female leadership representation is 34%..."

If the user asks about something not in the document:
1. Acknowledge what IS covered in the report related to their question
2. Explain what information is missing
3. Offer to discuss general ESG best practices for that topic

Remember: You are Prakriti, the AI assistant for PrakritiLens. Be helpful, accurate, and cite your sources.`
      },
      ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
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
        temperature: tone === 'technical' ? 0.5 : 0.7,
        max_tokens: 2000
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error('Invalid OpenAI response:', data);
      throw new Error('Invalid OpenAI response');
    }

    const assistantMessage = data.choices[0].message.content;

    // Extract evidence citations from the response
    const evidenceRegex = /page (\d+)[:\s]+([^\.]+)/gi;
    const evidenceMatches = Array.from(assistantMessage.matchAll(evidenceRegex));
    const evidence = evidenceMatches.map((match) => ({
      page: parseInt((match as any)[1] || '0'),
      snippet: ((match as any)[2] || '').trim().substring(0, 200)
    }));

    // Calculate confidence based on evidence and context
    const confidence = Math.min(
      95,
      50 + (evidence.length * 10) + (relevantChunks.length > 0 ? 20 : 0)
    );

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
        evidence: evidence,
        confidence: confidence
      }
    ]);

    console.log('Chat response generated with', evidence.length, 'citations, confidence:', confidence);

    return new Response(
      JSON.stringify({
        conversationId: convId,
        response: assistantMessage,
        evidence,
        confidence,
        context_used: relevantChunks.length,
        tone
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