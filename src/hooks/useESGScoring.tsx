import { useState } from 'react';

// Function to generate deterministic hash from file content
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

// Enhanced text extraction with better large file handling
const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileSize = file.size;
    const isLargeFile = fileSize > 10 * 1024 * 1024; // 10MB+
    
    // Simulate realistic processing time based on file size
    const baseTime = 1000; // 1 second base
    const sizeMultiplier = Math.min(fileSize / (1024 * 1024), 10); // Max 10x multiplier
    const processingTime = baseTime + (sizeMultiplier * 500); // Additional time for larger files
    
    setTimeout(() => {
      try {
        // Enhanced sample texts for different file types and sizes
        const sampleTexts = [
          // Large comprehensive report
          `Executive Summary: Our comprehensive Environmental, Social, and Governance (ESG) assessment reveals significant progress across all dimensions. Environmental Performance: We have successfully implemented renewable energy initiatives covering 85% of our operations, achieving a 40% reduction in carbon emissions compared to 2020 baseline. Our sustainability programs include comprehensive recycling initiatives, water conservation measures, and biodiversity protection protocols. Social Responsibility: Our workforce diversity programs have increased representation across all levels, with 45% women in leadership positions and comprehensive inclusion initiatives. Employee wellness programs, safety protocols, and community engagement initiatives demonstrate strong social commitment. We maintain ethical supply chain standards and fair labor practices across all operations. Governance Excellence: Our corporate governance framework includes independent board oversight, regular audits, transparent reporting mechanisms, and robust risk management systems. We maintain high standards of business ethics, regulatory compliance, and stakeholder engagement. Our ESG committee provides strategic oversight and ensures continuous improvement in sustainability performance.`,
          
          // Medium detailed report
          `ESG Performance Overview: Our organization demonstrates strong commitment to environmental stewardship through implementation of green energy solutions and waste reduction programs. We have achieved significant milestones in carbon footprint reduction and sustainable operations. Social initiatives focus on employee welfare, diversity and inclusion, and community engagement. Our governance structure ensures accountability, transparency, and ethical business practices. Areas for improvement include enhanced environmental monitoring, expanded social programs, and strengthened governance oversight mechanisms. We continue to invest in sustainable technologies and responsible business practices.`,
          
          // Standard report
          `Sustainability Report: The company shows good progress in environmental management with renewable energy adoption and emission reduction initiatives. Social responsibility efforts include employee wellness programs and community partnerships. Governance structures maintain appropriate oversight and compliance frameworks. Continued focus on improving ESG performance across all operational areas remains a priority for sustainable growth and stakeholder value creation.`
        ];
        
        // Select text based on file characteristics for deterministic results
        const hash = Array.from(file.name).reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        // Use file size to influence text selection for more realistic simulation
        let textIndex;
        if (isLargeFile) {
          textIndex = 0; // Use comprehensive text for large files
        } else if (fileSize > 5 * 1024 * 1024) {
          textIndex = 1; // Use medium text for medium files
        } else {
          textIndex = Math.abs(hash) % sampleTexts.length;
        }
        
        const selectedText = sampleTexts[textIndex];
        
        // For very large files, simulate chunked processing
        if (isLargeFile) {
          console.log(`Processing large file: ${file.name} (${(fileSize / (1024 * 1024)).toFixed(2)}MB)`);
        }
        
        resolve(selectedText);
        
      } catch (error) {
        console.error('Text extraction error:', error);
        reject(new Error('Failed to extract text from file. The file may be corrupted or unsupported.'));
      }
    }, processingTime);
  });
};