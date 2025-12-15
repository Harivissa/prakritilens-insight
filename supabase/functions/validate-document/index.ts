import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// PRODUCTION-READY DOCUMENT VALIDATION
// Three-tier validation: Keywords + Structure + Semantic AI
// ============================================

// Comprehensive ESG keyword lists by category
const ESG_KEYWORDS = {
  environmental: [
    'sustainability', 'carbon', 'emissions', 'scope 1', 'scope 2', 'scope 3',
    'greenhouse gas', 'ghg', 'renewable energy', 'energy consumption', 'waste management',
    'water usage', 'biodiversity', 'pollution', 'climate change', 'carbon footprint',
    'net zero', 'decarbonization', 'environmental impact', 'eco-friendly', 'green initiatives',
    'circular economy', 'recycling', 'sustainable development', 'environmental performance',
    'clean energy', 'solar', 'wind power', 'energy efficiency', 'carbon neutral',
    'climate risk', 'environmental stewardship', 'natural resources', 'deforestation'
  ],
  social: [
    'diversity', 'inclusion', 'employee', 'workforce', 'human rights', 'labor practices',
    'health and safety', 'community engagement', 'stakeholder', 'social responsibility',
    'csr', 'corporate social responsibility', 'fair trade', 'supply chain ethics',
    'employee wellbeing', 'training and development', 'gender equality', 'pay equity',
    'workplace safety', 'employee satisfaction', 'human capital', 'social impact',
    'community investment', 'philanthropy', 'volunteer', 'dei', 'equity',
    'occupational health', 'talent development', 'employee engagement'
  ],
  governance: [
    'governance', 'board of directors', 'executive compensation', 'ethics', 'compliance',
    'risk management', 'audit', 'transparency', 'accountability', 'anti-corruption',
    'whistleblower', 'data privacy', 'cybersecurity', 'regulatory compliance',
    'corporate governance', 'shareholder rights', 'board diversity', 'independent directors',
    'code of conduct', 'business ethics', 'conflict of interest', 'internal controls',
    'fiduciary duty', 'oversight', 'governance structure', 'audit committee'
  ],
  frameworks: [
    'gri', 'global reporting initiative', 'sasb', 'sustainability accounting standards',
    'tcfd', 'task force on climate', 'cdp', 'carbon disclosure project', 'csrd',
    'corporate sustainability reporting directive', 'un sdgs', 'sustainable development goals',
    'iso 14001', 'b corp', 'ungc', 'un global compact', 'science-based targets',
    'sbti', 'integrated reporting', 'iirc', 'materiality assessment', 'esg disclosure',
    'non-financial reporting', 'sustainability report', 'annual report', 'esg report',
    'csr report', 'impact report', 'integrated report'
  ]
};

// Section headers that indicate ESG content
const ESG_SECTION_HEADERS = [
  'environmental performance', 'social impact', 'governance structure',
  'sustainability strategy', 'climate action', 'diversity and inclusion',
  'stakeholder engagement', 'materiality assessment', 'risk management',
  'supply chain', 'human capital', 'community relations', 'ethics and compliance',
  'board composition', 'executive leadership', 'environmental stewardship',
  'carbon emissions', 'energy management', 'water stewardship', 'waste reduction',
  'employee health', 'safety performance', 'data security', 'privacy practices',
  'sustainable development goals', 'gri index', 'sasb disclosure', 'tcfd alignment',
  'about this report', 'reporting scope', 'assurance statement', 'methodology',
  'our approach to sustainability', 'esg highlights', 'environmental goals',
  'social responsibility', 'corporate governance', 'ceo message', 'chairman letter'
];

interface ValidationResult {
  company_name: string;
  detected_year: number | null;
  page_count: number;
  document_type: 'Annual Report' | 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Unknown';
  esg_keywords_detected: number;
  keyword_breakdown: {
    environmental: number;
    social: number;
    governance: number;
    frameworks: number;
  };
  detected_frameworks: string[];
  semantic_match_score: number;
  section_headers_found: string[];
  final_validation_status: 'Accepted: ESG/Sustainability Report' | 'Maybe: Needs manual confirmation' | 'Rejected: Not an ESG report';
  confidence_level: 'High' | 'Medium' | 'Low';
  rejection_reason?: string;
  extracted_preview: string;
  validation_details: {
    keyword_score: number;
    structure_score: number;
    semantic_score: number;
    total_score: number;
  };
}

