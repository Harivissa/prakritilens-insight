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

async function extractTextFromDocument(file: File): Promise<{ text: string; pageCount: number }> {
  if (file.type === 'text/plain' || file.type === 'text/csv' || 
      file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
    return { text, pageCount: Math.ceil(text.length / 3000) };
  }
  
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      const numPages = Math.min(pdf.numPages, 100);
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `\n[Page ${i}]\n` + pageText;
      }
      
      if (fullText.trim().length === 0) {
        throw new Error('No text could be extracted from PDF');
      }
      
      return { text: fullText, pageCount: pdf.numPages };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Unable to extract text from PDF. Please ensure it is not password-protected or scanned.');
    }
  }
  
  if (file.name.endsWith('.docx')) {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { text: result.value, pageCount: Math.ceil(result.value.length / 3000) };
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Unable to extract text from DOCX file');
    }
  }
  
  throw new Error(`Unsupported file type: ${file.type}. Please upload PDF, DOCX, TXT, or CSV.`);
}

export function useESGScoring() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setProgress({ stage: 'Extracting text...', percent: 10 });
    
    try {
      console.log('Starting ESG analysis for:', file.name);
      
      const { text: extractedText, pageCount } = await extractTextFromDocument(file);
      console.log('Text extracted:', extractedText.length, 'characters,', pageCount, 'pages');
      setProgress({ stage: 'Validating document...', percent: 30 });
      
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
