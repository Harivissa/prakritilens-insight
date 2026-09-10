// Deterministic document classifier. Pure function: no network, no I/O.
// Decides whether page text looks like an ESG / sustainability / annual report.

import {
  CORPORATE_SIGNALS,
  FRAMEWORKS,
  METRIC_PATTERNS,
  NEGATIVE_SIGNALS,
  SECTION_HEADING_PATTERNS,
  TERM_FAMILIES,
  TITLE_SIGNALS,
} from './esg-taxonomy.ts';

export interface PageText {
  page: number;
  text: string;
}

export type Classification = 'VALID' | 'PARTIAL' | 'INVALID';

export interface HeuristicResult {
  classification: Classification;
  score: number; // 0-100
  document_type: string;
  reasons: string[];
  signals: {
    total_pages: number;
    total_chars: number;
    esg_pages: number;
    esg_page_ratio: number;
    distinct_families: number;
    family_hits: Record<string, number>;
    pillar_hits: { environmental: number; social: number; governance: number; general: number };
    frameworks: string[];
    section_headers: string[];
    metric_hits: number;
    title_signal: string | null;
    corporate_signal: boolean;
    negative_signals: string[];
  };
  /** pages ranked by ESG density (page numbers), most relevant first */
  top_esg_pages: number[];
  candidate_company_names: string[];
  candidate_years: number[];
}

const WS = /\s+/g;
export const normalize = (s: string) => s.replace(WS, ' ').trim();

export function classifyDocument(pages: PageText[]): HeuristicResult {
  const cleanPages = pages
    .map((p) => ({ page: p.page, text: (p.text || '').replace(/\u0000/g, '') }))
    .filter((p) => p.text.trim().length > 0);
  const totalChars = cleanPages.reduce((a, p) => a + p.text.length, 0);
  const totalPages = Math.max(pages.length, 1);

  const familyHits: Record<string, number> = {};
  const pillarHits = { environmental: 0, social: 0, governance: 0, general: 0 };
  const pageDensity: { page: number; families: number; metrics: number }[] = [];
  let metricHits = 0;
  const frameworksFound = new Set<string>();
  const headers = new Set<string>();
  const negatives: Record<string, number> = {};

  for (const p of cleanPages) {
    const text = p.text;
    let famOnPage = 0;
    for (const fam of TERM_FAMILIES) {
      if (fam.pattern.test(text)) {
        famOnPage++;
        familyHits[fam.family] = (familyHits[fam.family] || 0) + 1;
        pillarHits[fam.pillar as keyof typeof pillarHits]++;
      }
    }
    let metricsOnPage = 0;
    for (const mp of METRIC_PATTERNS) {
      const m = text.match(new RegExp(mp.source, mp.flags.includes('g') ? mp.flags : mp.flags + 'g'));
      if (m) metricsOnPage += m.length;
    }
    metricHits += metricsOnPage;
    for (const fw of FRAMEWORKS) if (fw.patterns.some((re) => re.test(text))) frameworksFound.add(fw.key);

    // headings: short standalone lines
    for (const rawLine of text.split(/\n+/)) {
      const line = rawLine.trim();
      if (line.length < 3 || line.length > 70) continue;
      if (SECTION_HEADING_PATTERNS.some((re) => re.test(line))) headers.add(line.replace(/\s+/g, ' '));
      if (headers.size > 40) break;
    }
    for (const neg of NEGATIVE_SIGNALS) if (neg.pattern.test(text)) negatives[neg.key] = (negatives[neg.key] || 0) + 1;

    pageDensity.push({ page: p.page, families: famOnPage, metrics: metricsOnPage });
  }

  const esgPages = pageDensity.filter((d) => d.families >= 3 || (d.families >= 1 && d.metrics >= 1)).length;
  const esgPageRatio = esgPages / Math.max(cleanPages.length, 1);
  const distinctFamilies = Object.keys(familyHits).length;

  // Title signals from the first 3 pages (cover + TOC)
  const front = cleanPages.slice(0, 3).map((p) => p.text).join('\n');
  let titleSignal: { type: string; weight: number } | null = null;
  for (const ts of TITLE_SIGNALS) {
    if (ts.pattern.test(front) && (!titleSignal || ts.weight > titleSignal.weight)) titleSignal = { type: ts.type, weight: ts.weight };
  }
  // A title match deeper in the document (e.g. running header) still counts, at half weight
  if (!titleSignal) {
    const body = cleanPages.slice(3, 12).map((p) => p.text).join('\n');
    for (const ts of TITLE_SIGNALS) if (ts.pattern.test(body)) { titleSignal = { type: ts.type, weight: Math.round(ts.weight / 2) }; break; }
  }

  const corporate = CORPORATE_SIGNALS.test(front) || CORPORATE_SIGNALS.test(cleanPages.slice(0, 10).map((p) => p.text).join(' '));

  // Negative signals: only count families that occur on a meaningful share of pages
  const negativeKeys = Object.entries(negatives)
    .filter(([, count]) => count >= Math.max(2, Math.ceil(cleanPages.length * 0.15)))
    .map(([k]) => k);

  // ---------------- Scoring ----------------
  const reasons: string[] = [];
  let score = 0;
  if (titleSignal) { score += titleSignal.weight; reasons.push(`Title/cover identifies a ${titleSignal.type.toLowerCase()}`); }
  const fwScore = Math.min(20, frameworksFound.size * 6);
  if (fwScore) { score += fwScore; reasons.push(`References reporting frameworks: ${[...frameworksFound].join(', ')}`); }
  const ratioScore = Math.round(esgPageRatio * 30);
  score += ratioScore;
  reasons.push(`${esgPages} of ${cleanPages.length} pages contain substantive ESG content (${Math.round(esgPageRatio * 100)}%)`);
  const headerScore = Math.min(15, headers.size * 3);
  if (headerScore) { score += headerScore; reasons.push(`${headers.size} ESG section headings detected`); }
  const metricScore = Math.min(15, Math.floor(metricHits / 2));
  if (metricScore) { score += metricScore; reasons.push(`${metricHits} quantitative ESG disclosures with units detected`); }
  if (corporate) { score += 5; }
  else reasons.push('No corporate identity signals (company name, fiscal year, shareholders) found');

  if (distinctFamilies < 4) { score = Math.min(score, 30); reasons.push(`Only ${distinctFamilies} ESG topic families present; a real report covers many`); }
  // Balanced coverage: an ESG report touches all three pillars
  const pillarsCovered = ['environmental', 'social', 'governance'].filter((k) => pillarHits[k as keyof typeof pillarHits] > 0).length;
  if (pillarsCovered < 2) { score = Math.min(score, 45); reasons.push('Content does not span environmental, social and governance topics'); }

  let negativePenalty = 0;
  for (const key of negativeKeys) negativePenalty += NEGATIVE_SIGNALS.find((n) => n.key === key)?.weight ?? 10;
  negativePenalty = Math.min(40, negativePenalty);
  if (negativePenalty) { score -= negativePenalty; reasons.push(`Non-report content patterns detected: ${negativeKeys.join(', ')}`); }

  if (totalChars < 1500) { score = Math.min(score, 20); reasons.push('Very little readable text was extracted'); }
  score = Math.max(0, Math.min(100, Math.round(score)));

  let classification: Classification = score >= 60 ? 'VALID' : score >= 35 ? 'PARTIAL' : 'INVALID';
  if (esgPageRatio < 0.03 && !titleSignal) classification = 'INVALID';
  if (classification === 'VALID' && esgPageRatio < 0.08 && titleSignal?.type !== 'Annual Report') classification = 'PARTIAL';

  const documentType = titleSignal?.type ?? (classification === 'INVALID' ? 'Unknown' : esgPageRatio > 0.5 ? 'Sustainability Report' : 'Annual Report');

  const topEsgPages = [...pageDensity]
    .sort((a, b) => b.families * 2 + b.metrics - (a.families * 2 + a.metrics))
    .slice(0, 12)
    .map((d) => d.page);

  return {
    classification,
    score,
    document_type: documentType,
    reasons,
    signals: {
      total_pages: totalPages,
      total_chars: totalChars,
      esg_pages: esgPages,
      esg_page_ratio: Number(esgPageRatio.toFixed(3)),
      distinct_families: distinctFamilies,
      family_hits: familyHits,
      pillar_hits: pillarHits,
      frameworks: [...frameworksFound],
      section_headers: [...headers].slice(0, 25),
      metric_hits: metricHits,
      title_signal: titleSignal?.type ?? null,
      corporate_signal: corporate,
      negative_signals: negativeKeys,
    },
    top_esg_pages: topEsgPages,
    candidate_company_names: extractCompanyCandidates(front),
    candidate_years: extractYearCandidates(front),
  };
}

