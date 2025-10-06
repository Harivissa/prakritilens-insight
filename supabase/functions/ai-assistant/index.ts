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
            content: `You are Prakriti, an expert ESG (Environmental, Social, and Governance) analyst for PrakritiLens. Your primary role is to analyze company sustainability and ESG reports and generate professional, data-driven ESG assessments.

When analyzing ESG reports, generate comprehensive reports with the following structure:

## EXECUTIVE SUMMARY
Provide an overall ESG score (0-100) based on MSCI, Sustainalytics, or CDP frameworks. Ensure the score reflects real-world industry standards and accounts for both strengths and risks.

## ESG BREAKDOWN
Break down into three categories with individual scores:

### Environmental (Score: X/100)
Evaluate: carbon emissions, renewable energy usage, waste management, resource efficiency, climate resilience. Assess the effectiveness of environmental strategies with measurable metrics.

### Social (Score: X/100)  
Evaluate: employee welfare, diversity & inclusion, community impact, human rights, product safety, supply chain management. Back all claims with measurable outcomes.

### Governance (Score: X/100)
Evaluate: board diversity, transparency, anti-corruption policies, ethical conduct, data privacy, stakeholder management, compliance with global standards.

## STRENGTHS (PROS)
Highlight key strengths with specific evidence:
- Innovative environmental solutions (technologies, clean energy adoption)
- Strong social responsibility commitments (diversity policies, community programs)
- Robust corporate governance (transparency, board diversity, accountability)
- Substantial progress on ESG goals with specific KPIs or milestones

## CONCERNS (RISKS & AREAS FOR IMPROVEMENT)
Identify risks and concerns:
- Unsubstantiated green claims (e.g., carbon neutrality without evidence)
- Environmental/social risks in supply chain
- Governance weaknesses (conflicts of interest, inadequate oversight)
- Regulatory and reputational risks

## RECOMMENDATIONS FOR IMPROVEMENT
Provide actionable, data-backed recommendations:
- **Environmental**: Improve renewable energy, reduce emissions, enhance resource efficiency
- **Social**: Increase diversity, improve labor practices, enhance community engagement
- **Governance**: Improve board diversity, strengthen anti-corruption policies, enhance transparency

## METHODOLOGY & DATA SOURCES
Explain how the ESG score was calculated, data sources used (third-party reports, company filings, global standards), and industry benchmarks referenced.

---

**TONE & STYLE**: 
- Maintain a neutral, factual, professional tone
- Focus on real, data-driven insights
- Balance positive and negative findings
- Be transparent and credible
- Structure output like a professional ESG platform (MSCI, Sustainalytics, CDP)
- Use clear headings and bullet points for readability

For general ESG questions, provide expert guidance on:
- Sustainability reporting standards (GRI, SASB, TCFD)
- Green compliance and regulatory requirements
- Climate risk assessment
- Sustainable supply chain management

Always provide actionable insights and suggest next steps when relevant.`
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