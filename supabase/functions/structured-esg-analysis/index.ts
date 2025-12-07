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

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Starting ESG analysis for:', fileName, 'Text length:', documentText?.length || 0);

    // Truncate document text to avoid token limits
    const maxTextLength = 80000;
    const truncatedText = documentText?.substring(0, maxTextLength) || '';
    
    if (truncatedText.length < 100) {
      throw new Error('Document text is too short for analysis. Please ensure the PDF was properly extracted.');
    }

    console.log('Sending to OpenAI, text length:', truncatedText.length);

    // Call OpenAI with structured output using tool calling
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
            content: `You are an expert ESG analyst with deep knowledge of sustainability reporting frameworks (GRI, SASB, TCFD, CDP).

CRITICAL RULES:
1. EXTRACT ONLY REAL DATA from the document - NEVER generate or fabricate metrics
2. CITE PAGE NUMBERS for every piece of evidence
3. If data is missing, state "Not disclosed in this report"
4. Reference actual company commitments with exact quotes

SCORING METHODOLOGY (based on ACTUAL data only):
Environmental (0-100): Emissions, energy, water, waste data quality
Social (0-100): Workforce, diversity, safety metrics quality  
Governance (0-100): Board composition, ethics, risk management quality

Score Ranges:
- 80-100: Excellent - Comprehensive disclosure
- 60-79: Good - Solid reporting with some gaps
- 40-59: Fair - Basic disclosure
- 20-39: Poor - Limited data
- 0-19: Critical - Minimal ESG information`
          },
          {
            role: 'user',
            content: `Analyze this document: ${fileName}

EXTRACT REAL DATA ONLY - DO NOT FABRICATE.

Document content:
${truncatedText}${documentText.length > maxTextLength ? '\n\n[Document truncated]' : ''}`
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
                      is_esg_report: { type: 'boolean' },
                      confidence: { type: 'number' },
                      reason: { type: 'string' },
                      document_type: { type: 'string' }
                    },
                    required: ['is_esg_report', 'confidence', 'reason', 'document_type']
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      company_name: { type: 'string' },
                      report_year: { type: 'number' },
                      report_type: { type: 'string' },
                      page_count_estimate: { type: 'number' }
                    }
                  },
                  scores: {
                    type: 'object',
                    properties: {
                      overall: { type: 'number' },
                      environmental: { type: 'number' },
                      social: { type: 'number' },
                      governance: { type: 'number' },
                      confidence_level: { type: 'string', enum: ['high', 'medium', 'low'] }
                    },
                    required: ['overall', 'environmental', 'social', 'governance', 'confidence_level']
                  },
                  evidence: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        metric: { type: 'string' },
                        value: { type: 'string' },
                        year: { type: 'number' },
                        snippet: { type: 'string' },
                        page: { type: 'number' },
                        confidence: { type: 'number' },
                        impact: { type: 'string', enum: ['positive', 'negative', 'neutral', 'not_disclosed'] },
                        trend: { type: 'string' }
                      },
                      required: ['category', 'metric', 'value', 'snippet', 'page', 'confidence', 'impact']
                    }
                  },
                  key_metrics: {
                    type: 'object',
                    properties: {
                      environmental: {
                        type: 'object',
                        properties: {
                          carbon_emissions: { type: 'string' },
                          renewable_energy: { type: 'string' },
                          water_usage: { type: 'string' },
                          waste_recycled: { type: 'string' }
                        }
                      },
                      social: {
                        type: 'object',
                        properties: {
                          workforce_size: { type: 'string' },
                          female_leadership: { type: 'string' },
                          safety_incidents: { type: 'string' },
                          training_hours: { type: 'string' }
                        }
                      },
                      governance: {
                        type: 'object',
                        properties: {
                          board_independence: { type: 'string' },
                          board_diversity: { type: 'string' },
                          ethics_training: { type: 'string' },
                          whistleblower_cases: { type: 'string' }
                        }
                      }
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
                        evidence: { type: 'string' },
                        page: { type: 'number' },
                        is_disclosed: { type: 'boolean' },
                        mitigation: { type: 'string' }
                      },
                      required: ['title', 'description', 'severity', 'category', 'page', 'is_disclosed']
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
                  executive_summary: { type: 'string' },
                  targets_and_commitments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        target: { type: 'string' },
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        timeline: { type: 'string' },
                        baseline: { type: 'string' },
                        page: { type: 'number' },
                        status: { type: 'string' }
                      }
                    }
                  },
                  missing_disclosures: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['validation', 'scores', 'evidence', 'key_metrics', 'risks', 'opportunities', 'recommendations', 'executive_summary', 'targets_and_commitments', 'missing_disclosures']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_esg_data' } }
      }),
    });

    const responseText = await response.text();
    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      console.error('OpenAI API error:', responseText);
      throw new Error(`OpenAI API error: ${response.status} - ${responseText.substring(0, 200)}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', responseText.substring(0, 500));
      throw new Error('Failed to parse OpenAI response');
    }

    console.log('OpenAI response parsed successfully');

    if (!data.choices || !data.choices[0]) {
      console.error('Invalid response structure:', JSON.stringify(data).substring(0, 500));
      throw new Error('Invalid OpenAI response structure');
    }

    const toolCall = data.choices[0].message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(data.choices[0]).substring(0, 500));
      throw new Error('No tool call in response');
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments?.substring(0, 500));
      throw new Error('Failed to parse ESG analysis results');
    }

    // Validate that it's actually an ESG report
    if (!analysisResult.validation?.is_esg_report) {
      const documentType = analysisResult.validation?.document_type || 'Unknown';
      const detailedMessage = `📄 Document Type Identified: ${documentType}\n\n${analysisResult.validation?.reason || 'This document does not appear to be an ESG report.'}\n\n✅ To analyze a document, please upload:\n- ESG/Sustainability Report\n- Annual Report with ESG section\n- Corporate Social Responsibility (CSR) Report`;
      
      return new Response(
        JSON.stringify({
          error: 'NOT_ESG_REPORT',
          message: detailedMessage,
          confidence: analysisResult.validation?.confidence || 0,
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
      score: analysisResult.scores?.overall,
      evidence_count: analysisResult.evidence?.length || 0
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
