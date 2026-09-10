// Deterministic ESG scoring engine. Pure function: scores are computed from
// extracted, evidence-backed metrics; the LLM never emits a score.

import { bandFor, DEFAULT_WEIGHTS, INDICATOR_MAP, indicatorsFor, type MetricStatus, type Pillar } from './esg-taxonomy.ts';

export interface ExtractedMetric {
  category: Pillar;
  metric_key: string;
  metric_name: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  year: number | null;
  page: number | null;
  evidence: string | null;
  status: MetricStatus;
  confidence: number; // 0-1
  verified?: boolean;
}

export interface RiskItem {
  kind: 'risk' | 'opportunity';
  category: Pillar;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: string | null;
  page: number | null;
  confidence: number;
}

export interface PillarScore {
  pillar: Pillar;
  score: number | null;
  disclosure_score: number;
  performance_score: number | null;
  data_coverage: number; // 0-1 share of indicator weight disclosed
  indicators_used: { key: string; name: string; value: number | null; unit: string | null; rating: number | null; page: number | null; status: MetricStatus }[];
  positive_factors: string[];
  negative_factors: string[];
  missing_disclosures: string[];
  evidence: { claim: string; page: number | null; snippet: string | null }[];
  confidence: 'High' | 'Medium' | 'Low';
  risk_penalty: number;
}