// Count ESG keywords with detailed breakdown
function countKeywords(text: string): { 
  total: number; 
  breakdown: { environmental: number; social: number; governance: number; frameworks: number };
  detectedFrameworks: string[];
} {
  const lowerText = text.toLowerCase();
  const breakdown = { environmental: 0, social: 0, governance: 0, frameworks: 0 };
  const detectedFrameworks: string[] = [];
  const frameworkMap: Record<string, string> = {
    'gri': 'GRI', 'global reporting initiative': 'GRI',
    'sasb': 'SASB', 'sustainability accounting standards': 'SASB',
    'tcfd': 'TCFD', 'task force on climate': 'TCFD',
    'cdp': 'CDP', 'carbon disclosure project': 'CDP',
    'csrd': 'CSRD', 'corporate sustainability reporting directive': 'CSRD',
    'un sdgs': 'UN SDGs', 'sustainable development goals': 'UN SDGs',
    'sbti': 'SBTi', 'science-based targets': 'SBTi',
    'ungc': 'UNGC', 'un global compact': 'UNGC'
  };
  
  for (const [category, keywords] of Object.entries(ESG_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        breakdown[category as keyof typeof breakdown] += matches.length;
        
        // Track frameworks
        if (frameworkMap[keyword]) {
          if (!detectedFrameworks.includes(frameworkMap[keyword])) {
            detectedFrameworks.push(frameworkMap[keyword]);
          }
        }
      }
    }
  }
  
  return {
    total: breakdown.environmental + breakdown.social + breakdown.governance + breakdown.frameworks,
    breakdown,
    detectedFrameworks
  };
}

// Detect ESG section headers
function detectSectionHeaders(text: string): string[] {
  const lowerText = text.toLowerCase();
  return ESG_SECTION_HEADERS.filter(header => lowerText.includes(header));
}

