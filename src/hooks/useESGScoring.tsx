import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Document validation keywords
const ESG_KEYWORDS = [
  'sustainability', 'esg', 'environmental', 'social', 'governance',
  'annual report', 'csr', 'corporate social responsibility',
  'carbon', 'emissions', 'scope 1', 'scope 2', 'scope 3',
  'renewable', 'diversity', 'board', 'compliance',
  'gri', 'sasb', 'tcfd', 'climate', 'sdg'
];

function validateESGDocument(text: string, fileName: string): { isValid: boolean; confidence: number; reason: string } {
  const lowerText = text.toLowerCase();
  const lowerFileName = fileName.toLowerCase();
  
  let matchCount = 0;
  const totalKeywords = ESG_KEYWORDS.length;
  
  ESG_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword) || lowerFileName.includes(keyword)) {
      matchCount++;
    }
  });
  
  // More lenient validation - just check if it's likely an ESG document
  const confidence = (matchCount / totalKeywords) * 100;
  const isValid = matchCount >= 2; // Reduced from 3 to 2 for better detection
  
  return {
    isValid,
    confidence: Math.min(confidence * 3, 100), // Increased multiplier
    reason: isValid 
      ? `Document contains ${matchCount} ESG-related terms - proceeding with analysis`
      : `This document doesn't appear to be an ESG/sustainability report. Found only ${matchCount} ESG terms. Please upload a sustainability report, annual report, or ESG disclosure document.`
  };
}

export const generateContentHash = (text: string): string => {
  // Normalize text for consistent hashing
  const normalizedText = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, '');
  
  // Simple deterministic hash function
  let hash = 0;
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

