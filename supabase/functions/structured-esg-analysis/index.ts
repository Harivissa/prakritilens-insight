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
            content: `You are an ESG (Environmental, Social, Governance) analysis expert. Extract structured ESG data from company sustainability reports.
            
CRITICAL: You must ALWAYS call the extract_esg_data function with your analysis. Do not provide a text response without calling the function.

For each metric you extract:
- Provide the exact text snippet from the document
- Include the page number (estimate based on text position)
- Assign a confidence score (0-100) based on data quality
- Extract numeric values when available

Score each pillar (E/S/G) from 0-100 based on:
- Data completeness and transparency
- Performance vs industry benchmarks
- Trend direction (improving/declining)
- Evidence of concrete actions vs vague commitments`
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
                      is_esg_report: { type: 'boolean', description: 'Is this a genuine ESG/sustainability report?' },
                      confidence: { type: 'number', description: 'Confidence in validation (0-100)' },
                      reason: { type: 'string', description: 'Why is/isn\'t this an ESG report?' }
                    },
                    required: ['is_esg_report', 'confidence', 'reason']
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
      return new Response(
        JSON.stringify({
          error: 'NOT_ESG_REPORT',
          message: analysisResult.validation.reason || 'Document not recognized as ESG/sustainability report',
          confidence: analysisResult.validation.confidence
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