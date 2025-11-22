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

CRITICAL RULES - READ CAREFULLY:
1. EXTRACT ONLY REAL DATA from the document - NEVER generate, assume, or fabricate metrics
2. CITE PAGE NUMBERS for every piece of evidence
3. If data is missing, explicitly state "Not disclosed in this report" - DO NOT make up values
4. Reference actual company commitments, targets, and performance with exact quotes
5. Identify real controversies, compliance gaps, and risks mentioned in the document
6. Extract numerical values EXACTLY as stated (e.g., "34% female leadership on page 27")

VALIDATION PROCESS:
1. Identify the company name from document headers/titles
2. Determine if this is a genuine ESG/sustainability report by checking for:
   - Environmental metrics (emissions, energy, waste, water)
   - Social metrics (diversity, safety, labor practices)  
   - Governance metrics (board composition, ethics, compliance)
   - Standard frameworks (GRI, SASB, TCFD, CDP)
3. If NOT an ESG report, set is_esg_report to false and identify what it actually is

EVIDENCE EXTRACTION:
- Extract REAL metrics with exact values (e.g., "45,000 tonnes CO2e" not "carbon emissions reduced")
- Include page numbers for every metric
- Use direct quotes from the document
- For tables: extract numerical data accurately
- Identify measurement units (tonnes, %, MWh, etc.)

SCORING METHODOLOGY (based on ACTUAL data only):
Environmental (0-100):
- Emissions disclosure & targets (40%)
- Energy & renewables data (20%)
- Water & waste management (20%)
- Biodiversity & circular economy (20%)

Social (0-100):
- Workforce diversity metrics (30%)
- Health & safety data (25%)
- Labor practices & human rights (25%)
- Community engagement (20%)

Governance (0-100):
- Board composition & independence (30%)
- Ethics & compliance programs (25%)
- Risk management disclosure (25%)
- Stakeholder engagement (20%)

Score Ranges:
- 80-100: Excellent - Comprehensive disclosure, strong targets, verified data
- 60-79: Good - Solid reporting, some gaps in specific areas
- 40-59: Fair - Basic disclosure, significant missing metrics
- 20-39: Poor - Limited data, major transparency gaps
- 0-19: Critical - Minimal meaningful ESG information

ANALYSIS REQUIREMENTS:
- Reference specific pages (e.g., "According to page 14, Microsoft targets carbon-negative by 2030")
- Extract forward-looking commitments with timelines
- Identify controversies or compliance issues mentioned
- Note missing disclosures explicitly
- Highlight year-over-year trends if available`
          },
          {
            role: 'user',
            content: `Analyze this ${fileName} (${Math.round(fileSize/1024)}KB).

EXTRACT REAL DATA ONLY - DO NOT FABRICATE ANYTHING.

Document content:
${documentText.substring(0, 100000)}${documentText.length > 100000 ? '\n\n[Document truncated - analyze based on available content]' : ''}`
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
                    description: 'REAL extracted metrics with page citations - DO NOT FABRICATE',
                    items: {
                      type: 'object',
                      properties: {
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        metric: { type: 'string', description: 'Specific metric name (e.g., "Scope 1 CO2 emissions", "Female board representation")' },
                        value: { type: 'string', description: 'EXACT value from document with units (e.g., "45,000 tonnes CO2e", "34%", "Not disclosed")' },
                        year: { type: 'number', description: 'Year the metric relates to' },
                        snippet: { type: 'string', description: 'Direct quote from document showing this metric' },
                        page: { type: 'number', description: 'Page number where found (required)' },
                        confidence: { type: 'number', description: 'Confidence in extraction accuracy 0-100' },
                        impact: { type: 'string', enum: ['positive', 'negative', 'neutral', 'not_disclosed'] },
                        trend: { type: 'string', description: 'Year-over-year trend if available (e.g., "+5% from 2023", "decreased")' }
                      },
                      required: ['category', 'metric', 'value', 'snippet', 'page', 'confidence', 'impact']
                    }
                  },
                  key_metrics: {
                    type: 'object',
                    description: 'Summary of critical ESG metrics extracted',
                    properties: {
                      environmental: {
                        type: 'object',
                        properties: {
                          carbon_emissions: { type: 'string', description: 'Total emissions with unit and page (e.g., "1.2M tonnes CO2e, page 15") or "Not disclosed"' },
                          renewable_energy: { type: 'string', description: 'Percentage or amount (e.g., "85% renewable, page 22") or "Not disclosed"' },
                          water_usage: { type: 'string', description: 'Amount with unit (e.g., "1.5M m³, page 18") or "Not disclosed"' },
                          waste_recycled: { type: 'string', description: 'Percentage or amount (e.g., "75% recycled, page 19") or "Not disclosed"' }
                        }
                      },
                      social: {
                        type: 'object',
                        properties: {
                          workforce_size: { type: 'string', description: 'Total employees (e.g., "50,000 employees, page 12") or "Not disclosed"' },
                          female_leadership: { type: 'string', description: 'Percentage (e.g., "34% female leaders, page 27") or "Not disclosed"' },
                          safety_incidents: { type: 'string', description: 'Rate or count (e.g., "0.5 LTIFR, page 30") or "Not disclosed"' },
                          training_hours: { type: 'string', description: 'Hours per employee (e.g., "40 hrs/employee, page 25") or "Not disclosed"' }
                        }
                      },
                      governance: {
                        type: 'object',
                        properties: {
                          board_independence: { type: 'string', description: 'Percentage (e.g., "80% independent, page 8") or "Not disclosed"' },
                          board_diversity: { type: 'string', description: 'Female representation (e.g., "40% female, page 8") or "Not disclosed"' },
                          ethics_training: { type: 'string', description: 'Coverage (e.g., "100% trained, page 35") or "Not disclosed"' },
                          whistleblower_cases: { type: 'string', description: 'Number (e.g., "15 cases, page 36") or "Not disclosed"' }
                        }
                      }
                    }
                  },
                  risks: {
                    type: 'array',
                    description: 'ACTUAL risks mentioned or identified in the document',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Concise risk title' },
                        description: { type: 'string', description: 'Detailed explanation based on document content' },
                        severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        evidence: { type: 'string', description: 'Direct quote from document' },
                        page: { type: 'number', description: 'Page number (required)' },
                        is_disclosed: { type: 'boolean', description: 'Was this explicitly mentioned by company vs identified by analysis' },
                        mitigation: { type: 'string', description: 'Company\'s stated mitigation if mentioned' }
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
                  executive_summary: {
                    type: 'string',
                    description: 'Company-specific summary referencing ACTUAL data with page citations (2-3 paragraphs). Example: "According to page 14, Microsoft targets carbon-negative by 2030..."'
                  },
                  targets_and_commitments: {
                    type: 'array',
                    description: 'Forward-looking commitments extracted from document',
                    items: {
                      type: 'object',
                      properties: {
                        target: { type: 'string', description: 'Specific target (e.g., "Net zero by 2050")' },
                        category: { type: 'string', enum: ['environmental', 'social', 'governance'] },
                        timeline: { type: 'string', description: 'Target year or timeframe' },
                        baseline: { type: 'string', description: 'Baseline year if mentioned' },
                        page: { type: 'number' },
                        status: { type: 'string', description: 'Progress if mentioned (e.g., "50% achieved")' }
                      }
                    }
                  },
                  missing_disclosures: {
                    type: 'array',
                    description: 'Important ESG metrics NOT found in the document',
                    items: { type: 'string', description: 'Missing metric (e.g., "Scope 3 emissions", "Supplier diversity data")' }
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