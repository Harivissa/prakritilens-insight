import PptxGenJS from 'pptxgenjs';
// PDF generation utilities for ESG reports
// Note: This is a simplified version. In production, you'd use libraries like jsPDF or PDFKit
export interface ESGReportData {
  companyName: string;
  score: number;
  breakdown: { environmental: number; social: number; governance: number };
  analysis: string[];
  risks: string[];
  opportunities: string[];
  fileName: string;
  generatedAt: string;
}

export const generatePDFReport = async (data: ESGReportData): Promise<Blob> => {
  // Create a formatted HTML document that can be converted to PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>PrakritiLens ESG Assessment Report</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #22c55e;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #22c55e;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          color: #666;
        }
        .company-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .score-container {
          text-align: center;
          margin: 30px 0;
        }
        .overall-score {
          font-size: 48px;
          font-weight: bold;
          color: ${getScoreColor(data.score)};
          margin: 10px 0;
        }
        .score-label {
          font-size: 16px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .breakdown {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }
        .breakdown-item {
          text-align: center;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .breakdown-score {
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0;
        }
        .environmental { color: #059669; }
        .social { color: #dc2626; }
        .governance { color: #7c3aed; }
        .section {
          margin: 30px 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #22c55e;
          margin-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .list-item {
          margin: 10px 0;
          padding-left: 20px;
          position: relative;
        }
        .list-item:before {
          content: "•";
          color: #22c55e;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 20px; }
          .breakdown { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">PrakritiLens</div>
        <div class="subtitle">ESG Risk Assessment Report</div>
      </div>

      <div class="company-info">
        <h2>Company: ${data.companyName}</h2>
        <p><strong>Report File:</strong> ${data.fileName}</p>
        <p><strong>Generated:</strong> ${new Date(data.generatedAt).toLocaleDateString()}</p>
      </div>

      <div class="score-container">
        <div class="score-label">Overall ESG Score</div>
        <div class="overall-score">${data.score}</div>
        <div class="score-label">${getScoreRating(data.score)}</div>
      </div>

      <div class="section">
        <div class="section-title">ESG Breakdown</div>
        <div class="breakdown">
          <div class="breakdown-item">
            <h3>Environmental</h3>
            <div class="breakdown-score environmental">${data.breakdown.environmental}</div>
          </div>
          <div class="breakdown-item">
            <h3>Social</h3>
            <div class="breakdown-score social">${data.breakdown.social}</div>
          </div>
          <div class="breakdown-item">
            <h3>Governance</h3>
            <div class="breakdown-score governance">${data.breakdown.governance}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Key Analysis</div>
        ${data.analysis.map(item => `<div class="list-item">${item}</div>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">Identified Risks</div>
        ${data.risks.map(item => `<div class="list-item">${item}</div>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">Opportunities</div>
        ${data.opportunities.map(item => `<div class="list-item">${item}</div>`).join('')}
      </div>

      <div class="section">
        <div class="section-title">Recommendations</div>
        ${generateRecommendations(data).map(item => `<div class="list-item">${item}</div>`).join('')}
      </div>

      <div class="footer">
        <p>This report was generated by PrakritiLens ESG Assessment Platform</p>
        <p>For more information, visit our platform or contact our ESG specialists</p>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF (simplified approach)
  // In production, you'd use a proper PDF generation library
  const blob = new Blob([htmlContent], { type: 'text/html' });
  return blob;
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669'; // Green
  if (score >= 60) return '#d97706'; // Orange
  if (score >= 40) return '#dc2626'; // Red
  return '#7f1d1d'; // Dark red
}

function getScoreRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

function generateRecommendations(data: ESGReportData): string[] {
  const recommendations = [];
  
  if (data.breakdown.environmental < 60) {
    recommendations.push('Implement comprehensive environmental management systems');
    recommendations.push('Set science-based targets for emissions reduction');
  }
  
  if (data.breakdown.social < 60) {
    recommendations.push('Enhance diversity and inclusion programs');
    recommendations.push('Strengthen employee engagement and welfare initiatives');
  }
  
  if (data.breakdown.governance < 60) {
    recommendations.push('Improve board independence and oversight mechanisms');
    recommendations.push('Enhance transparency in reporting and stakeholder communication');
  }
  
  if (data.score >= 80) {
    recommendations.push('Maintain leadership position through continuous improvement');
    recommendations.push('Share best practices with industry peers');
  }
  
  return recommendations.length > 0 ? recommendations : [
    'Continue monitoring ESG performance metrics',
    'Regular stakeholder engagement and feedback collection',
    'Annual ESG strategy review and goal setting'
  ];
}

export const downloadPDF = async (data: ESGReportData) => {
  try {
    const pdfBlob = await generatePDFReport(data);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ESG_Report_${data.companyName}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const downloadCSV = (data: ESGReportData) => {
  const rows: (string | number)[][] = [
    ['Company', data.companyName],
    ['Overall Score', data.score],
    ['Environmental', data.breakdown.environmental],
    ['Social', data.breakdown.social],
    ['Governance', data.breakdown.governance],
    [],
    ['Analysis'],
    ...data.analysis.map((a) => [a]),
    [],
    ['Risks'],
    ...data.risks.map((r) => [r]),
    [],
    ['Opportunities'],
    ...data.opportunities.map((o) => [o]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ESG_Report_${data.companyName}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadPPTX = async (data: ESGReportData) => {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'LAYOUT_WIDE';

  const titleSlide = pptx.addSlide();
  titleSlide.addText('PrakritiLens ESG Report', { x: 0.5, y: 0.5, fontSize: 28, bold: true, color: '22C55E' });
  titleSlide.addText(`Company: ${data.companyName}`, { x: 0.5, y: 1.2, fontSize: 16 });
  titleSlide.addText(`Generated: ${new Date(data.generatedAt).toLocaleDateString()}`, { x: 0.5, y: 1.7, fontSize: 14, color: '666666' });
  titleSlide.addText(`Overall Score: ${data.score}`, { x: 0.5, y: 2.3, fontSize: 22, bold: true });
  titleSlide.addText(`E: ${data.breakdown.environmental}  S: ${data.breakdown.social}  G: ${data.breakdown.governance}`, { x: 0.5, y: 2.9, fontSize: 16 });

  const analysisSlide = pptx.addSlide();
  analysisSlide.addText('Key Analysis', { x: 0.5, y: 0.5, fontSize: 20, bold: true });
  analysisSlide.addText(data.analysis.map((a) => `• ${a}`).join('\n'), { x: 0.5, y: 1.1, fontSize: 14, bullet: true, color: '333333' });

  const risksOppSlide = pptx.addSlide();
  risksOppSlide.addText('Risks', { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: 'DC2626' });
  risksOppSlide.addText(data.risks.map((r) => `• ${r}`).join('\n'), { x: 0.5, y: 1.1, fontSize: 14, bullet: true });
  risksOppSlide.addText('Opportunities', { x: 7, y: 0.5, fontSize: 20, bold: true, color: '059669' });
  risksOppSlide.addText(data.opportunities.map((o) => `• ${o}`).join('\n'), { x: 7, y: 1.1, fontSize: 14, bullet: true });

  const date = new Date().toISOString().split('T')[0];
  await pptx.writeFile({ fileName: `ESG_Report_${data.companyName}_${date}.pptx` });
};