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

    const { documentText, fileName, fileSize } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Starting ESG analysis for:', fileName);

    // Call OpenAI with structured output using tool calling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert ESG analyst with deep knowledge of sustainability reporting frameworks (GRI, SASB, TCFD, CDP).

YOUR PRIMARY TASK:
1. FIRST, identify the company name from the document (look at headers, titles, company info)
2. DETERMINE if this is an ESG/sustainability report by checking for:
   - Environmental metrics (emissions, energy, waste, water)
   - Social metrics (diversity, safety, labor practices)
   - Governance metrics (board composition, ethics, compliance)
   - Standard reporting frameworks (GRI, SASB, TCFD)
3. If NOT an ESG report, set is_esg_report to false and explain what type of document it is
4. If it IS an ESG report, perform thorough analysis

SCORING METHODOLOGY (0-100 scale):
- 80-100: Excellent - Comprehensive data, strong performance, aligned with best practices
- 60-79: Good - Solid reporting, room for improvement in some areas
- 40-59: Fair - Basic disclosure, significant gaps in data or performance
- 20-39: Poor - Limited disclosure, major concerns in multiple areas
- 0-19: Critical - Minimal or no meaningful ESG data

You MUST call the extract_esg_data function with complete structured analysis. Be thorough and evidence-based.`
          },
          {
            role: 'user',
            content: `Analyze this ${fileName} (${Math.round(fileSize/1024)}KB) and extract structured ESG data:

${documentText.substring(0, 50000)}${documentText.length > 50000 ? '\n\n[Document truncated for length]' : ''}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_esg_data',
              description: 'Extract structured ESG data from sustainability report',
              parameters: {
                type: 'object',
                properties: {
                   validation: {
                    type: 'object',
                    properties: {
                      is_esg_report: { 
                        type: 'boolean', 
                        description: 'Is this a genuine ESG/sustainability/annual report with ESG data?' 
                      },
                      confidence: { 
                        type: 'number', 
                        description: 'Confidence in validation 0-100' 
                      },
                      reason: { 
                        type: 'string', 
                        description: 'Detailed explanation: If NOT ESG report, identify what type of document this is (e.g., financial report, marketing material, research paper). If IS ESG report, explain what makes it valid.' 
                      },
                      document_type: {
                        type: 'string',
                        description: 'Type identified: ESG Report, Sustainability Report, Annual Report, CSR Report, Integrated Report, or Other'
                      }
                    },
                    required: ['is_esg_report', 'confidence', 'reason', 'document_type']
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      company_name: { type: 'string' },
                      report_year: { type: 'number' },
                      report_type: { type: 'string', description: 'e.g., Annual Report, Sustainability Report, ESG Report' },
                      page_count_estimate: { type: 'number' }
                    }
                  },
                  scores: {
                    type: 'object',
                    properties: {
                      overall: { type: 'number', description: 'Overall ESG score 0-100' },
                      environmental: { type: 'number', description: 'Environmental score 0-100' },
                      social: { type: 'number', description: 'Social score 0-100' },
                      governance: { type: 'number', description: 'Governance score 0-100' },
                      confidence_level: { type: 'string', enum: ['high', 'medium', 'low'] }
                    },
                    required: ['overall', 'environmental', 'social', 'governance', 'confidence_level']
                  },
                  evidence: {
                    type: 'array',
                    description: 'Supporting evidence for scores',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        metric: { type: 'string', description: 'e.g., "CO2 emissions", "Board diversity"' },
                        value: { type: 'string', description: 'Extracted value or finding' },
                        snippet: { type: 'string', description: 'Exact quote from document' },
                        page: { type: 'number', description: 'Page number or estimate' },
                        confidence: { type: 'number', description: 'Confidence in extraction 0-100' },
                        impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
                      },
                      required: ['category', 'metric', 'value', 'snippet', 'confidence', 'impact']
                    }
                  },
                  risks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        evidence: { type: 'string', description: 'Supporting snippet' },
                        page: { type: 'number' }
                      },
                      required: ['title', 'description', 'severity', 'category']
                    }
                  },
                  opportunities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                      },
                      required: ['title', 'description', 'category', 'priority']
                    }
                  },
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        timeframe: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] }
                      },
                      required: ['title', 'description', 'category']
                    }
                  },
                  executive_summary: {
                    type: 'string',
                    description: 'Concise summary of key findings (2-3 paragraphs)'
                  }
                },
                required: ['validation', 'scores', 'evidence', 'risks', 'opportunities', 'recommendations', 'executive_summary']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_esg_data' } }
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received');

    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid OpenAI response');
    }

    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    // Validate that it's actually an ESG report
    if (!analysisResult.validation.is_esg_report) {
      const documentType = analysisResult.validation.document_type || 'Unknown';
      const detailedMessage = `📄 Document Type Identified: ${documentType}\n\n${analysisResult.validation.reason}\n\n✅ To analyze a document, please upload:\n- ESG/Sustainability Report\n- Annual Report with ESG section\n- Corporate Social Responsibility (CSR) Report\n- Integrated Report with ESG data`;
      
      return new Response(
        JSON.stringify({
          error: 'NOT_ESG_REPORT',
          message: detailedMessage,
          confidence: analysisResult.validation.confidence,
          document_type: documentType
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Analysis complete:', {
      company: analysisResult.metadata?.company_name,
      score: analysisResult.scores.overall,
      evidence_count: analysisResult.evidence.length
    });

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in structured-esg-analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});