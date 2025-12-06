import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ESG-related keywords for validation
const ESG_KEYWORDS = {
  environmental: [
    'sustainability', 'carbon', 'emissions', 'scope 1', 'scope 2', 'scope 3',
    'greenhouse gas', 'ghg', 'renewable energy', 'energy consumption', 'waste management',
    'water usage', 'biodiversity', 'pollution', 'climate change', 'carbon footprint',
    'net zero', 'decarbonization', 'environmental impact', 'eco-friendly', 'green initiatives',
    'circular economy', 'recycling', 'sustainable development', 'environmental performance',
    'clean energy', 'solar', 'wind power', 'energy efficiency', 'carbon neutral'
  ],
  social: [
    'diversity', 'inclusion', 'employee', 'workforce', 'human rights', 'labor practices',
    'health and safety', 'community engagement', 'stakeholder', 'social responsibility',
    'csr', 'corporate social responsibility', 'fair trade', 'supply chain ethics',
    'employee wellbeing', 'training and development', 'gender equality', 'pay equity',
    'workplace safety', 'employee satisfaction', 'human capital', 'social impact',
    'community investment', 'philanthropy', 'volunteer', 'dei', 'equity'
  ],
  governance: [
    'governance', 'board of directors', 'executive compensation', 'ethics', 'compliance',
    'risk management', 'audit', 'transparency', 'accountability', 'anti-corruption',
    'whistleblower', 'data privacy', 'cybersecurity', 'regulatory compliance',
    'corporate governance', 'shareholder rights', 'board diversity', 'independent directors',
    'code of conduct', 'business ethics', 'conflict of interest', 'internal controls',
    'fiduciary duty', 'oversight', 'governance structure'
  ],
  frameworks: [
    'gri', 'global reporting initiative', 'sasb', 'sustainability accounting standards',
    'tcfd', 'task force on climate', 'cdp', 'carbon disclosure project', 'csrd',
    'corporate sustainability reporting directive', 'un sdgs', 'sustainable development goals',
    'iso 14001', 'b corp', 'ungc', 'un global compact', 'science-based targets',
    'sbti', 'integrated reporting', 'iirc', 'materiality assessment', 'esg disclosure',
    'non-financial reporting', 'sustainability report', 'annual report', 'esg report',
    'csr report', 'impact report', 'integrated report'
  ],
  reportTypes: [
    'annual report', 'sustainability report', 'esg report', 'csr report',
    'integrated report', 'impact report', 'environmental report', 'social report',
    'governance report', 'non-financial report', 'corporate responsibility report',
    'sustainability disclosure', 'climate report', 'sdg report'
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
  'about this report', 'reporting scope', 'assurance statement', 'methodology'
];

interface ValidationResult {
  company_name: string;
  detected_year: number | null;
  document_type: 'Annual Report' | 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Unknown';
  contains_esg_sections: boolean;
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
}

// Extract text chunks from document for processing
function chunkText(text: string, chunkSize: number = 3000): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at a sentence or paragraph boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start + chunkSize / 2) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  
  return chunks;
}