// Extract company name using multiple patterns
function extractCompanyName(text: string): string {
  const patterns = [
    /([A-Z][A-Za-z0-9\s&,']+?)\s+(?:sustainability|annual|esg|csr|integrated)\s+report/i,
    /(?:welcome to|about)\s+([A-Z][A-Za-z0-9\s&,.']+?)(?:\s+(?:inc|corp|ltd|llc|plc|group|company))?[.'"\s]/i,
    /(?:^|\n)([A-Z][A-Za-z0-9\s&,']+?)\s+(?:20\d{2})\s+(?:sustainability|annual)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 80 && !/^(the|and|for|with)$/i.test(name)) {
        return name.replace(/\s+/g, ' ');
      }
    }
  }
  return 'Unknown Company';
}

// Extract report year
function extractYear(text: string): number | null {
  const currentYear = new Date().getFullYear();
  const yearPattern = /\b(20\d{2})\b/g;
  const yearCounts: Record<number, number> = {};
  
  let match;
  while ((match = yearPattern.exec(text)) !== null) {
    const year = parseInt(match[1]);
    if (year >= 2015 && year <= currentYear + 1) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  }
  
  const years = Object.entries(yearCounts).sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]));
  return years.length > 0 ? parseInt(years[0][0]) : null;
}

// Detect document type
function detectDocumentType(text: string): ValidationResult['document_type'] {
  const lowerText = text.toLowerCase();
  
  if (/esg\s+report/i.test(lowerText)) return 'ESG Report';
  if (/sustainability\s+report/i.test(lowerText)) return 'Sustainability Report';
  if (/csr\s+report|corporate\s+social\s+responsibility\s+report/i.test(lowerText)) return 'CSR Report';
  if (/integrated\s+report/i.test(lowerText)) return 'Sustainability Report';
  if (/annual\s+report/i.test(lowerText)) return 'Annual Report';
  if (/impact\s+report/i.test(lowerText)) return 'ESG Report';
  
  return 'Unknown';
}

// Extract page count from text markers
function extractPageCount(text: string): number {
  const pageMarkers = text.match(/\[Page \d+\]/g);
  if (pageMarkers) return pageMarkers.length;
  return Math.ceil(text.length / 3000);
}

// Semantic analysis using OpenAI
async function getSemanticAnalysis(textSample: string): Promise<{ score: number; summary: string }> {
  if (!openAIApiKey) {
    console.log('OpenAI API key not found - using keyword-only validation');
    return { score: 50, summary: 'Semantic analysis unavailable (no API key)' };
  }
  
  try {
    console.log('Calling OpenAI for semantic analysis...');
    
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
            content: `You are an ESG document validation expert. Analyze text and determine if it's from a genuine ESG/sustainability/annual/CSR report.

Return ONLY a JSON object (no markdown):
{
  "score": <0-100>,
  "summary": "<brief assessment>"
}

Score guidelines:
- 80-100: Clearly ESG/sustainability report with metrics and frameworks
- 60-79: Contains significant ESG content
- 40-59: Some ESG elements but not primary focus
- 0-39: Not an ESG/sustainability document`
          },
          {
            role: 'user',
            content: `Is this from a genuine ESG/sustainability report?\n\n${textSample.slice(0, 6000)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return { score: 50, summary: 'Semantic analysis failed' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse response - handle both JSON and text responses
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(100, Math.max(0, parsed.score || 50)),
          summary: parsed.summary || 'Analysis complete'
        };
      }
    } catch (e) {
      console.log('Failed to parse as JSON, extracting score...');
    }
    
    // Fallback: try to extract score from text
    const scoreMatch = content.match(/(\d{1,3})/);
    return {
      score: scoreMatch ? Math.min(100, parseInt(scoreMatch[1])) : 50,
      summary: content.slice(0, 200)
    };
    
  } catch (error) {
    console.error('Semantic analysis error:', error);
    return { score: 50, summary: 'Semantic analysis error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== Document Validation Request ===');

  try {
    const { text, fileName, pageCount: inputPageCount } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No text content provided for validation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`File: ${fileName}, Text length: ${text.length}`);

    // === TIER 1: Keyword Analysis ===
    const keywordAnalysis = countKeywords(text);
    const keywordScore = Math.min(100, (keywordAnalysis.total / 50) * 100);
    console.log(`Keywords found: ${keywordAnalysis.total}, Score: ${keywordScore.toFixed(0)}`);
    
    // === TIER 2: Structure Analysis ===
    const sectionHeaders = detectSectionHeaders(text);
    const structureScore = Math.min(100, (sectionHeaders.length / 5) * 100);
    console.log(`Section headers found: ${sectionHeaders.length}, Score: ${structureScore.toFixed(0)}`);
    
    // === TIER 3: Semantic Analysis (AI) ===
    const semanticResult = await getSemanticAnalysis(text.slice(0, 15000));
    console.log(`Semantic score: ${semanticResult.score}`);
    
    // Extract metadata
    const companyName = extractCompanyName(text);
    const detectedYear = extractYear(text);
    const documentType = detectDocumentType(text);
    const pageCount = inputPageCount || extractPageCount(text);
    
    // === FINAL VALIDATION DECISION ===
    // Weighted scoring: Semantic 50%, Keywords 30%, Structure 20%
    const totalScore = (semanticResult.score * 0.5) + (keywordScore * 0.3) + (structureScore * 0.2);
    
    let finalStatus: ValidationResult['final_validation_status'];
    let confidenceLevel: ValidationResult['confidence_level'];
    let rejectionReason: string | undefined;
    
    // Decision rules
    if (semanticResult.score >= 70 || keywordAnalysis.total >= 50) {
      finalStatus = 'Accepted: ESG/Sustainability Report';
      confidenceLevel = 'High';
    } else if (totalScore >= 50 || (keywordAnalysis.total >= 20 && sectionHeaders.length >= 2)) {
      finalStatus = 'Maybe: Needs manual confirmation';
      confidenceLevel = 'Medium';
    } else {
      finalStatus = 'Rejected: Not an ESG report';
      confidenceLevel = 'Low';
      rejectionReason = `This document does not appear to be an ESG/sustainability report.\n\n` +
        `• Keywords found: ${keywordAnalysis.total} (need 20+ for consideration)\n` +
        `• ESG sections detected: ${sectionHeaders.length}\n` +
        `• Semantic match: ${semanticResult.score}%\n\n` +
        `Please upload a genuine:\n` +
        `✓ ESG Report\n✓ Sustainability Report\n✓ Annual Report\n✓ CSR Report`;
    }
    
    const result: ValidationResult = {
      company_name: companyName,
      detected_year: detectedYear,
      page_count: pageCount,
      document_type: documentType,
      esg_keywords_detected: keywordAnalysis.total,
      keyword_breakdown: keywordAnalysis.breakdown,
      detected_frameworks: keywordAnalysis.detectedFrameworks,
      semantic_match_score: semanticResult.score,
      section_headers_found: sectionHeaders.slice(0, 10),
      final_validation_status: finalStatus,
      confidence_level: confidenceLevel,
      rejection_reason: rejectionReason,
      extracted_preview: text.slice(0, 500).replace(/\s+/g, ' ') + '...',
      validation_details: {
        keyword_score: Math.round(keywordScore),
        structure_score: Math.round(structureScore),
        semantic_score: semanticResult.score,
        total_score: Math.round(totalScore)
      }
    };

    console.log(`=== Validation Result: ${finalStatus} ===`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Document validation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Validation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