export function extractCompanyCandidates(front: string): string[] {
  const out = new Map<string, number>();
  const re = /\b([A-Z][A-Za-z0-9&'.\-]+(?:\s+[A-Z][A-Za-z0-9&'.\-]+){0,4})\s+(Inc\.?|Incorporated|Ltd\.?|Limited|PLC|plc|Corporation|Corp\.?|LLC|GmbH|S\.A\.|N\.V\.|AG|SE|Group|Holdings?|Company|Co\.)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(front)) !== null) {
    const name = `${m[1]} ${m[2]}`.replace(/\s+/g, ' ').trim();
    if (name.length < 4 || name.length > 60) continue;
    out.set(name, (out.get(name) || 0) + 1);
  }
  return [...out.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n]) => n);
}

export function extractYearCandidates(front: string): number[] {
  const counts = new Map<number, number>();
  const now = new Date().getFullYear();
  const re = /\b(?:FY\s?)?(20[0-4]\d)(?:[\/–-](\d{2,4}))?\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(front)) !== null) {
    const y = parseInt(m[1], 10);
    if (y >= 2005 && y <= now + 1) counts.set(y, (counts.get(y) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([y]) => y);
}

/** Verify that a quoted snippet actually appears on a page (tolerant to whitespace/case and minor OCR noise). */
export function snippetOnPage(snippet: string, pageText: string): boolean {
  const s = normalize(snippet).toLowerCase();
  const t = normalize(pageText).toLowerCase();
  if (!s || !t) return false;
  if (t.includes(s)) return true;
  // token overlap fallback for long snippets
  const tokens = s.split(' ').filter((w) => w.length > 3);
  if (tokens.length < 4) return false;
  const found = tokens.filter((w) => t.includes(w)).length;
  return found / tokens.length >= 0.75;
}

/** Find the page (if any) on which a numeric value string appears, optionally near a keyword. */
export function findValuePage(value: string, pages: PageText[], keyword?: string): number | null {
  const v = value.replace(/\s+/g, '');
  if (!v) return null;
  const candidates = pages.filter((p) => p.text.replace(/\s+/g, '').includes(v));
  if (candidates.length === 0) return null;
  if (keyword) {
    const kw = keyword.toLowerCase();
    const withKw = candidates.find((p) => p.text.toLowerCase().includes(kw));
    if (withKw) return withKw.page;
  }
  return candidates[0].page;
}
