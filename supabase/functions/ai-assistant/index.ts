import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  user_id: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json() as ChatMessage;
    
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are PrakritiLens AI Assistant, an expert sustainability analyst. You help users understand ESG (Environmental, Social, and Governance) concepts, provide guidance on sustainability practices, and answer questions about green compliance and reporting. 

Key areas you specialize in:
- Environmental metrics and carbon footprint analysis
- Social responsibility and workforce diversity
- Corporate governance and ethical practices
- Sustainability reporting standards (GRI, SASB, TCFD)
- Green compliance and regulatory requirements
- ESG scoring methodologies
- Climate risk assessment
- Sustainable supply chain management

Respond in a professional, friendly, and concise manner. Always provide actionable insights when possible and suggest next steps or additional resources when relevant.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const aiResponse = data.choices[0].message.content;

    // Save chat to database
    const { error: chatError } = await supabase
      .from('chats')
      .insert([
        {
          user_id: user.id,
          message: message,
          response: aiResponse,
          metadata: {
            model: 'gpt-4o-mini',
            timestamp: new Date().toISOString()
          }
        }
      ]);

    if (chatError) {
      console.error('Error saving chat:', chatError);
      // Don't throw here, still return the response
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      message_id: crypto.randomUUID()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to process AI assistant request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});