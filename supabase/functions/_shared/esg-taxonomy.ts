// ESG taxonomy shared by validation, extraction and scoring.
// Pure data + small helpers. No I/O.

export type Pillar = 'environmental' | 'social' | 'governance';
export type MetricStatus = 'REPORTED' | 'CALCULATED' | 'ESTIMATED' | 'INFERRED';

export interface IndicatorDef {
  key: string;
  pillar: Pillar;
  name: string;
  /** Typical units; used as extraction hints */
  units: string[];
  /** Relative importance inside its pillar (1-3) */
  weight: number;
  /** true when the indicator is a yes/no disclosure (policy, oversight, assurance) */
  boolean?: boolean;
  /** Maps a numeric value to a 0-100 performance rating. Return null when the raw value is not scoreable on its own. */
  rate?: (value: number) => number | null;
  /** Frameworks whose core disclosures include this indicator */
  frameworks: string[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
/** Linear rating: value at `bad` -> 0, at `good` -> 100 (works for inverted ranges) */
const linear = (bad: number, good: number) => (v: number) => clamp(((v - bad) / (good - bad)) * 100);

export const INDICATORS: IndicatorDef[] = [
  // ---------------- Environmental ----------------
  { key: 'scope1_emissions', pillar: 'environmental', name: 'Scope 1 GHG emissions', units: ['tCO2e', 'ktCO2e', 'MtCO2e'], weight: 3, frameworks: ['GRI', 'SASB', 'TCFD', 'CDP', 'CSRD', 'ISSB'] },
  { key: 'scope2_emissions', pillar: 'environmental', name: 'Scope 2 GHG emissions', units: ['tCO2e', 'ktCO2e', 'MtCO2e'], weight: 3, frameworks: ['GRI', 'SASB', 'TCFD', 'CDP', 'CSRD', 'ISSB'] },
  { key: 'scope3_emissions', pillar: 'environmental', name: 'Scope 3 GHG emissions', units: ['tCO2e', 'ktCO2e', 'MtCO2e'], weight: 2, frameworks: ['GRI', 'TCFD', 'CDP', 'CSRD', 'ISSB'] },
  { key: 'total_ghg_emissions', pillar: 'environmental', name: 'Total GHG emissions', units: ['tCO2e', 'ktCO2e', 'MtCO2e'], weight: 2, frameworks: ['GRI', 'TCFD', 'CDP', 'CSRD'] },
  { key: 'emissions_reduction_pct', pillar: 'environmental', name: 'GHG emissions reduction vs baseline', units: ['%'], weight: 3, rate: linear(0, 50), frameworks: ['TCFD', 'CDP', 'CSRD'] },
  { key: 'emissions_intensity', pillar: 'environmental', name: 'GHG emissions intensity', units: ['tCO2e/revenue', 'tCO2e/unit'], weight: 1, frameworks: ['GRI', 'SASB', 'TCFD'] },
  { key: 'renewable_energy_pct', pillar: 'environmental', name: 'Renewable electricity/energy share', units: ['%'], weight: 3, rate: linear(0, 100), frameworks: ['GRI', 'CDP', 'CSRD', 'RE100'] },
  { key: 'total_energy_consumption', pillar: 'environmental', name: 'Total energy consumption', units: ['MWh', 'GWh', 'GJ', 'TJ'], weight: 2, frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'energy_reduction_pct', pillar: 'environmental', name: 'Energy consumption reduction', units: ['%'], weight: 1, rate: linear(0, 30), frameworks: ['GRI', 'CSRD'] },
  { key: 'water_withdrawal', pillar: 'environmental', name: 'Water withdrawal / consumption', units: ['m3', 'megalitres', 'ML', 'kL'], weight: 2, frameworks: ['GRI', 'SASB', 'CDP', 'CSRD'] },
  { key: 'water_recycled_pct', pillar: 'environmental', name: 'Water recycled or reused', units: ['%'], weight: 1, rate: linear(0, 60), frameworks: ['GRI', 'CDP'] },
  { key: 'total_waste', pillar: 'environmental', name: 'Total waste generated', units: ['tonnes', 't', 'kt'], weight: 2, frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'waste_diverted_pct', pillar: 'environmental', name: 'Waste diverted from landfill / recycled', units: ['%'], weight: 2, rate: linear(20, 95), frameworks: ['GRI', 'CSRD'] },
  { key: 'hazardous_waste', pillar: 'environmental', name: 'Hazardous waste', units: ['tonnes', 't'], weight: 1, frameworks: ['GRI', 'SASB'] },
  { key: 'net_zero_target_year', pillar: 'environmental', name: 'Net zero / carbon neutral target year', units: ['year'], weight: 3, rate: (y) => (y <= 2030 ? 100 : y <= 2040 ? 80 : y <= 2050 ? 60 : 30), frameworks: ['TCFD', 'CDP', 'CSRD', 'SBTi'] },
  { key: 'sbti_validated', pillar: 'environmental', name: 'Science-based targets validated (SBTi)', units: ['yes/no'], weight: 2, boolean: true, frameworks: ['SBTi', 'CDP', 'TCFD'] },
  { key: 'climate_risk_assessment', pillar: 'environmental', name: 'Climate risk / scenario analysis disclosed', units: ['yes/no'], weight: 2, boolean: true, frameworks: ['TCFD', 'ISSB', 'CSRD'] },
  { key: 'biodiversity_program', pillar: 'environmental', name: 'Biodiversity / nature program', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI', 'CSRD', 'TNFD'] },
  { key: 'environmental_fines', pillar: 'environmental', name: 'Environmental fines or violations', units: ['count', 'currency'], weight: 1, rate: (v) => (v === 0 ? 100 : v <= 2 ? 50 : 10), frameworks: ['GRI', 'SASB'] },
  { key: 'environmental_management_system', pillar: 'environmental', name: 'ISO 14001 / EMS certification', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI', 'ISO 14001'] },

  // ---------------- Social ----------------
  { key: 'total_employees', pillar: 'social', name: 'Total employees / headcount', units: ['employees', 'FTE'], weight: 2, frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'women_workforce_pct', pillar: 'social', name: 'Women in total workforce', units: ['%'], weight: 2, rate: (v) => clamp(100 - Math.abs(50 - v) * 2.5), frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'women_management_pct', pillar: 'social', name: 'Women in management / leadership', units: ['%'], weight: 2, rate: (v) => clamp(100 - Math.abs(50 - v) * 2.5), frameworks: ['GRI', 'CSRD'] },
  { key: 'ltifr', pillar: 'social', name: 'Lost-time injury frequency rate (LTIFR/LTIR)', units: ['per million hours', 'per 200,000 hours'], weight: 3, rate: (v) => (v === 0 ? 100 : v < 0.5 ? 90 : v < 1 ? 75 : v < 2 ? 55 : v < 5 ? 30 : 10), frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'trir', pillar: 'social', name: 'Total recordable incident rate (TRIR)', units: ['per 200,000 hours'], weight: 2, rate: (v) => (v === 0 ? 100 : v < 0.5 ? 90 : v < 1 ? 75 : v < 2 ? 55 : v < 5 ? 30 : 10), frameworks: ['GRI', 'SASB'] },
  { key: 'fatalities', pillar: 'social', name: 'Work-related fatalities', units: ['count'], weight: 3, rate: (v) => (v === 0 ? 100 : v === 1 ? 30 : 0), frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'training_hours_per_employee', pillar: 'social', name: 'Average training hours per employee', units: ['hours'], weight: 2, rate: linear(0, 40), frameworks: ['GRI', 'CSRD'] },
  { key: 'employee_turnover_pct', pillar: 'social', name: 'Employee turnover / attrition rate', units: ['%'], weight: 2, rate: linear(35, 5), frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'employee_engagement_score', pillar: 'social', name: 'Employee engagement score', units: ['%', 'index'], weight: 1, rate: linear(40, 90), frameworks: ['GRI'] },
  { key: 'gender_pay_gap_pct', pillar: 'social', name: 'Gender pay gap', units: ['%'], weight: 2, rate: linear(30, 0), frameworks: ['GRI', 'CSRD'] },
  { key: 'community_investment', pillar: 'social', name: 'Community investment / philanthropy', units: ['currency'], weight: 1, frameworks: ['GRI'] },
  { key: 'human_rights_policy', pillar: 'social', name: 'Human rights policy / due diligence', units: ['yes/no'], weight: 2, boolean: true, frameworks: ['GRI', 'UNGC', 'CSRD'] },
  { key: 'supplier_esg_assessment', pillar: 'social', name: 'Supplier ESG / code of conduct assessment', units: ['yes/no', 'count', '%'], weight: 2, boolean: true, frameworks: ['GRI', 'SASB', 'CSRD'] },
  { key: 'dei_program', pillar: 'social', name: 'Diversity, equity & inclusion program', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI', 'CSRD'] },
  { key: 'health_safety_management_system', pillar: 'social', name: 'Health & safety management system (e.g. ISO 45001)', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI', 'ISO 45001'] },
  { key: 'living_wage_commitment', pillar: 'social', name: 'Living wage / fair pay commitment', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI', 'CSRD'] },
  { key: 'customer_data_incidents', pillar: 'social', name: 'Data privacy / security incidents', units: ['count'], weight: 1, rate: (v) => (v === 0 ? 100 : v <= 2 ? 50 : 10), frameworks: ['SASB'] },

  // ---------------- Governance ----------------
  { key: 'board_size', pillar: 'governance', name: 'Board size', units: ['directors'], weight: 1, frameworks: ['GRI', 'CSRD'] },
  { key: 'independent_directors_pct', pillar: 'governance', name: 'Independent directors', units: ['%'], weight: 3, rate: linear(20, 80), frameworks: ['GRI', 'SASB', 'CSRD', 'ISSB'] },
  { key: 'women_board_pct', pillar: 'governance', name: 'Women on the board', units: ['%'], weight: 3, rate: linear(0, 45), frameworks: ['GRI', 'CSRD'] },
  { key: 'ceo_chair_separation', pillar: 'governance', name: 'Separate CEO and board chair', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI'] },
  { key: 'board_esg_oversight', pillar: 'governance', name: 'Board-level ESG / sustainability oversight', units: ['yes/no'], weight: 3, boolean: true, frameworks: ['GRI', 'TCFD', 'ISSB', 'CSRD'] },
  { key: 'esg_linked_compensation', pillar: 'governance', name: 'ESG metrics linked to executive pay', units: ['yes/no'], weight: 2, boolean: true, frameworks: ['TCFD', 'CSRD', 'ISSB'] },
  { key: 'anti_corruption_policy', pillar: 'governance', name: 'Anti-bribery & corruption policy', units: ['yes/no'], weight: 3, boolean: true, frameworks: ['GRI', 'UNGC', 'CSRD'] },
  { key: 'whistleblower_mechanism', pillar: 'governance', name: 'Whistleblower / grievance mechanism', units: ['yes/no'], weight: 2, boolean: true, frameworks: ['GRI', 'CSRD'] },
  { key: 'ethics_training_pct', pillar: 'governance', name: 'Employees trained on code of conduct / ethics', units: ['%'], weight: 2, rate: linear(50, 100), frameworks: ['GRI', 'CSRD'] },
  { key: 'corruption_incidents', pillar: 'governance', name: 'Confirmed corruption / ethics incidents', units: ['count'], weight: 1, rate: (v) => (v === 0 ? 100 : v <= 3 ? 50 : 10), frameworks: ['GRI', 'SASB'] },
  { key: 'external_assurance', pillar: 'governance', name: 'External assurance of ESG data', units: ['yes/no'], weight: 3, boolean: true, frameworks: ['GRI', 'CSRD', 'ISSB'] },
  { key: 'materiality_assessment', pillar: 'governance', name: 'Materiality assessment conducted', units: ['yes/no'], weight: 2, boolean: true, frameworks: ['GRI', 'CSRD', 'SASB'] },
  { key: 'data_privacy_policy', pillar: 'governance', name: 'Data privacy & cybersecurity governance', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['SASB', 'CSRD'] },
  { key: 'tax_transparency', pillar: 'governance', name: 'Tax transparency / country-by-country reporting', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI'] },
  { key: 'political_contributions', pillar: 'governance', name: 'Political contributions disclosed', units: ['currency', 'yes/no'], weight: 1, boolean: true, frameworks: ['GRI'] },
  { key: 'stakeholder_engagement', pillar: 'governance', name: 'Structured stakeholder engagement', units: ['yes/no'], weight: 1, boolean: true, frameworks: ['GRI', 'CSRD'] },
];

export const INDICATOR_MAP: Record<string, IndicatorDef> = Object.fromEntries(INDICATORS.map((i) => [i.key, i]));
export const indicatorsFor = (pillar: Pillar) => INDICATORS.filter((i) => i.pillar === pillar);

export const FRAMEWORKS: { key: string; name: string; patterns: RegExp[] }[] = [
  { key: 'GRI', name: 'GRI Standards', patterns: [/\bGRI\b/, /Global Reporting Initiative/i] },
  { key: 'SASB', name: 'SASB Standards', patterns: [/\bSASB\b/, /Sustainability Accounting Standards Board/i] },
  { key: 'TCFD', name: 'TCFD', patterns: [/\bTCFD\b/, /Task\s?Force on Climate[- ]related Financial Disclosures/i] },
  { key: 'CDP', name: 'CDP', patterns: [/\bCDP\b/, /Carbon Disclosure Project/i] },
  { key: 'CSRD', name: 'CSRD / ESRS', patterns: [/\bCSRD\b/, /\bESRS\b/, /Corporate Sustainability Reporting Directive/i] },
  { key: 'ISSB', name: 'ISSB / IFRS S1-S2', patterns: [/\bISSB\b/, /IFRS S[12]\b/] },
  { key: 'SDG', name: 'UN SDGs', patterns: [/\bSDGs?\b/, /Sustainable Development Goals/i] },
  { key: 'UNGC', name: 'UN Global Compact', patterns: [/UN Global Compact/i, /\bUNGC\b/] },
  { key: 'SBTi', name: 'Science Based Targets initiative', patterns: [/\bSBTi\b/, /Science[- ]Based Targets?/i] },
  { key: 'GHG Protocol', name: 'GHG Protocol', patterns: [/GHG Protocol/i, /Greenhouse Gas Protocol/i] },
  { key: 'ISO 14001', name: 'ISO 14001', patterns: [/ISO\s?14001/] },
  { key: 'ISO 45001', name: 'ISO 45001', patterns: [/ISO\s?45001/] },
  { key: 'RE100', name: 'RE100', patterns: [/\bRE100\b/] },
  { key: 'TNFD', name: 'TNFD', patterns: [/\bTNFD\b/] },
  { key: 'BRSR', name: 'BRSR (SEBI)', patterns: [/\bBRSR\b/, /Business Responsibility and Sustainability Report/i] },
  { key: 'IIRC', name: 'Integrated Reporting <IR>', patterns: [/\bIIRC\b/, /Integrated Reporting Framework/i, /<IR>/] },
];

/** Term families. A family counts once per page regardless of repetitions, which resists keyword stuffing. */
export const TERM_FAMILIES: { family: string; pillar: Pillar | 'general'; pattern: RegExp }[] = [
  { family: 'ghg_emissions', pillar: 'environmental', pattern: /\b(greenhouse gas|ghg|carbon (footprint|emissions?|neutral)|co2e?|scope [123]|decarboni[sz]ation|net[- ]zero)\b/i },
  { family: 'climate', pillar: 'environmental', pattern: /\b(climate (change|risk|action|strategy|related)|global warming|1\.5\s?°?c|paris agreement|transition risk|physical risk)\b/i },
  { family: 'energy', pillar: 'environmental', pattern: /\b(renewable (energy|electricity|power)|energy (consumption|efficiency|intensity|use)|solar|wind power|mwh|gwh|gigajoule)\b/i },
  { family: 'water', pillar: 'environmental', pattern: /\b(water (withdrawal|consumption|stress|stewardship|usage|use|recycl)|wastewater|megalit)/i },
  { family: 'waste', pillar: 'environmental', pattern: /\b(waste (generated|diverted|management|reduction)|landfill|recycl(ed|ing) (rate|material)|circular economy|hazardous waste)\b/i },
  { family: 'biodiversity', pillar: 'environmental', pattern: /\b(biodiversity|deforestation|ecosystem|nature[- ]positive|land use|habitat)\b/i },
  { family: 'environmental_general', pillar: 'environmental', pattern: /\b(environmental (impact|performance|management|footprint|stewardship)|sustainab(le|ility))\b/i },
  { family: 'workforce', pillar: 'social', pattern: /\b(employees?|workforce|headcount|full[- ]time equivalent|talent|human capital)\b/i },
  { family: 'diversity', pillar: 'social', pattern: /\b(diversity|inclusion|equity|women in|gender (balance|pay gap|diversity)|underrepresented|dei)\b/i },
  { family: 'health_safety', pillar: 'social', pattern: /\b(health (and|&) safety|occupational (health|safety)|lost[- ]time injur|ltifr|trir|recordable (injur|incident)|fatalit)/i },
  { family: 'human_rights', pillar: 'social', pattern: /\b(human rights|modern slavery|forced labou?r|child labou?r|living wage|freedom of association)\b/i },
  { family: 'community', pillar: 'social', pattern: /\b(community (investment|engagement|development)|philanthrop|volunteer|social impact|local communities)\b/i },
  { family: 'training', pillar: 'social', pattern: /\b(training hours|learning and development|upskilling|employee (engagement|development|wellbeing|well-being))\b/i },
  { family: 'supply_chain', pillar: 'social', pattern: /\b(supplier (code|audit|assessment|diversity|engagement)|responsible sourcing|supply chain (due diligence|sustainability|risk))\b/i },
  { family: 'board', pillar: 'governance', pattern: /\b(board of directors|independent directors?|board (composition|diversity|oversight|committee)|audit committee|nomination committee|remuneration committee)\b/i },
  { family: 'ethics', pillar: 'governance', pattern: /\b(code of (conduct|ethics)|anti[- ]?(bribery|corruption)|business ethics|whistleblow|grievance mechanism|conflicts? of interest)\b/i },
  { family: 'governance_general', pillar: 'governance', pattern: /\b(corporate governance|esg governance|sustainability governance|risk management framework|internal controls?)\b/i },
  { family: 'compensation', pillar: 'governance', pattern: /\b(executive (compensation|remuneration|pay)|esg[- ]linked|incentive plan|say on pay)\b/i },
  { family: 'transparency', pillar: 'governance', pattern: /\b(materiality (assessment|matrix)|stakeholder engagement|external(ly)? assur|limited assurance|reasonable assurance|reporting boundary)\b/i },
  { family: 'data_privacy', pillar: 'governance', pattern: /\b(data (privacy|protection|security)|cybersecurity|gdpr|information security)\b/i },
  { family: 'esg_general', pillar: 'general', pattern: /\b(esg|environmental,? social,? (and|&) governance|corporate (social )?responsibility|csr|sustainability report|responsible business)\b/i },
];

/** Numeric disclosures with units: strong evidence of quantitative ESG reporting */
export const METRIC_PATTERNS: RegExp[] = [
  /\d[\d,.]*\s?(k|m|kt|mt)?\s?t?co2[- ]?e(q)?\b/i,
  /\d[\d,.]*\s?(metric )?tons?(nes)? (of )?(co2|carbon|waste|ghg)/i,
  /\d[\d,.]*\s?(mwh|gwh|twh|gj|tj|kwh)\b/i,
  /\d[\d,.]*\s?(m3|m³|cubic met(er|re)s|megalit(er|re)s|ml|kl|gallons) (of )?water/i,
  /\d[\d,.]*\s?%\s?(renewable|women|female|diversity|reduction|recycled|diverted|independent|of (our )?(employees|suppliers|board))/i,
  /\b(ltifr|trir|ltir|lost[- ]time injury (frequency )?rate)\b[^.\n]{0,40}\d/i,
  /\d[\d,.]*\s?(employees|full[- ]time employees|fte)\b/i,
  /\d[\d,.]*\s?(training )?hours (per|of training)/i,
  /\b(scope [123])\b[^.\n]{0,60}\d[\d,.]+/i,
];

export const SECTION_HEADING_PATTERNS: RegExp[] = [
  /^(our )?(approach to )?(environment(al)?( stewardship| performance| impact)?|climate( change| action| strategy)?|energy( and emissions)?|emissions|water( stewardship)?|waste( and circularity)?|biodiversity)\b/i,
  /^(our )?(people|employees|workforce|human capital|diversity(, equity)?(,)? (and|&) inclusion|health(,)? (and|&) safety|human rights|communit(y|ies)|social( impact| responsibility)?|supply chain|responsible sourcing)\b/i,
  /^(corporate )?governance\b|^board (of directors|composition|oversight)\b|^(business )?ethics( and compliance)?\b|^risk management\b|^materiality( assessment)?\b|^stakeholder engagement\b/i,
  /^(about this report|reporting (approach|boundary|framework)|gri (content )?index|sasb index|tcfd (index|report)|assurance (statement|report)|independent (limited )?assurance)\b/i,
  /^(letter|message) from (the|our) (ceo|chair|chairman|president)|^ceo (letter|message|statement)\b/i,
  /^(sustainability|esg) (strategy|highlights|goals|targets|performance|governance|data|metrics|at a glance)\b/i,
];

export const TITLE_SIGNALS: { pattern: RegExp; type: string; weight: number }[] = [
  { pattern: /\b(sustainability|environmental|esg|corporate responsibility|corporate social responsibility|csr|impact|citizenship|responsible business|non[- ]financial|climate|tcfd)\s+(report|review|disclosure|statement|update)\b/i, type: 'Sustainability Report', weight: 25 },
  { pattern: /\bintegrated (annual )?report\b/i, type: 'Integrated Report', weight: 25 },
  { pattern: /\b(annual report|form 10-k|annual review|annual report and accounts|universal registration document)\b/i, type: 'Annual Report', weight: 15 },
  { pattern: /\b(esg|sustainability) (data ?book|databook|fact ?book|supplement|appendix)\b/i, type: 'ESG Data Supplement', weight: 20 },
  { pattern: /\bbusiness responsibility (and sustainability )?report\b/i, type: 'BRSR Report', weight: 25 },
];

/** Negative signals: strong indications the file is NOT a corporate report */
export const NEGATIVE_SIGNALS: { key: string; pattern: RegExp; weight: number }[] = [
  { key: 'academic_paper', pattern: /\b(abstract|keywords:|doi:|et al\.|literature review|methodology|this paper|we propose|references\s*\n)\b/i, weight: 12 },
  { key: 'textbook', pattern: /\b(chapter \d+|exercise \d|homework|lecture \d|syllabus|learning objectives|end of chapter)\b/i, weight: 15 },
  { key: 'source_code', pattern: /(\bfunction\s*\(|\bimport\s+\w+\s+from\b|#include\s*<|\bpublic static void\b|console\.log|def \w+\(.*\):)/, weight: 20 },
  { key: 'resume', pattern: /\b(curriculum vitae|resume|work experience|professional summary|skills:|references available)\b/i, weight: 20 },
  { key: 'invoice', pattern: /\b(invoice (no|number|#)|bill to|amount due|payment terms|subtotal|tax invoice)\b/i, weight: 20 },
  { key: 'legal_contract', pattern: /\b(hereinafter|whereas,|in witness whereof|party of the first part|terms and conditions of this agreement)\b/i, weight: 12 },
  { key: 'fiction', pattern: /\b(she whispered|he whispered|once upon a time|chapter one|the end\.)\b/i, weight: 15 },
  { key: 'manual', pattern: /\b(user manual|installation guide|troubleshooting|press the (power )?button|warranty card)\b/i, weight: 15 },
];

export const CORPORATE_SIGNALS = /\b(inc\.?|ltd\.?|limited|plc|corporation|corp\.?|llc|gmbh|s\.a\.|n\.v\.|ag|group|holdings?)\b|\b(fiscal year|fy ?20\d\d|shareholders?|stockholders|our business|our operations|subsidiaries)\b/i;

export const SCORE_BANDS = [
  { min: 80, label: 'Leader' },
  { min: 65, label: 'Strong' },
  { min: 50, label: 'Average' },
  { min: 35, label: 'Weak' },
  { min: 0, label: 'Laggard' },
];
export const bandFor = (score: number) => SCORE_BANDS.find((b) => score >= b.min)?.label ?? 'Laggard';

export const DEFAULT_WEIGHTS = { environmental: 0.4, social: 0.3, governance: 0.3 };

/** Core indicators per framework used for alignment estimates */
export const frameworkIndicators = (framework: string) => INDICATORS.filter((i) => i.frameworks.includes(framework)).map((i) => i.key);
