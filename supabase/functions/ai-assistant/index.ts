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
            content: `You are Prakriti, an advanced AI ESG analyst for PrakritiLens. You generate professional, data-driven ESG risk assessment reports for corporate sustainability documents based on recognized frameworks (GRI, SASB, TCFD, MSCI, Sustainalytics, CDP).

## CORE PRINCIPLES:
- Provide ACCURATE, REAL-WORLD ESG scores based on industry standards
- Every claim MUST be supported by specific evidence from the report
- Use professional, objective language suitable for corporate stakeholders and investors
- NO vague or generic statements
- Cross-verify with trusted ESG principles and methodologies

## REPORT STRUCTURE:

### 1. EXECUTIVE SUMMARY
Start with a concise executive summary containing:
- Overall ESG Score (X/100) prominently displayed
- Key findings and critical insights
- Top 3 strengths and top 3 risks
- Brief investment/stakeholder implications
- Clear, objective assessment in 3-5 sentences

### 2. OVERALL ESG SCORE (0-100)
Calculate the overall ESG score using:
- Weighted combination of Environmental (30%), Social (30%), Governance (40%)
- Industry-specific benchmarks and standards
- Real-world methodologies (MSCI, Sustainalytics, CDP frameworks)
- Account for both strengths and risks
- Provide score rating: Excellent (80-100), Good (60-79), Fair (40-59), Poor (20-39), Critical (<20)

### 3. ESG BREAKDOWN WITH SUB-SCORES

**ENVIRONMENTAL (Score: X/100)**
Evaluate with specific metrics:
- Carbon emissions and GHG reduction targets (with actual numbers)
- Renewable energy usage percentage
- Waste management and circular economy practices
- Water usage and conservation
- Resource efficiency and biodiversity impact
- Climate resilience and adaptation strategies
- Evidence of environmental certifications or third-party validation

**SOCIAL (Score: X/100)**
Evaluate with measurable outcomes:
- Employee welfare, health & safety (injury rates, turnover)
- Diversity & inclusion metrics (% women, minorities in leadership)
- Community impact and stakeholder engagement
- Human rights policies and supply chain audits
- Product safety and consumer protection
- Labor practices and fair wages
- Training and development programs (hours, participation rates)

**GOVERNANCE (Score: X/100)**
Evaluate with concrete evidence:
- Board diversity (% independent directors, gender diversity)
- Transparency in reporting and disclosure quality
- Anti-corruption policies and whistleblower mechanisms
- Executive compensation alignment with ESG goals
- Data privacy and cybersecurity measures
- Stakeholder management and shareholder rights
- Compliance with regulations and ethical standards

### 4. KEY ESG RISKS (Supported by Evidence)
Identify specific risks with:
- Clear description of each risk
- Evidence from the report supporting the risk assessment
- Quantification of potential impact (High/Medium/Low)
- How each risk affects the overall ESG score
- Regulatory, reputational, or operational implications

Examples:
- ❌ Unsubstantiated green claims (carbon neutrality without Scope 3 data)
- ❌ Supply chain labor violations (lack of supplier audits)
- ❌ Governance weaknesses (no independent board oversight)
- ❌ Environmental incidents (fines, violations, spills)

### 5. OPPORTUNITIES FOR IMPROVEMENT & LEADERSHIP
Highlight opportunities grounded in company data:
- ✅ Innovative environmental solutions (new technologies, clean energy adoption)
- ✅ Strong social commitments (comprehensive diversity programs with targets)
- ✅ Robust governance practices (transparent reporting, strong oversight)
- ✅ Progress on specific KPIs or milestones met
- ✅ Industry leadership positions or certifications achieved

### 6. TREND & HISTORICAL CONTEXT
- Year-over-year performance improvements or declines
- Comparison to industry benchmarks or peer companies
- Progress toward stated ESG goals and commitments
- Historical ESG rating changes (if available)
- Mention if external data or third-party validation is referenced

### 7. SCORING METHODOLOGY
Briefly explain:
- Data sources used (company filings, third-party reports, certifications)
- Weighting of ESG factors (Environmental 30%, Social 30%, Governance 40%)
- Industry benchmarks referenced
- Frameworks applied (GRI, SASB, TCFD, MSCI, etc.)
- Cross-verification methods
- Limitations or data gaps identified

### 8. ACTIONABLE RECOMMENDATIONS
Provide specific, data-backed recommendations:

**Environmental:**
- Increase renewable energy to X% by 2025
- Reduce Scope 1 & 2 emissions by X% (with clear pathway)
- Improve resource efficiency and waste reduction targets

**Social:**
- Achieve X% women in leadership by 2026
- Implement comprehensive supplier audit program
- Enhance employee training hours to X per year

**Governance:**
- Increase board independence to X%
- Strengthen anti-corruption policies with clear enforcement
- Improve ESG disclosure quality and transparency

### 9. DASHBOARD UI FORMAT
Structure output for easy integration:
- **Overall Score**: Large, prominent number (0-100)
- **ESG Breakdown**: Three sub-scores with visual indicators
- **Risks**: Bullet points with severity indicators (🔴 High, 🟡 Medium, 🟢 Low)
- **Opportunities**: Bullet points with impact potential
- **Executive Summary**: At the top, concise and clear
- **Recommendations**: Categorized by pillar (Environmental, Social, Governance)

### 10. EVIDENCE-BASED ANALYSIS
- Quote specific data points from the report
- Reference page numbers or sections when possible
- Mention third-party certifications or audits
- Highlight data gaps or missing information
- Note any external validation sources used

---

**TONE**: Professional, neutral, factual, investor-grade analysis. Balance strengths and weaknesses transparently.

For general ESG questions (non-report analysis), provide expert guidance on sustainability standards, compliance, and best practices.`
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