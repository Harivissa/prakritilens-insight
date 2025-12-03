// PDF generator for Real ESG Reports with full metrics and citations

export interface RealESGReportData {
  metadata?: {
    company_name: string;
    report_year: number;
    report_type: string;
  };
  scores: {
    overall: number;
    environmental: number;
    social: number;
    governance: number;
    confidence_level: string;
  };
  evidence: Array<{
    category: string;
    metric: string;
    value: string;
    year?: number;
    snippet: string;
    page: number;
    confidence: number;
    impact: string;
    trend?: string;
  }>;
  key_metrics?: {
    environmental?: {
      carbon_emissions?: string;
      renewable_energy?: string;
      water_usage?: string;
      waste_recycled?: string;
    };
    social?: {
      workforce_size?: string;
      female_leadership?: string;
      safety_incidents?: string;
      training_hours?: string;
    };
    governance?: {
      board_independence?: string;
      board_diversity?: string;
      ethics_training?: string;
      whistleblower_cases?: string;
    };
  };
  risks: Array<{
    title: string;
    description: string;
    severity: string;
    category: string;
    evidence?: string;
    page: number;
    is_disclosed?: boolean;
    mitigation?: string;
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    category: string;
    priority: string;
  }>;
  executive_summary: string;
  targets_and_commitments?: Array<{
    target: string;
    category: string;
    timeline: string;
    baseline?: string;
    page: number;
    status?: string;
  }>;
  missing_disclosures?: string[];
  fileName: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#d97706';
  if (score >= 40) return '#dc2626';
  return '#7f1d1d';
}

function getScoreRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#d97706';
    case 'low': return '#65a30d';
    default: return '#6b7280';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const generateRealESGPDF = (data: RealESGReportData): string => {
  const companyName = data.metadata?.company_name || 'Company Report';
  const reportYear = data.metadata?.report_year || new Date().getFullYear();
  const reportType = data.metadata?.report_type || 'ESG Report';

  const environmentalEvidence = data.evidence.filter(e => e.category === 'environmental');
  const socialEvidence = data.evidence.filter(e => e.category === 'social');
  const governanceEvidence = data.evidence.filter(e => e.category === 'governance');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ESG Analysis Report - ${escapeHtml(companyName)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid #059669;
    }
    .logo {
      font-size: 36px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 8px;
    }
    .report-title {
      font-size: 24px;
      color: #374151;
      margin-bottom: 10px;
    }
    .meta-info {
      color: #6b7280;
      font-size: 14px;
    }
    .scores-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .score-card {
      text-align: center;
      padding: 20px;
      border-radius: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }
    .score-card.overall {
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-color: #86efac;
    }
    .score-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .score-value {
      font-size: 36px;
      font-weight: bold;
    }
    .score-rating {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    .section {
      margin: 40px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-icon {
      width: 24px;
      height: 24px;
    }
    .executive-summary {
      background: #f9fafb;
      padding: 25px;
      border-radius: 12px;
      border-left: 4px solid #059669;
      white-space: pre-wrap;
    }
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .metrics-table th,
    .metrics-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .metrics-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .metrics-table tr:hover {
      background: #f9fafb;
    }
    .evidence-item {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
    }
    .evidence-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .evidence-metric {
      font-weight: 600;
      color: #1f2937;
    }
    .evidence-value {
      font-size: 18px;
      font-weight: bold;
      color: #059669;
      margin: 5px 0;
    }
    .evidence-snippet {
      font-style: italic;
      color: #6b7280;
      font-size: 14px;
      background: #f9fafb;
      padding: 10px;
      border-radius: 6px;
      margin-top: 10px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-page {
      background: #e5e7eb;
      color: #374151;
    }
    .badge-category {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .badge-impact-positive {
      background: #dcfce7;
      color: #166534;
    }
    .badge-impact-negative {
      background: #fee2e2;
      color: #dc2626;
    }
    .badge-impact-neutral {
      background: #f3f4f6;
      color: #6b7280;
    }
    .risk-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid;
    }
    .risk-critical { border-left-color: #dc2626; }
    .risk-high { border-left-color: #ea580c; }
    .risk-medium { border-left-color: #d97706; }
    .risk-low { border-left-color: #65a30d; }
    .risk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .risk-title {
      font-weight: 600;
      color: #1f2937;
    }
    .risk-description {
      color: #6b7280;
      font-size: 14px;
    }
    .risk-evidence {
      font-style: italic;
      color: #6b7280;
      font-size: 13px;
      margin-top: 8px;
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
    }
    .mitigation {
      background: #f0fdf4;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 8px;
      font-size: 13px;
    }
    .target-item {
      border-left: 4px solid #3b82f6;
      padding: 12px 15px;
      margin: 10px 0;
      background: #f9fafb;
      border-radius: 0 8px 8px 0;
    }
    .target-text {
      font-weight: 600;
      color: #1f2937;
    }
    .target-meta {
      display: flex;
      gap: 15px;
      margin-top: 5px;
      font-size: 13px;
      color: #6b7280;
    }
    .opportunity-item {
      border-left: 4px solid #059669;
      padding: 12px 15px;
      margin: 10px 0;
      background: #f9fafb;
      border-radius: 0 8px 8px 0;
    }
    .missing-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      color: #d97706;
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .confidence-badge {
      display: inline-block;
      padding: 5px 12px;
      background: #f3f4f6;
      border-radius: 20px;
      font-size: 12px;
      color: #6b7280;
      margin-top: 10px;
    }
    .category-section {
      margin: 20px 0;
    }
    .category-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .env-color { color: #059669; }
    .social-color { color: #3b82f6; }
    .gov-color { color: #7c3aed; }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
      .scores-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PrakritiLens</div>
    <div class="report-title">ESG Analysis Report</div>
    <h1 style="font-size: 28px; margin: 10px 0;">${escapeHtml(companyName)}</h1>
    <div class="meta-info">
      ${escapeHtml(reportType)} • ${reportYear} • Generated ${new Date().toLocaleDateString()}
    </div>
    <div class="confidence-badge">
      Confidence Level: ${escapeHtml(data.scores.confidence_level || 'N/A')}
    </div>
  </div>

  <!-- Scores Overview -->
  <div class="scores-grid">
    <div class="score-card overall">
      <div class="score-label">Overall Score</div>
      <div class="score-value" style="color: ${getScoreColor(data.scores.overall)}">${data.scores.overall}</div>
      <div class="score-rating">${getScoreRating(data.scores.overall)}</div>
    </div>
    <div class="score-card">
      <div class="score-label">Environmental</div>
      <div class="score-value" style="color: ${getScoreColor(data.scores.environmental)}">${data.scores.environmental}</div>
    </div>
    <div class="score-card">
      <div class="score-label">Social</div>
      <div class="score-value" style="color: ${getScoreColor(data.scores.social)}">${data.scores.social}</div>
    </div>
    <div class="score-card">
      <div class="score-label">Governance</div>
      <div class="score-value" style="color: ${getScoreColor(data.scores.governance)}">${data.scores.governance}</div>
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <div class="section-title">📋 Executive Summary</div>
    <div class="executive-summary">${escapeHtml(data.executive_summary)}</div>
  </div>

  <!-- Key Metrics -->
  ${data.key_metrics ? `
  <div class="section">
    <div class="section-title">📊 Key Metrics</div>
    
    <div class="category-section">
      <div class="category-title env-color">🌍 Environmental Metrics</div>
      <table class="metrics-table">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Carbon Emissions</td><td>${escapeHtml(data.key_metrics.environmental?.carbon_emissions || 'Not disclosed')}</td></tr>
        <tr><td>Renewable Energy</td><td>${escapeHtml(data.key_metrics.environmental?.renewable_energy || 'Not disclosed')}</td></tr>
        <tr><td>Water Usage</td><td>${escapeHtml(data.key_metrics.environmental?.water_usage || 'Not disclosed')}</td></tr>
        <tr><td>Waste Recycled</td><td>${escapeHtml(data.key_metrics.environmental?.waste_recycled || 'Not disclosed')}</td></tr>
      </table>
    </div>

    <div class="category-section">
      <div class="category-title social-color">👥 Social Metrics</div>
      <table class="metrics-table">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Workforce Size</td><td>${escapeHtml(data.key_metrics.social?.workforce_size || 'Not disclosed')}</td></tr>
        <tr><td>Female Leadership</td><td>${escapeHtml(data.key_metrics.social?.female_leadership || 'Not disclosed')}</td></tr>
        <tr><td>Safety Incidents</td><td>${escapeHtml(data.key_metrics.social?.safety_incidents || 'Not disclosed')}</td></tr>
        <tr><td>Training Hours</td><td>${escapeHtml(data.key_metrics.social?.training_hours || 'Not disclosed')}</td></tr>
      </table>
    </div>

    <div class="category-section">
      <div class="category-title gov-color">🏛️ Governance Metrics</div>
      <table class="metrics-table">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Board Independence</td><td>${escapeHtml(data.key_metrics.governance?.board_independence || 'Not disclosed')}</td></tr>
        <tr><td>Board Diversity</td><td>${escapeHtml(data.key_metrics.governance?.board_diversity || 'Not disclosed')}</td></tr>
        <tr><td>Ethics Training</td><td>${escapeHtml(data.key_metrics.governance?.ethics_training || 'Not disclosed')}</td></tr>
        <tr><td>Whistleblower Cases</td><td>${escapeHtml(data.key_metrics.governance?.whistleblower_cases || 'Not disclosed')}</td></tr>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- Evidence with Citations -->
  <div class="section">
    <div class="section-title">📄 Extracted Evidence with Page Citations</div>
    
    ${environmentalEvidence.length > 0 ? `
    <div class="category-section">
      <div class="category-title env-color">🌍 Environmental Evidence (${environmentalEvidence.length} items)</div>
      ${environmentalEvidence.map(e => `
        <div class="evidence-item">
          <div class="evidence-header">
            <div>
              <div class="evidence-metric">${escapeHtml(e.metric)}</div>
              <div class="evidence-value">${escapeHtml(e.value)}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-page">Page ${e.page}</span>
              <span class="badge badge-impact-${e.impact}">${e.impact}</span>
              ${e.year ? `<span class="badge badge-category">${e.year}</span>` : ''}
            </div>
          </div>
          <div class="evidence-snippet">"${escapeHtml(e.snippet)}"</div>
          ${e.trend ? `<div style="margin-top: 8px; font-size: 13px; color: #6b7280;">Trend: ${escapeHtml(e.trend)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${socialEvidence.length > 0 ? `
    <div class="category-section">
      <div class="category-title social-color">👥 Social Evidence (${socialEvidence.length} items)</div>
      ${socialEvidence.map(e => `
        <div class="evidence-item">
          <div class="evidence-header">
            <div>
              <div class="evidence-metric">${escapeHtml(e.metric)}</div>
              <div class="evidence-value">${escapeHtml(e.value)}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-page">Page ${e.page}</span>
              <span class="badge badge-impact-${e.impact}">${e.impact}</span>
              ${e.year ? `<span class="badge badge-category">${e.year}</span>` : ''}
            </div>
          </div>
          <div class="evidence-snippet">"${escapeHtml(e.snippet)}"</div>
          ${e.trend ? `<div style="margin-top: 8px; font-size: 13px; color: #6b7280;">Trend: ${escapeHtml(e.trend)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${governanceEvidence.length > 0 ? `
    <div class="category-section">
      <div class="category-title gov-color">🏛️ Governance Evidence (${governanceEvidence.length} items)</div>
      ${governanceEvidence.map(e => `
        <div class="evidence-item">
          <div class="evidence-header">
            <div>
              <div class="evidence-metric">${escapeHtml(e.metric)}</div>
              <div class="evidence-value">${escapeHtml(e.value)}</div>
            </div>
            <div style="text-align: right;">
              <span class="badge badge-page">Page ${e.page}</span>
              <span class="badge badge-impact-${e.impact}">${e.impact}</span>
              ${e.year ? `<span class="badge badge-category">${e.year}</span>` : ''}
            </div>
          </div>
          <div class="evidence-snippet">"${escapeHtml(e.snippet)}"</div>
          ${e.trend ? `<div style="margin-top: 8px; font-size: 13px; color: #6b7280;">Trend: ${escapeHtml(e.trend)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>

  <!-- Risks -->
  ${data.risks.length > 0 ? `
  <div class="section">
    <div class="section-title">⚠️ Identified Risks (${data.risks.length})</div>
    ${data.risks.map(r => `
      <div class="risk-card risk-${r.severity}">
        <div class="risk-header">
          <span class="risk-title">${escapeHtml(r.title)}</span>
          <div>
            <span class="badge" style="background: ${getSeverityColor(r.severity)}20; color: ${getSeverityColor(r.severity)}">${r.severity.toUpperCase()}</span>
            <span class="badge badge-page">Page ${r.page}</span>
          </div>
        </div>
        <div class="risk-description">${escapeHtml(r.description)}</div>
        ${r.evidence ? `<div class="risk-evidence">"${escapeHtml(r.evidence)}"</div>` : ''}
        ${r.mitigation ? `<div class="mitigation"><strong>Mitigation:</strong> ${escapeHtml(r.mitigation)}</div>` : ''}
        <div style="margin-top: 8px;">
          <span class="badge badge-category">${escapeHtml(r.category)}</span>
          <span class="badge" style="background: ${r.is_disclosed ? '#dcfce7' : '#fef3c7'}; color: ${r.is_disclosed ? '#166534' : '#92400e'}">
            ${r.is_disclosed ? 'Company Disclosed' : 'Identified by Analysis'}
          </span>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Targets and Commitments -->
  ${data.targets_and_commitments && data.targets_and_commitments.length > 0 ? `
  <div class="section">
    <div class="section-title">🎯 Targets & Commitments (${data.targets_and_commitments.length})</div>
    ${data.targets_and_commitments.map(t => `
      <div class="target-item">
        <div class="target-text">${escapeHtml(t.target)}</div>
        <div class="target-meta">
          <span>Timeline: ${escapeHtml(t.timeline)}</span>
          ${t.baseline ? `<span>Baseline: ${escapeHtml(t.baseline)}</span>` : ''}
          ${t.status ? `<span>Status: ${escapeHtml(t.status)}</span>` : ''}
          <span>Page ${t.page}</span>
        </div>
        <span class="badge badge-category" style="margin-top: 8px;">${escapeHtml(t.category)}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Opportunities -->
  ${data.opportunities.length > 0 ? `
  <div class="section">
    <div class="section-title">💡 Opportunities (${data.opportunities.length})</div>
    ${data.opportunities.map(o => `
      <div class="opportunity-item">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 600; color: #1f2937;">${escapeHtml(o.title)}</div>
            <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">${escapeHtml(o.description)}</div>
          </div>
          <span class="badge" style="background: #dcfce7; color: #166534;">${o.priority} priority</span>
        </div>
        <span class="badge badge-category" style="margin-top: 8px;">${escapeHtml(o.category)}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Missing Disclosures -->
  ${data.missing_disclosures && data.missing_disclosures.length > 0 ? `
  <div class="section">
    <div class="section-title">❌ Missing Disclosures (${data.missing_disclosures.length})</div>
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706;">
      ${data.missing_disclosures.map(m => `
        <div class="missing-item">⚠️ ${escapeHtml(m)}</div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Source Document:</strong> ${escapeHtml(data.fileName)}</p>
    <p>This report was generated by PrakritiLens ESG Assessment Platform</p>
    <p>All data extracted directly from the source document with page citations provided.</p>
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  return htmlContent;
};

export const downloadRealESGPDF = (data: RealESGReportData) => {
  const htmlContent = generateRealESGPDF(data);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const companyName = data.metadata?.company_name || 'Company';
  const date = new Date().toISOString().split('T')[0];
  link.download = `ESG_Report_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadRealESGCSV = (data: RealESGReportData) => {
  const companyName = data.metadata?.company_name || 'Company';
  
  const rows: string[][] = [
    ['ESG Analysis Report'],
    ['Company', companyName],
    ['Report Year', String(data.metadata?.report_year || '')],
    ['Report Type', data.metadata?.report_type || ''],
    ['Generated', new Date().toLocaleString()],
    [],
    ['SCORES'],
    ['Overall Score', String(data.scores.overall)],
    ['Environmental Score', String(data.scores.environmental)],
    ['Social Score', String(data.scores.social)],
    ['Governance Score', String(data.scores.governance)],
    ['Confidence Level', data.scores.confidence_level],
    [],
    ['EXECUTIVE SUMMARY'],
    [data.executive_summary],
    [],
    ['KEY METRICS - ENVIRONMENTAL'],
    ['Carbon Emissions', data.key_metrics?.environmental?.carbon_emissions || 'Not disclosed'],
    ['Renewable Energy', data.key_metrics?.environmental?.renewable_energy || 'Not disclosed'],
    ['Water Usage', data.key_metrics?.environmental?.water_usage || 'Not disclosed'],
    ['Waste Recycled', data.key_metrics?.environmental?.waste_recycled || 'Not disclosed'],
    [],
    ['KEY METRICS - SOCIAL'],
    ['Workforce Size', data.key_metrics?.social?.workforce_size || 'Not disclosed'],
    ['Female Leadership', data.key_metrics?.social?.female_leadership || 'Not disclosed'],
    ['Safety Incidents', data.key_metrics?.social?.safety_incidents || 'Not disclosed'],
    ['Training Hours', data.key_metrics?.social?.training_hours || 'Not disclosed'],
    [],
    ['KEY METRICS - GOVERNANCE'],
    ['Board Independence', data.key_metrics?.governance?.board_independence || 'Not disclosed'],
    ['Board Diversity', data.key_metrics?.governance?.board_diversity || 'Not disclosed'],
    ['Ethics Training', data.key_metrics?.governance?.ethics_training || 'Not disclosed'],
    ['Whistleblower Cases', data.key_metrics?.governance?.whistleblower_cases || 'Not disclosed'],
    [],
    ['EXTRACTED EVIDENCE'],
    ['Category', 'Metric', 'Value', 'Page', 'Confidence', 'Impact', 'Snippet'],
    ...data.evidence.map(e => [e.category, e.metric, e.value, String(e.page), `${e.confidence}%`, e.impact, e.snippet]),
    [],
    ['RISKS'],
    ['Title', 'Severity', 'Category', 'Page', 'Description', 'Mitigation'],
    ...data.risks.map(r => [r.title, r.severity, r.category, String(r.page), r.description, r.mitigation || '']),
    [],
    ['TARGETS & COMMITMENTS'],
    ['Target', 'Category', 'Timeline', 'Page', 'Status'],
    ...(data.targets_and_commitments || []).map(t => [t.target, t.category, t.timeline, String(t.page), t.status || '']),
    [],
    ['OPPORTUNITIES'],
    ['Title', 'Category', 'Priority', 'Description'],
    ...data.opportunities.map(o => [o.title, o.category, o.priority, o.description]),
    [],
    ['MISSING DISCLOSURES'],
    ...(data.missing_disclosures || []).map(m => [m]),
  ];

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = `ESG_Report_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