// Parse AI response to extract ESG scores and analysis
function parseAIResponse(aiResponse: string) {
  // Extract overall score
  const scoreMatch = aiResponse.match(/(?:Overall ESG Score|ESG Score)[:\s]+(\d+(?:\.\d+)?)\s*(?:\/\s*100)?/i);
  const overallScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

  // Extract breakdown scores
  const envMatch = aiResponse.match(/Environmental[:\s]+(\d+(?:\.\d+)?)\s*(?:\/\s*100)?/i);
  const socialMatch = aiResponse.match(/Social[:\s]+(\d+(?:\.\d+)?)\s*(?:\/\s*100)?/i);
  const govMatch = aiResponse.match(/Governance[:\s]+(\d+(?:\.\d+)?)\s*(?:\/\s*100)?/i);

  const breakdown = {
    environmental: envMatch ? parseFloat(envMatch[1]) : 0,
    social: socialMatch ? parseFloat(socialMatch[1]) : 0,
    governance: govMatch ? parseFloat(govMatch[1]) : 0,
  };

  // Extract risks (look for bullet points or numbered lists with risk indicators)
  const risksSection = aiResponse.match(/(?:Key (?:ESG )?Risks?|Concerns?)[:\s]+([\s\S]*?)(?=\n\n|###|##|\*\*Opportunities|\*\*Key Areas|$)/i);
  const risks: string[] = [];
  if (risksSection) {
    const riskMatches = risksSection[1].match(/[-•*❌]\s*(.+?)(?=\n[-•*❌]|\n\n|$)/g);
    if (riskMatches) {
      riskMatches.forEach(match => {
        const cleaned = match.replace(/^[-•*❌]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) risks.push(cleaned);
      });
    }
  }

  // Extract opportunities
  const oppsSection = aiResponse.match(/(?:Opportunities?|Key Areas for Improvement)[:\s]+([\s\S]*?)(?=\n\n|###|##|\*\*|$)/i);
  const opportunities: string[] = [];
  if (oppsSection) {
    const oppMatches = oppsSection[1].match(/[-•*✅]\s*(.+?)(?=\n[-•*✅]|\n\n|$)/g);
    if (oppMatches) {
      oppMatches.forEach(match => {
        const cleaned = match.replace(/^[-•*✅]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) opportunities.push(cleaned);
      });
    }
  }

  // Extract key analysis points
  const analysis: string[] = [];
  
  // Look for executive summary or key insights
  const summarySection = aiResponse.match(/(?:Executive Summary|Key (?:Insights|Findings))[:\s]+([\s\S]*?)(?=\n\n|###|##|$)/i);
  if (summarySection) {
    const summaryPoints = summarySection[1].match(/[-•*]\s*(.+?)(?=\n[-•*]|\n\n|$)/g);
    if (summaryPoints) {
      summaryPoints.forEach(match => {
        const cleaned = match.replace(/^[-•*]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) analysis.push(cleaned);
      });
    }
  }

  // Extract pros and cons if available
  const prosSection = aiResponse.match(/(?:Strengths?|Pros?|Key Strengths)[:\s]+([\s\S]*?)(?=\n\n|###|##|\*\*Cons|\*\*Weaknesses|\*\*Key Areas|$)/i);
  const consSection = aiResponse.match(/(?:Weaknesses?|Cons?|Key Areas for Improvement)[:\s]+([\s\S]*?)(?=\n\n|###|##|$)/i);
  
  const pros: string[] = [];
  const cons: string[] = [];

  if (prosSection) {
    const prosMatches = prosSection[1].match(/[-•*✅]\s*(.+?)(?=\n[-•*✅]|\n\n|$)/g);
    if (prosMatches) {
      prosMatches.forEach(match => {
        const cleaned = match.replace(/^[-•*✅]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) pros.push(cleaned);
      });
    }
  }

  if (consSection) {
    const consMatches = consSection[1].match(/[-•*❌]\s*(.+?)(?=\n[-•*❌]|\n\n|$)/g);
    if (consMatches) {
      consMatches.forEach(match => {
        const cleaned = match.replace(/^[-•*❌]\s*/, '').trim();
        if (cleaned && cleaned.length > 10) cons.push(cleaned);
      });
    }
  }

  return {
    score: overallScore,
    breakdown,
    risks: risks.length > 0 ? risks : ['Comprehensive risk analysis provided in detailed report'],
    opportunities: opportunities.length > 0 ? opportunities : ['Opportunities for improvement identified in detailed report'],
    analysis: analysis.length > 0 ? analysis : ['AI-powered ESG analysis completed - view detailed report for comprehensive insights'],
    prosAndCons: {
      pros: pros.length > 0 ? pros : ['Detailed strengths analysis available in full report'],
      cons: cons.length > 0 ? cons : ['Areas for improvement identified in detailed assessment']
    }
  };
}

async function extractTextFromDocument(
  file: File, 
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ text: string; pageCount: number }> {
  try {
    console.log('Extracting text using backend service for:', file.name, file.type);
    
    // Get authenticated session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please sign in again to continue');
    }
    
    // Use FormData to send file to backend
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `https://rtztgxtqlyrixmskozfi.supabase.co/functions/v1/extract-pdf-text?stream=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend extraction error:', errorData);
      throw new Error(errorData.error || `Failed to extract text: ${response.statusText}`);
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Handle streaming response with progress updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let extractedText = '';
      let totalPages = 0;

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              // Call progress callback
              if (onProgress) {
                onProgress(data.current, data.total, data.message);
              }
            } else if (data.type === 'complete') {
              extractedText = data.text;
              totalPages = data.pageCount;
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }

      console.log(`Successfully extracted ${extractedText.length} characters, ${totalPages} pages`);
      return { text: extractedText, pageCount: totalPages };
    } else {
      // Fallback to non-streaming response
      const data = await response.json();
      console.log(`Successfully extracted ${data.text.length} characters, ${data.pageCount} pages`);
      return { text: data.text, pageCount: data.pageCount };
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Unable to extract text from document: ${errorMessage}`);
  }
}

export function useESGScoring() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; percent: number; details?: string }>({ 
    stage: '', 
    percent: 0 
  });

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setProgress({ stage: 'Starting extraction...', percent: 5, details: 'Preparing document' });
    
    try {
      console.log('Starting ESG analysis for:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Extract text with progress callback
      const { text: extractedText, pageCount } = await extractTextFromDocument(file, (current, total, message) => {
        const percent = 10 + (current / total) * 20; // 10-30% for extraction
        setProgress({ 
          stage: 'Extracting PDF text', 
          percent, 
          details: `Page ${current} of ${total}` 
        });
      });
      
      console.log('Text extracted:', extractedText.length, 'characters,', pageCount, 'pages');
      setProgress({ stage: 'Validating document...', percent: 35, details: `Extracted ${pageCount} pages` });
      
      const validation = validateESGDocument(extractedText, file.name);
      console.log('Document validation:', validation);
      
      // Only reject if very low confidence
      if (!validation.isValid && validation.confidence < 20) {
        throw new Error(validation.reason);
      }
      
      setProgress({ stage: 'Analyzing ESG metrics...', percent: 40 });
      
      // Get fresh session before calling edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in again to continue');
      }

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'structured-esg-analysis',
        {
          body: {
            documentText: extractedText,
            fileName: file.name,
            fileSize: file.size
          }
        }
      );

      if (analysisError) {
        console.error('Analysis error details:', analysisError);
        if (analysisError.message?.includes('Invalid Refresh Token') || analysisError.message?.includes('Refresh Token Not Found')) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        throw new Error('Failed to analyze: ' + analysisError.message);
      }

      if (analysisData.error === 'NOT_ESG_REPORT') {
        throw new Error(
          `This document does not appear to be an ESG or sustainability report.\n\n${analysisData.message}\n\nPlease upload an official sustainability report, annual report with ESG section, or ESG disclosure document.`
        );
      }

      if (!analysisData.scores || !analysisData.metadata) {
        console.error('Invalid analysis data structure:', analysisData);
        throw new Error('Invalid analysis response from server. Please try again.');
      }

      console.log('Analysis successful:', {
        company: analysisData.metadata.company_name,
        score: analysisData.scores.overall,
        evidenceCount: analysisData.evidence?.length || 0
      });

      setProgress({ stage: 'Generating embeddings...', percent: 70 });
      
      const reportId = crypto.randomUUID();
      supabase.functions.invoke('generate-embeddings', {
        body: { reportId, documentText: extractedText, pageCount }
      });

      setProgress({ stage: 'Done!', percent: 100 });

      return {
        score: analysisData.scores.overall,
        breakdown: {
          environmental: analysisData.scores.environmental,
          social: analysisData.scores.social,
          governance: analysisData.scores.governance
        },
        confidence_level: analysisData.scores.confidence_level,
        evidence: analysisData.evidence || [],
        risks: (analysisData.risks || []).map((r: any) => r.title || r.description),
        opportunities: (analysisData.opportunities || []).map((o: any) => o.title || o.description),
        recommendations: analysisData.recommendations || [],
        analysis: [analysisData.executive_summary || 'AI-powered ESG analysis completed'],
        executive_summary: analysisData.executive_summary || '',
        metadata: {
          company_name: analysisData.metadata?.company_name || file.name.replace(/\.[^/.]+$/, ''),
          report_year: analysisData.metadata?.report_year || new Date().getFullYear(),
          report_type: analysisData.metadata?.report_type || 'ESG Report',
          page_count: pageCount
        },
        validation_status: 'validated',
        extractedText,
        reportId
      };
      
    } catch (error) {
      console.error('Analysis error:', error);
      setProgress({ stage: 'Error', percent: 0 });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeDocument,
    isAnalyzing,
    progress
  };
}