// Count ESG keywords in text
function countKeywords(text: string): { 
  total: number; 
  breakdown: { environmental: number; social: number; governance: number; frameworks: number };
  detectedFrameworks: string[];
} {
  const lowerText = text.toLowerCase();
  const breakdown = {
    environmental: 0,
    social: 0,
    governance: 0,
    frameworks: 0
  };
  const detectedFrameworks: string[] = [];
  
  // Count environmental keywords
  for (const keyword of ESG_KEYWORDS.environmental) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      breakdown.environmental += matches.length;
    }
  }
  
  // Count social keywords
  for (const keyword of ESG_KEYWORDS.social) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      breakdown.social += matches.length;
    }
  }
  
  // Count governance keywords
  for (const keyword of ESG_KEYWORDS.governance) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      breakdown.governance += matches.length;
    }
  }
  
  // Count framework keywords and track which ones are found
  for (const keyword of ESG_KEYWORDS.frameworks) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      breakdown.frameworks += matches.length;
      // Track specific frameworks
      if (keyword === 'gri' || keyword === 'global reporting initiative') {
        if (!detectedFrameworks.includes('GRI')) detectedFrameworks.push('GRI');
      } else if (keyword === 'sasb' || keyword === 'sustainability accounting standards') {
        if (!detectedFrameworks.includes('SASB')) detectedFrameworks.push('SASB');
      } else if (keyword === 'tcfd' || keyword === 'task force on climate') {
        if (!detectedFrameworks.includes('TCFD')) detectedFrameworks.push('TCFD');
      } else if (keyword === 'cdp' || keyword === 'carbon disclosure project') {
        if (!detectedFrameworks.includes('CDP')) detectedFrameworks.push('CDP');
      } else if (keyword === 'csrd' || keyword === 'corporate sustainability reporting directive') {
        if (!detectedFrameworks.includes('CSRD')) detectedFrameworks.push('CSRD');
      } else if (keyword === 'un sdgs' || keyword === 'sustainable development goals') {
        if (!detectedFrameworks.includes('UN SDGs')) detectedFrameworks.push('UN SDGs');
      }
    }
  }
  
  return {
    total: breakdown.environmental + breakdown.social + breakdown.governance + breakdown.frameworks,
    breakdown,
    detectedFrameworks
  };
}

// Detect section headers that indicate ESG content
function detectSectionHeaders(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundHeaders: string[] = [];
  
  for (const header of ESG_SECTION_HEADERS) {
    if (lowerText.includes(header)) {
      foundHeaders.push(header);
    }
  }
  
  return foundHeaders;
}