export interface ScoreResult {
  overall: number | null;
  rating: string;
  weights: { environmental: number; social: number; governance: number };
  pillars: Record<Pillar, PillarScore>;
  completeness: number; // 0-100 overall disclosure completeness
  confidence: 'High' | 'Medium' | 'Low';
  risk_score: number; // 0-100 (higher = more risk)
  methodology: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Prefer the most recent year, then highest confidence, per indicator key */
export function latestPerIndicator(metrics: ExtractedMetric[]): Map<string, ExtractedMetric> {
  const map = new Map<string, ExtractedMetric>();
  for (const m of metrics) {
    if (!INDICATOR_MAP[m.metric_key]) continue;
    const cur = map.get(m.metric_key);
    if (!cur) { map.set(m.metric_key, m); continue; }
    const curYear = cur.year ?? 0, y = m.year ?? 0;
    if (y > curYear || (y === curYear && m.confidence > cur.confidence)) map.set(m.metric_key, m);
  }
  return map;
}

function booleanValue(m: ExtractedMetric): boolean | null {
  if (m.value !== null && m.value !== undefined) return m.value > 0;
  const t = (m.value_text || '').toLowerCase();
  if (/^(yes|true|in place|adopted|disclosed|certified|validated|established)/.test(t)) return true;
  if (/^(no|false|not (in place|disclosed|adopted))/.test(t)) return false;
  return null;
}

export function scorePillar(pillar: Pillar, metrics: ExtractedMetric[], risks: RiskItem[]): PillarScore {
  const defs = indicatorsFor(pillar);
  const latest = latestPerIndicator(metrics.filter((m) => m.category === pillar));
  const totalWeight = defs.reduce((a, d) => a + d.weight, 0);

  let disclosedWeight = 0;
  let perfWeighted = 0;
  let perfWeight = 0;
  const used: PillarScore['indicators_used'] = [];
  const positives: string[] = [];
  const negatives: string[] = [];
  const missing: string[] = [];
  const evidence: PillarScore['evidence'] = [];
  let verifiedCount = 0;

  for (const def of defs) {
    const m = latest.get(def.key);
    if (!m) { missing.push(def.name); continue; }
    // Disclosure credit scales with confidence and status (reported > calculated > estimated > inferred)
    const statusFactor = m.status === 'REPORTED' ? 1 : m.status === 'CALCULATED' ? 0.9 : m.status === 'ESTIMATED' ? 0.6 : 0.4;
    disclosedWeight += def.weight * Math.max(0.5, m.confidence) * statusFactor;
    if (m.verified) verifiedCount++;

    let rating: number | null = null;
    if (def.boolean) {
      const b = booleanValue(m);
      if (b === true) rating = 100; else if (b === false) rating = 15;
    } else if (def.rate && m.value !== null && m.value !== undefined && Number.isFinite(m.value)) {
      rating = def.rate(m.value);
    }
    if (rating !== null) {
      perfWeighted += rating * def.weight;
      perfWeight += def.weight;
      const label = `${def.name}: ${m.value_text ?? m.value}${m.unit && !def.boolean ? ' ' + m.unit : ''}${m.page ? ` (p. ${m.page})` : ''}`;
      if (rating >= 70) positives.push(label); else if (rating <= 40) negatives.push(label);
    }
    used.push({ key: def.key, name: def.name, value: m.value, unit: m.unit, rating, page: m.page, status: m.status });
    if (m.evidence) evidence.push({ claim: def.name, page: m.page, snippet: m.evidence });
  }

  const coverage = totalWeight ? disclosedWeight / totalWeight : 0;
  const disclosure = round1(coverage * 100);
  const performance = perfWeight > 0 ? round1(perfWeighted / perfWeight) : null;
  const scoreableCount = used.filter((u) => u.rating !== null).length;

  // Risk penalty from evidence-backed high/medium risks in this pillar
  const pillarRisks = risks.filter((r) => r.kind === 'risk' && r.category === pillar);
  const riskPenalty = Math.min(12, pillarRisks.reduce((a, r) => a + (r.severity === 'high' ? 3 : r.severity === 'medium' ? 1.5 : 0.5), 0));

  let score: number | null = null;
  if (used.length === 0) {
    score = null; // nothing disclosed: no score, not zero-by-default
  } else if (performance !== null && scoreableCount >= 2) {
    score = 0.5 * performance + 0.5 * disclosure;
  } else if (performance !== null) {
    score = 0.3 * performance + 0.7 * disclosure;
  } else {
    // Disclosure only: cannot exceed 70 without demonstrated performance
    score = Math.min(70, disclosure);
  }
  if (score !== null) score = round1(Math.max(0, Math.min(100, score - riskPenalty)));

  const verifiedRate = used.length ? verifiedCount / used.length : 0;
  const confidence: PillarScore['confidence'] = coverage >= 0.55 && verifiedRate >= 0.75 ? 'High' : coverage >= 0.3 && verifiedRate >= 0.5 ? 'Medium' : 'Low';

  return {
    pillar,
    score,
    disclosure_score: disclosure,
    performance_score: performance,
    data_coverage: Number(coverage.toFixed(3)),
    indicators_used: used,
    positive_factors: positives,
    negative_factors: negatives,
    missing_disclosures: missing,
    evidence,
    confidence,
    risk_penalty: round1(riskPenalty),
  };
}

export function computeScores(
  metrics: ExtractedMetric[],
  risks: RiskItem[],
  weights: Partial<typeof DEFAULT_WEIGHTS> = {},
): ScoreResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const sum = w.environmental + w.social + w.governance || 1;
  const nw = { environmental: w.environmental / sum, social: w.social / sum, governance: w.governance / sum };

  const pillars = {
    environmental: scorePillar('environmental', metrics, risks),
    social: scorePillar('social', metrics, risks),
    governance: scorePillar('governance', metrics, risks),
  };

  // Overall: weighted average over pillars that have a score; weights renormalised over scored pillars
  let overallNum = 0, overallW = 0;
  (Object.keys(pillars) as Pillar[]).forEach((p) => {
    const s = pillars[p].score;
    if (s !== null) { overallNum += s * nw[p]; overallW += nw[p]; }
  });
  const overall = overallW > 0 ? round1(overallNum / overallW) : null;

