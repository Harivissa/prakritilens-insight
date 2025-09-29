import { useState } from 'react';

// Deterministic ESG scoring algorithm
export const calculateESGScore = (text: string): { 
  score: number; 
  breakdown: { environmental: number; social: number; governance: number }; 
  analysis: string[];
  risks: string[];
  opportunities: string[];
} => {
  // Convert text to lowercase for consistent analysis
  const normalizedText = text.toLowerCase();
  
  // Environmental keywords and weights
  const environmentalKeywords = {
    positive: ['renewable', 'sustainability', 'carbon neutral', 'green energy', 'recycling', 'biodiversity', 'clean', 'eco-friendly', 'emissions reduction'],
    negative: ['pollution', 'waste', 'carbon footprint', 'deforestation', 'toxic', 'emissions', 'greenhouse gas']
  };
  
  // Social keywords and weights
  const socialKeywords = {
    positive: ['diversity', 'inclusion', 'employee welfare', 'community', 'safety', 'human rights', 'training', 'wellbeing'],
    negative: ['discrimination', 'labor violations', 'unsafe', 'inequality', 'exploitation', 'harassment']
  };
  
  // Governance keywords and weights
  const governanceKeywords = {
    positive: ['transparency', 'accountability', 'ethics', 'compliance', 'oversight', 'board independence', 'audit'],
    negative: ['corruption', 'fraud', 'conflicts of interest', 'opacity', 'insider trading', 'bribery']
  };
  
  // Calculate scores for each category (0-100)
  const calculateCategoryScore = (positiveKeywords: string[], negativeKeywords: string[]) => {
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveKeywords.forEach(keyword => {
      const matches = (normalizedText.match(new RegExp(keyword, 'g')) || []).length;
      positiveCount += matches;
    });
    
    negativeKeywords.forEach(keyword => {
      const matches = (normalizedText.match(new RegExp(keyword, 'g')) || []).length;
      negativeCount += matches * 2; // Negative keywords have more weight
    });
    
    // Base score starts at 50, adjusted by keyword presence
    const baseScore = 50;
    const positiveImpact = Math.min(positiveCount * 5, 40); // Max 40 points from positive
    const negativeImpact = Math.min(negativeCount * 3, 35); // Max 35 points deduction
    
    return Math.max(10, Math.min(95, baseScore + positiveImpact - negativeImpact));
  };
  
  const environmental = calculateCategoryScore(environmentalKeywords.positive, environmentalKeywords.negative);
  const social = calculateCategoryScore(socialKeywords.positive, socialKeywords.negative);
  const governance = calculateCategoryScore(governanceKeywords.positive, governanceKeywords.negative);
  
  // Overall score is weighted average
  const score = Math.round((environmental * 0.4 + social * 0.35 + governance * 0.25));
  
  // Generate analysis based on scores
  const analysis = [];
  if (environmental > 70) analysis.push('Strong environmental performance with positive sustainability initiatives');
  if (environmental < 40) analysis.push('Environmental risks identified requiring immediate attention');
  if (social > 70) analysis.push('Excellent social responsibility and stakeholder engagement');
  if (social < 40) analysis.push('Social governance concerns that need addressing');
  if (governance > 70) analysis.push('Robust governance framework with strong oversight');
  if (governance < 40) analysis.push('Governance weaknesses pose significant risks');
  
  // Identify risks and opportunities
  const risks = [];
  const opportunities = [];
  
  if (environmental < 50) risks.push('Environmental compliance and climate change risks');
  if (social < 50) risks.push('Reputational risks from social responsibility gaps');
  if (governance < 50) risks.push('Regulatory and operational risks from governance deficiencies');
  
  if (environmental > 60) opportunities.push('Leadership in sustainability and green innovation');
  if (social > 60) opportunities.push('Strong brand value through social responsibility');
  if (governance > 60) opportunities.push('Investor confidence through transparent governance');
  
  return {
    score,
    breakdown: { environmental, social, governance },
    analysis: analysis.length > 0 ? analysis : ['Standard ESG performance with room for improvement'],
    risks: risks.length > 0 ? risks : ['No significant ESG risks identified'],
    opportunities: opportunities.length > 0 ? opportunities : ['Opportunities exist to enhance ESG performance']
  };
};

export const useESGScoring = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeDocument = async (file: File): Promise<{
    score: number;
    breakdown: { environmental: number; social: number; governance: number };
    analysis: string[];
    risks: string[];
    opportunities: string[];
    extractedText: string;
  }> => {
    setIsAnalyzing(true);
    
    try {
      // Extract text from file (simulated for PDF/document processing)
      const extractedText = await extractTextFromFile(file);
      
      // Calculate deterministic ESG score
      const result = calculateESGScore(extractedText);
      
      return {
        ...result,
        extractedText
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeDocument,
    isAnalyzing,
    calculateESGScore
  };
};

// Simulated text extraction (in production, would use actual PDF parsing)
const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Generate deterministic text based on file name and size for demo
      const sampleTexts = [
        "Our company is committed to sustainability and renewable energy initiatives. We have implemented comprehensive recycling programs and achieved carbon neutral operations. Our diversity and inclusion programs ensure equal opportunities for all employees. We maintain transparent governance with independent board oversight and regular audits.",
        "The organization faces challenges with emissions reduction and waste management. Labor relations require improvement and there are concerns about workplace safety. Governance structures need strengthening with better accountability measures and compliance frameworks.",
        "Strong environmental performance through green energy adoption and biodiversity conservation. Excellent employee welfare programs and community engagement initiatives. Robust ethics and transparency policies with effective oversight mechanisms."
      ];
      
      // Use file name hash to determine which sample text (deterministic)
      const hash = Array.from(file.name).reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const textIndex = Math.abs(hash) % sampleTexts.length;
      resolve(sampleTexts[textIndex]);
    }, 2000);
  });
};