// Extract company name from text
function extractCompanyName(text: string): string {
  // Look for common patterns
  const patterns = [
    /(?:welcome to|about)\s+([A-Z][A-Za-z0-9\s&,.']+?)(?:\s+(?:inc|corp|ltd|llc|plc|group|company))?[.'"\s]/i,
    /([A-Z][A-Za-z0-9\s&,']+?)\s+(?:sustainability|annual|esg|csr|integrated)\s+report/i,
    /(?:^|\n)([A-Z][A-Za-z0-9\s&,']+?)\s+(?:20\d{2})\s+(?:sustainability|annual)/i,
    /([A-Z][A-Za-z0-9\s&]+(?:Inc|Corp|Ltd|LLC|PLC|Group)?)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 100) {
        return name;
      }
    }
  }
  
  return 'Unknown Company';
}

// Extract year from text
function extractYear(text: string): number | null {
  const currentYear = new Date().getFullYear();
  const yearPattern = /\b(20\d{2})\b/g;
  const years: number[] = [];
  
  let match;
  while ((match = yearPattern.exec(text)) !== null) {
    const year = parseInt(match[1]);
    if (year >= 2015 && year <= currentYear + 1) {
      years.push(year);
    }
  }
  
  if (years.length === 0) return null;
  
  // Return the most recent year that appears multiple times, or the most common year
  const yearCounts = years.reduce((acc, year) => {
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const sortedYears = Object.entries(yearCounts)
    .sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]));
  
  return parseInt(sortedYears[0][0]);
}

// Detect document type
function detectDocumentType(text: string): 'Annual Report' | 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Unknown' {
  const lowerText = text.toLowerCase();
  
  const typePatterns: [RegExp, 'ESG Report' | 'CSR Report' | 'Sustainability Report' | 'Annual Report'][] = [
    [/esg\s+report/i, 'ESG Report'],
    [/sustainability\s+report/i, 'Sustainability Report'],
    [/csr\s+report|corporate\s+social\s+responsibility\s+report/i, 'CSR Report'],
    [/integrated\s+report/i, 'Sustainability Report'],
    [/annual\s+report/i, 'Annual Report'],
    [/impact\s+report/i, 'ESG Report'],
    [/environmental\s+report/i, 'Sustainability Report'],
  ];
  
  for (const [pattern, type] of typePatterns) {
    if (pattern.test(lowerText)) {
      return type;
    }
  }
  
  return 'Unknown';
}

// Use OpenAI to get semantic analysis
async function getSemanticAnalysis(textSample: string): Promise<{ score: number; isESG: boolean; summary: string }> {
  if (!openAIApiKey) {
    console.log('OpenAI API key not found, using keyword-only validation');
    return { score: 50, isESG: false, summary: 'API key not available for semantic analysis' };
  }
  
  try {
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
            content: `You are an ESG document validation expert. Analyze the provided text sample and determine if it is from a genuine ESG, sustainability, annual report, or CSR report.

Return a JSON object with:
- score: 0-100 indicating confidence this is an ESG/sustainability document
- isESG: boolean indicating if this appears to be a genuine ESG-related report
- summary: brief explanation of your assessment

Focus on:
1. Presence of actual ESG metrics and data
2. Discussion of environmental, social, or governance topics
3. Reference to sustainability frameworks (GRI, SASB, TCFD, CDP, etc.)
4. Corporate responsibility language and commitments
5. Stakeholder engagement discussion`
          },
          {
            role: 'user',
            content: `Analyze this document excerpt and determine if it's from a genuine ESG/sustainability report:\n\n${textSample.slice(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return { score: 50, isESG: false, summary: 'Semantic analysis unavailable' };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (content) {
      const parsed = JSON.parse(content);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        isESG: parsed.isESG || false,
        summary: parsed.summary || 'Analysis complete'
      };
    }
    
    return { score: 50, isESG: false, summary: 'Could not parse semantic analysis' };
  } catch (error) {
    console.error('Semantic analysis error:', error);
    return { score: 50, isESG: false, summary: 'Semantic analysis failed' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, fileName } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No text content provided for validation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating document: ${fileName}, text length: ${text.length}`);

    // Process text in chunks for large documents
    const textChunks = chunkText(text, 5000);
    const sampleText = textChunks.slice(0, 10).join('\n'); // Use first ~50k characters for analysis
    
    // Extract metadata
    const companyName = extractCompanyName(text);
    const detectedYear = extractYear(text);
    const documentType = detectDocumentType(text);
    
    // Count keywords across all text
    const keywordAnalysis = countKeywords(text);
    
    // Detect section headers
    const sectionHeaders = detectSectionHeaders(text);
    
    // Get semantic analysis using AI
    const semanticResult = await getSemanticAnalysis(sampleText);
    
    // Calculate final validation
    const hasEnoughKeywords = keywordAnalysis.total >= 40;
    const hasSemanticMatch = semanticResult.score >= 70;
    const hasESGSections = sectionHeaders.length >= 3;
    const hasMediumKeywords = keywordAnalysis.total >= 15 && keywordAnalysis.total < 40;
    const hasMediumSemantic = semanticResult.score >= 40 && semanticResult.score < 70;
    
    let finalStatus: ValidationResult['final_validation_status'];
    let confidenceLevel: ValidationResult['confidence_level'];
    let rejectionReason: string | undefined;
    
    if (hasSemanticMatch || hasEnoughKeywords) {
      finalStatus = 'Accepted: ESG/Sustainability Report';
      confidenceLevel = 'High';
    } else if (hasMediumSemantic || hasMediumKeywords || hasESGSections) {
      finalStatus = 'Maybe: Needs manual confirmation';
      confidenceLevel = 'Medium';
    } else {
      finalStatus = 'Rejected: Not an ESG report';
      confidenceLevel = 'Low';
      rejectionReason = `This document does not appear to contain ESG reporting information. ` +
        `Found ${keywordAnalysis.total} ESG keywords (minimum 15 required) and ` +
        `semantic match score of ${semanticResult.score}% (minimum 40% required). ` +
        `Please upload a genuine sustainability, ESG, or annual report.`;
    }
    
    const result: ValidationResult = {
      company_name: companyName,
      detected_year: detectedYear,
      document_type: documentType,
      contains_esg_sections: sectionHeaders.length > 0,
      esg_keywords_detected: keywordAnalysis.total,
      keyword_breakdown: keywordAnalysis.breakdown,
      detected_frameworks: keywordAnalysis.detectedFrameworks,
      semantic_match_score: semanticResult.score,
      section_headers_found: sectionHeaders.slice(0, 10),
      final_validation_status: finalStatus,
      confidence_level: confidenceLevel,
      rejection_reason: rejectionReason,
      extracted_preview: text.slice(0, 500) + '...'
    };

    console.log(`Validation result for ${fileName}: ${finalStatus}`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Document validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Validation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