  const completeness = round1(((pillars.environmental.data_coverage + pillars.social.data_coverage + pillars.governance.data_coverage) / 3) * 100);
  const confs = Object.values(pillars).map((p) => p.confidence);
  const confidence: ScoreResult['confidence'] = confs.every((c) => c === 'High') ? 'High' : confs.filter((c) => c !== 'Low').length >= 2 ? 'Medium' : 'Low';

  const riskScore = Math.min(100, Math.round(risks.filter((r) => r.kind === 'risk').reduce((a, r) => a + (r.severity === 'high' ? 15 : r.severity === 'medium' ? 8 : 3), 0)));

  return {
    overall,
    rating: overall === null ? 'Not scored' : bandFor(overall),
    weights: nw,
    pillars,
    completeness,
    confidence,
    risk_score: riskScore,
    methodology:
      'Pillar score = 50% performance rating of disclosed indicators + 50% weighted disclosure coverage (70/30 when fewer than two indicators are rateable; disclosure-only pillars are capped at 70), minus an evidence-backed risk penalty (max 12). Overall = weighted average of pillar scores (default E40/S30/G30). No value is scored unless it was extracted from the document with a page citation.',
  };
}

/** Year-over-year trends from metrics that carry multiple years for the same indicator */
export function computeTrends(metrics: ExtractedMetric[]) {
  const byKey = new Map<string, ExtractedMetric[]>();
  for (const m of metrics) {
    if (m.value === null || m.year === null) continue;
    if (!byKey.has(m.metric_key)) byKey.set(m.metric_key, []);
    byKey.get(m.metric_key)!.push(m);
  }
  const trends: { metric_key: string; metric_name: string; unit: string | null; series: { year: number; value: number; page: number | null }[]; change_pct: number | null; direction: 'improving' | 'worsening' | 'flat' | 'unknown' }[] = [];
  const lowerIsBetter = new Set(['scope1_emissions', 'scope2_emissions', 'scope3_emissions', 'total_ghg_emissions', 'emissions_intensity', 'total_energy_consumption', 'water_withdrawal', 'total_waste', 'hazardous_waste', 'ltifr', 'trir', 'fatalities', 'employee_turnover_pct', 'gender_pay_gap_pct', 'environmental_fines', 'corruption_incidents', 'customer_data_incidents']);
  for (const [key, list] of byKey) {
    const series = new Map<number, ExtractedMetric>();
    for (const m of list) { const cur = series.get(m.year!); if (!cur || m.confidence > cur.confidence) series.set(m.year!, m); }
    if (series.size < 2) continue;
    const sorted = [...series.values()].sort((a, b) => a.year! - b.year!);
    const first = sorted[0].value!, last = sorted[sorted.length - 1].value!;
    const change = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : null;
    let direction: 'improving' | 'worsening' | 'flat' | 'unknown' = 'unknown';
    if (change !== null) {
      if (Math.abs(change) < 1) direction = 'flat';
      else direction = (change < 0) === lowerIsBetter.has(key) ? 'improving' : 'worsening';
    }
    trends.push({ metric_key: key, metric_name: sorted[0].metric_name, unit: sorted[0].unit, series: sorted.map((m) => ({ year: m.year!, value: m.value!, page: m.page })), change_pct: change === null ? null : round1(change), direction });
  }
  return trends;
}

/** Simple linear projection, only when at least 3 data points exist. Always labelled ESTIMATED. */
export function forecast(series: { year: number; value: number }[], horizonYears = 3) {
  if (series.length < 3) return null;
  const n = series.length;
  const xs = series.map((s) => s.year), ys = series.map((s) => s.value);
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  if (den === 0) return null;
  const slope = num / den, intercept = my - slope * mx;
  const lastYear = xs[n - 1];
  const points = [];
  for (let k = 1; k <= horizonYears; k++) { const y = lastYear + k; points.push({ year: y, value: round1(Math.max(0, intercept + slope * y)) }); }
  return { slope: round1(slope), points, status: 'ESTIMATED' as const, basis: `Linear projection over ${n} reported data points (${xs[0]}–${lastYear})` };
}
