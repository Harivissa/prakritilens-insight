// Evidence-first ESG analysis.
// Reads stored page text, extracts metrics/risks with verbatim evidence via the LLM,
// verifies every citation against the page text, computes scores deterministically,
// and persists normalised results. Never fabricates: unverifiable claims are dropped.

import { authenticate, AuthError, corsHeaders, json } from '../_shared/auth.ts';
import { AIError, CHAT_MODEL, chatJSON, errorResponse } from '../_shared/openai.ts';
import { FRAMEWORKS, frameworkIndicators, INDICATOR_MAP, indicatorsFor, METRIC_PATTERNS, TERM_FAMILIES, type MetricStatus, type Pillar } from '../_shared/esg-taxonomy.ts';
import { computeScores, computeTrends, forecast, latestPerIndicator, type ExtractedMetric, type RiskItem } from '../_shared/scoring.ts';
import { findValuePage, normalize, snippetOnPage, type PageText } from '../_shared/validation.ts';

const MODEL = CHAT_MODEL;
const PILLARS: Pillar[] = ['environmental', 'social', 'governance'];
const PAGE_BUDGET: Record<Pillar, number> = { environmental: 18, social: 14, governance: 14 };
const EXCERPT_CHARS = 3500;

type SupabaseClient = Awaited<ReturnType<typeof authenticate>>['admin'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let admin: SupabaseClient | null = null;
  let runId: string | null = null;
  let reportId: string | null = null;

  try {
    const auth = await authenticate(req);
    admin = auth.admin;
    const body = await req.json().catch(() => null);
    if (!body || typeof body.reportId !== 'string') return json({ error: 'Expected { reportId }' }, 400);
    reportId = body.reportId;
    runId = typeof body.runId === 'string' ? body.runId : null;
    const weights = sanitizeWeights(body.weights);

    // ---- Load report + pages (ownership enforced) ----
    const { data: report, error: rErr } = await admin.from('reports').select('id, user_id, company_name, report_year, metadata, validation, file_name').eq('id', reportId).single();
    if (rErr || !report) return json({ error: 'Report not found' }, 404);
    if (report.user_id !== auth.userId) return json({ error: 'Forbidden' }, 403);

    const pages = await loadPages(admin, reportId!);
    if (pages.length === 0) return json({ error: 'No extracted pages found for this report. Extraction must complete before analysis.' }, 400);
    const totalChars = pages.reduce((a, p) => a + p.text.length, 0);
    if (totalChars < 500) return json({ error: 'Extracted text is too short to analyse.' }, 400);

    if (!runId) {
      const { data: run } = await admin.from('analysis_runs').insert({ report_id: reportId, user_id: auth.userId, status: 'ANALYZING', stage: 'started', progress: 55 }).select('id').single();
      runId = run?.id ?? null;
    }
    const setStage = (stage: string, progress: number) => updateRun(admin!, runId, { status: 'ANALYZING', stage, progress });
    await setStage('selecting_pages', 56);

    const byPage = new Map(pages.map((p) => [p.page, p.text]));
    const selected = selectPages(pages);

    // ---- LLM extraction (parallel, per pillar) + qualitative pass ----
    await setStage('extracting_metrics', 60);
    const [envRaw, socRaw, govRaw, qualRaw] = await Promise.all([
      extractMetrics('environmental', selected.environmental, byPage),
      extractMetrics('social', selected.social, byPage),
      extractMetrics('governance', selected.governance, byPage),
      extractQualitative(selected.overview, byPage, report.company_name),
    ]);

    // ---- Verification against page text ----
    await setStage('verifying_evidence', 78);
    const rawMetrics = [...envRaw, ...socRaw, ...govRaw];
    const { kept: metrics, dropped: droppedMetrics } = verifyMetrics(rawMetrics, pages);
    const risks = verifyItems(qualRaw.risks, pages, 'risk');
    const opportunities = verifyItems(qualRaw.opportunities, pages, 'opportunity');
    const targets = verifyTargets(qualRaw.targets, pages);
    const highlights = verifyHighlights(qualRaw.key_highlights, pages);
    const controversies = verifyHighlights(qualRaw.controversies, pages);

    // Derived (CALCULATED) metrics
    addCalculatedMetrics(metrics);

    // ---- Deterministic scoring ----
    await setStage('scoring', 84);
    const allRisks: RiskItem[] = [...risks, ...opportunities];
    const scores = computeScores(metrics, allRisks, weights);
    const trends = computeTrends(metrics);
    const emissionsTrend = trends.find((t) => t.metric_key === 'total_ghg_emissions') ?? trends.find((t) => t.metric_key === 'scope1_emissions');
    const emissionsForecast = emissionsTrend ? forecast(emissionsTrend.series) : null;
    const frameworks = frameworkMapping(pages, metrics);
    const carbon = carbonSummary(metrics);
    const quality = qualityAssessment(metrics, scores.completeness, qualRaw.assurance, frameworks);
    const comparison = await historicalComparison(admin, auth.userId, reportId!, report.company_name, report.report_year, scores);

    // ---- Persist ----
    await setStage('saving_results', 90);
    await persist(admin, auth.userId, reportId!, metrics, scores, allRisks, targets, highlights);

    const meta = (report.metadata ?? {}) as Record<string, unknown>;
    const executiveSummary = typeof qualRaw.executive_summary === 'string' && qualRaw.executive_summary.trim() ? qualRaw.executive_summary.trim() : 'No grounded executive summary could be produced from the extracted text.';

    const breakdown = {
      environmental: scores.pillars.environmental.score ?? 0,
      social: scores.pillars.social.score ?? 0,
      governance: scores.pillars.governance.score ?? 0,
    };
    const unscored = PILLARS.filter((p) => scores.pillars[p].score === null);

    const analysisLines: string[] = [];
    analysisLines.push(executiveSummary);
    for (const h of highlights.slice(0, 8)) analysisLines.push(`${h.text} (p. ${h.page})`);
    for (const p of unscored) analysisLines.push(`${cap(p)} pillar not scored: no evidence-backed disclosures were found in the document.`);
    if (droppedMetrics > 0) analysisLines.push(`${droppedMetrics} candidate figure(s) were discarded because they could not be verified against the document text.`);

    const analysisData = {
      // ---- UI-compatible core ----
      score: scores.overall ?? 0,
      breakdown,
      analysis: analysisLines,
      risks: risks.map((r) => `[${cap(r.severity)}] ${r.title} — ${r.description}${r.page ? ` (p. ${r.page})` : ''}`),
      opportunities: opportunities.map((r) => `${r.title} — ${r.description}${r.page ? ` (p. ${r.page})` : ''}`),
      // ---- Full evidence-backed detail ----
      version: 2,
      generated_at: new Date().toISOString(),
      model: MODEL,
      rating: scores.rating,
      confidence_level: scores.confidence,
      completeness: scores.completeness,
      risk_score: scores.risk_score,
      weights: scores.weights,
      methodology: scores.methodology,
      unscored_pillars: unscored,
      pillars: scores.pillars,
      executive_summary: executiveSummary,
      key_highlights: highlights,
      metrics,
      risks_detailed: risks,
      opportunities_detailed: opportunities,
      targets,
      controversies,
      assurance: qualRaw.assurance,
      missing_disclosures: {
        environmental: scores.pillars.environmental.missing_disclosures,
        social: scores.pillars.social.missing_disclosures,
        governance: scores.pillars.governance.missing_disclosures,
        noted_by_review: Array.isArray(qualRaw.missing_or_weak_disclosures) ? qualRaw.missing_or_weak_disclosures.slice(0, 15) : [],
      },
      frameworks,
      trends,
      forecast: emissionsForecast ? { metric: emissionsTrend!.metric_name, unit: emissionsTrend!.unit, ...emissionsForecast } : { status: 'UNAVAILABLE', reason: 'Insufficient historical data (at least three reported years are required).' },
      carbon,
      quality,
      comparison,
      metadata: { ...meta, company_name: report.company_name, report_year: report.report_year, pages_analysed: pages.length, pages_sampled: { environmental: selected.environmental.length, social: selected.social.length, governance: selected.governance.length } },
      stats: { metrics_extracted: rawMetrics.length, metrics_verified: metrics.length, metrics_dropped: droppedMetrics, risks: risks.length, opportunities: opportunities.length, targets: targets.length },
    };

    const { error: upErr } = await admin.from('reports').update({
      score: scores.overall,
      analysis_data: analysisData,
      extracted_metrics: { metrics, targets, carbon },
      evidence: [...scores.pillars.environmental.evidence, ...scores.pillars.social.evidence, ...scores.pillars.governance.evidence].slice(0, 200),
      confidence_level: scores.confidence,
      quality,
      status: 'COMPLETED',
      validation_status: 'validated',
    }).eq('id', reportId).eq('user_id', auth.userId);
    if (upErr) throw new Error(`Failed to save analysis: ${upErr.message}`);

    await updateRun(admin, runId, { status: 'COMPLETED', stage: 'completed', progress: 100, finished_at: new Date().toISOString() });
    console.log(`[analyze] report=${reportId} overall=${scores.overall} metrics=${metrics.length}/${rawMetrics.length} risks=${risks.length}`);
    return json({ reportId, runId, analysis: analysisData });
  } catch (e) {
    if (admin && runId) await updateRun(admin, runId, { status: 'FAILED', stage: 'failed', error: e instanceof Error ? e.message : String(e), finished_at: new Date().toISOString() });
    if (admin && reportId) await admin.from('reports').update({ status: 'FAILED' }).eq('id', reportId);
    if (e instanceof AuthError) return json({ error: e.message }, 401);
    if (e instanceof AIError) return errorResponse(e, corsHeaders);
    console.error('[analyze] error', e);
    return json({ error: e instanceof Error ? e.message : 'Analysis failed' }, 500);
  }
});

// ------------------------------------------------------------------ helpers

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function sanitizeWeights(w: unknown) {
  if (!w || typeof w !== 'object') return {};
  const o = w as Record<string, unknown>;
  const pick = (k: string) => (typeof o[k] === 'number' && o[k]! >= 0 && o[k]! <= 100 ? (o[k] as number) : undefined);
  const out: Record<string, number> = {};
  for (const k of PILLARS) { const v = pick(k); if (v !== undefined) out[k] = v > 1 ? v / 100 : v; }
  return out;
}

async function loadPages(admin: SupabaseClient, reportId: string): Promise<PageText[]> {
  const pages: PageText[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    const { data, error } = await admin.from('document_pages').select('page_number, text').eq('report_id', reportId).order('page_number').range(from, from + size - 1);
    if (error) throw new Error(`Failed to load pages: ${error.message}`);
    for (const r of data ?? []) pages.push({ page: r.page_number, text: r.text ?? '' });
    if (!data || data.length < size) break;
  }
  return pages;
}

async function updateRun(admin: SupabaseClient, runId: string | null, patch: Record<string, unknown>) {
  if (!runId) return;
  await admin.from('analysis_runs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', runId);
}

function selectPages(pages: PageText[]) {
  const scored = pages.map((p) => {
    const t = p.text;
    const fam: Record<Pillar | 'general', number> = { environmental: 0, social: 0, governance: 0, general: 0 };
    for (const f of TERM_FAMILIES) if (f.pattern.test(t)) fam[f.pillar as Pillar | 'general']++;
    let metrics = 0;
    for (const mp of METRIC_PATTERNS) { const m = t.match(new RegExp(mp.source, 'gi')); if (m) metrics += m.length; }
    const digits = (t.match(/\d[\d,.]*/g) || []).length;
    return { page: p.page, fam, metrics, digits, len: t.length };
  });
  const pick = (pillar: Pillar, n: number) =>
    [...scored]
      .filter((s) => s.len > 200)
      .sort((a, b) => (b.fam[pillar] * 3 + b.metrics + Math.min(b.digits, 40) / 10) - (a.fam[pillar] * 3 + a.metrics + Math.min(a.digits, 40) / 10))
      .slice(0, n)
      .filter((s) => s.fam[pillar] > 0)
      .map((s) => s.page)
      .sort((a, b) => a - b);
  const overview = new Set<number>(pages.slice(0, 3).map((p) => p.page));
  [...scored]
    .sort((a, b) => (b.fam.environmental + b.fam.social + b.fam.governance + b.fam.general * 2 + b.metrics) - (a.fam.environmental + a.fam.social + a.fam.governance + a.fam.general * 2 + a.metrics))
    .slice(0, 12)
    .forEach((s) => overview.add(s.page));
  return {
    environmental: pick('environmental', PAGE_BUDGET.environmental),
    social: pick('social', PAGE_BUDGET.social),
    governance: [...new Set([...pages.slice(0, 2).map((p) => p.page), ...pick('governance', PAGE_BUDGET.governance)])].sort((a, b) => a - b),
    overview: [...overview].sort((a, b) => a - b),
  };
}

function excerpt(pageNums: number[], byPage: Map<number, string>, chars = EXCERPT_CHARS) {
  return pageNums.map((pn) => `[Page ${pn}]\n${normalize(byPage.get(pn) ?? '').slice(0, chars)}`).join('\n\n');
}

interface RawMetric { metric_key?: string; metric_name?: string; value?: unknown; value_text?: unknown; unit?: unknown; year?: unknown; page?: unknown; evidence?: unknown; status?: unknown }

async function extractMetrics(pillar: Pillar, pageNums: number[], byPage: Map<number, string>): Promise<ExtractedMetric[]> {
  if (pageNums.length === 0) return [];
  const defs = indicatorsFor(pillar);
  const catalogue = defs.map((d) => `- ${d.key}: ${d.name} [${d.units.join(', ')}]${d.boolean ? ' (yes/no disclosure: value 1 if clearly in place, 0 if explicitly absent)' : ''}`).join('\n');
  const system = `You extract ${pillar} ESG data points from excerpts of a corporate report. Work ONLY from the text provided.
Return ONLY JSON: {"metrics":[{"metric_key":string,"metric_name":string,"value":number|null,"value_text":string,"unit":string|null,"year":number|null,"page":number,"evidence":string,"status":"REPORTED"|"CALCULATED"|"ESTIMATED"|"INFERRED"}]}
Catalogue of metric_key values (use exactly; use "other" for a notable ${pillar} figure not in the catalogue):
${catalogue}
Rules:
1. Every metric MUST cite the page it appears on ([Page N] markers) and "evidence" MUST be a verbatim quote (max 200 characters) copied from that page containing the figure.
2. "value" is the numeric figure as printed (strip thousands separators; keep units in "unit"). Percentages: value 45 with unit "%". Years: value like 2040 with unit "year".
3. If the same metric is reported for several years, output one entry per year with the correct "year".
4. Use status REPORTED for figures printed in the document. Use CALCULATED only if you sum/derive from printed figures (say so in value_text). Never use ESTIMATED or INFERRED for numbers that are not in the text - omit them instead.
5. Do not invent, round differently, or infer from general knowledge. If nothing qualifies, return {"metrics":[]}.`;
  const user = `Report excerpts (${pageNums.length} pages):\n\n${excerpt(pageNums, byPage)}`;
  const out = await chatJSON<{ metrics?: RawMetric[] }>({ model: MODEL, system, user, maxTokens: 4500, timeoutMs: 120_000 });
  const list = Array.isArray(out?.metrics) ? out.metrics : [];
  const result: ExtractedMetric[] = [];
  for (const m of list.slice(0, 80)) {
    const key = typeof m.metric_key === 'string' ? m.metric_key.trim() : '';
    const def = INDICATOR_MAP[key];
    const page = typeof m.page === 'number' ? Math.round(m.page) : parseInt(String(m.page ?? ''), 10);
    if (!Number.isFinite(page)) continue;
    const value = typeof m.value === 'number' && Number.isFinite(m.value) ? m.value : (typeof m.value === 'string' ? parseNumber(m.value) : null);
    const name = def?.name ?? (typeof m.metric_name === 'string' ? m.metric_name.slice(0, 120) : 'Other');
    const status = (['REPORTED', 'CALCULATED', 'ESTIMATED', 'INFERRED'] as MetricStatus[]).includes(m.status as MetricStatus) ? (m.status as MetricStatus) : 'REPORTED';
    if (!def && key !== 'other') continue;
    if (!def?.boolean && value === null && !(typeof m.value_text === 'string' && m.value_text.trim())) continue;
    result.push({
      category: pillar,
      metric_key: def ? key : `other_${slug(name)}`,
      metric_name: name,
      value,
      value_text: typeof m.value_text === 'string' ? m.value_text.slice(0, 200) : value !== null ? String(value) : null,
      unit: typeof m.unit === 'string' ? m.unit.slice(0, 40) : null,
      year: typeof m.year === 'number' && m.year > 1990 && m.year < 2100 ? Math.round(m.year) : null,
      page,
      evidence: typeof m.evidence === 'string' ? m.evidence.slice(0, 300) : null,
      status: status === 'ESTIMATED' || status === 'INFERRED' ? 'REPORTED' : status, // model is told not to emit these; treat as needing verification
      confidence: 0.9,
    });
  }
  return result;
}

interface RawItem { title?: unknown; description?: unknown; category?: unknown; severity?: unknown; page?: unknown; evidence?: unknown }
interface RawTarget { description?: unknown; metric_key?: unknown; target_value?: unknown; target_year?: unknown; baseline_year?: unknown; page?: unknown; evidence?: unknown }
interface RawHighlight { text?: unknown; page?: unknown; evidence?: unknown }
interface Qualitative {
  executive_summary?: string;
  key_highlights?: RawHighlight[];
  risks?: RawItem[];
  opportunities?: RawItem[];
  targets?: RawTarget[];
  controversies?: RawHighlight[];
  assurance?: { provider?: string | null; level?: string | null; page?: number | null } | null;
  missing_or_weak_disclosures?: string[];
}

async function extractQualitative(pageNums: number[], byPage: Map<number, string>, company: string | null): Promise<Qualitative> {
  const system = `You are an ESG analyst summarising a corporate report strictly from the excerpts provided${company ? ` (reporting organisation: ${company})` : ''}.
Return ONLY JSON:
{"executive_summary": string (3-5 sentences, only facts present in the excerpts, mention page numbers inline like (p. 12)),
 "key_highlights":[{"text":string,"page":number,"evidence":string}],
 "risks":[{"title":string,"description":string,"category":"environmental"|"social"|"governance","severity":"high"|"medium"|"low","page":number,"evidence":string}],
 "opportunities":[{"title":string,"description":string,"category":"environmental"|"social"|"governance","severity":"high"|"medium"|"low","page":number,"evidence":string}],
 "targets":[{"description":string,"metric_key":string|null,"target_value":number|null,"target_year":number|null,"baseline_year":number|null,"page":number,"evidence":string}],
 "controversies":[{"text":string,"page":number,"evidence":string}],
 "assurance":{"provider":string|null,"level":string|null,"page":number|null}|null,
 "missing_or_weak_disclosures":[string]}
Rules: every item cites the [Page N] it came from and "evidence" is a verbatim quote (max 200 characters) from that page. Risks are risks the document itself discusses or that are evident from disclosed figures (e.g. rising emissions, fatalities, fines); do not add generic industry risks. Max 8 risks, 8 opportunities, 10 targets, 10 highlights. If the excerpts do not support an item, leave the list empty.`;
  const user = `Report excerpts:\n\n${excerpt(pageNums, byPage, 3000)}`;
  const out = await chatJSON<Qualitative>({ model: MODEL, system, user, maxTokens: 4500, timeoutMs: 120_000 });
  return out && typeof out === 'object' ? out : {};
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(/[,\s]/g, '').replace(/[^\d.\-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

function valueStrings(m: ExtractedMetric): string[] {
  const out = new Set<string>();
  if (m.value !== null) {
    const v = m.value;
    out.add(String(v));
    out.add(v.toLocaleString('en-US'));
    if (Number.isInteger(v)) out.add(v.toLocaleString('en-US', { minimumFractionDigits: 0 }));
    out.add(v.toFixed(1)); out.add(v.toFixed(2));
  }
  if (m.value_text) { const nums = m.value_text.match(/\d[\d,.]*/g); nums?.forEach((n) => out.add(n)); }
  return [...out].filter((s) => s.replace(/[^\d]/g, '').length >= 1);
}

function verifyMetrics(metrics: ExtractedMetric[], pages: PageText[]) {
  const byPage = new Map(pages.map((p) => [p.page, p.text]));
  const kept: ExtractedMetric[] = [];
  let dropped = 0;
  const seen = new Set<string>();
  for (const m of metrics) {
    const pageText = byPage.get(m.page ?? -1) ?? '';
    const def = INDICATOR_MAP[m.metric_key];
    const isBool = !!def?.boolean;
    let verified = false;
    if (m.evidence && snippetOnPage(m.evidence, pageText)) verified = true;
    if (!verified && !isBool) {
      const vs = valueStrings(m);
      if (vs.some((v) => pageText.replace(/\s+/g, '').includes(v.replace(/\s+/g, '')))) verified = true;
      else {
        // maybe the page number is off by one or the figure sits on a neighbouring page
        const kw = (def?.name ?? m.metric_name).split(' ')[0];
        const found = vs.map((v) => findValuePage(v, pages, kw)).find((p) => p !== null);
        if (found !== undefined && found !== null) { m.page = found; m.confidence = 0.75; verified = true; }
      }
    }
    if (!verified && isBool && m.evidence) {
      const alt = pages.find((p) => snippetOnPage(m.evidence!, p.text));
      if (alt) { m.page = alt.page; m.confidence = 0.75; verified = true; }
    }
    if (!verified) { dropped++; continue; }
    const dedupe = `${m.metric_key}|${m.year ?? ''}|${m.value ?? m.value_text}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    kept.push({ ...m, verified: true });
  }
  return { kept, dropped };
}

function verifyItems(items: RawItem[] | undefined, pages: PageText[], kind: 'risk' | 'opportunity'): RiskItem[] {
  if (!Array.isArray(items)) return [];
  const byPage = new Map(pages.map((p) => [p.page, p.text]));
  const out: RiskItem[] = [];
  for (const it of items.slice(0, 12)) {
    const title = typeof it.title === 'string' ? it.title.trim().slice(0, 140) : '';
    const description = typeof it.description === 'string' ? it.description.trim().slice(0, 600) : '';
    if (!title) continue;
    const category = PILLARS.includes(it.category as Pillar) ? (it.category as Pillar) : 'governance';
    const severity = (['high', 'medium', 'low'] as const).includes(it.severity as 'high') ? (it.severity as 'high' | 'medium' | 'low') : 'medium';
    let page = typeof it.page === 'number' ? Math.round(it.page) : null;
    const evidence = typeof it.evidence === 'string' ? it.evidence.slice(0, 300) : null;
    let confidence = 0.9;
    if (!evidence || !page || !snippetOnPage(evidence, byPage.get(page) ?? '')) {
      const alt = evidence ? pages.find((p) => snippetOnPage(evidence, p.text)) : undefined;
      if (!alt) continue; // unverifiable -> dropped
      page = alt.page; confidence = 0.7;
    }
    out.push({ kind, category, severity, title, description, evidence, page, confidence });
  }
  return out;
}

function verifyTargets(items: RawTarget[] | undefined, pages: PageText[]) {
  if (!Array.isArray(items)) return [];
  const byPage = new Map(pages.map((p) => [p.page, p.text]));
  const out: { description: string; metric_key: string | null; target_value: number | null; target_year: number | null; baseline_year: number | null; page: number; evidence: string }[] = [];
  for (const t of items.slice(0, 15)) {
    const description = typeof t.description === 'string' ? t.description.trim().slice(0, 300) : '';
    const evidence = typeof t.evidence === 'string' ? t.evidence.slice(0, 300) : '';
    let page = typeof t.page === 'number' ? Math.round(t.page) : null;
    if (!description || !evidence) continue;
    if (!page || !snippetOnPage(evidence, byPage.get(page) ?? '')) {
      const alt = pages.find((p) => snippetOnPage(evidence, p.text));
      if (!alt) continue;
      page = alt.page;
    }
    out.push({
      description,
      metric_key: typeof t.metric_key === 'string' && INDICATOR_MAP[t.metric_key] ? t.metric_key : null,
      target_value: typeof t.target_value === 'number' ? t.target_value : null,
      target_year: typeof t.target_year === 'number' ? Math.round(t.target_year) : null,
      baseline_year: typeof t.baseline_year === 'number' ? Math.round(t.baseline_year) : null,
      page,
      evidence,
    });
  }
  return out;
}

function verifyHighlights(items: RawHighlight[] | undefined, pages: PageText[]) {
  if (!Array.isArray(items)) return [];
  const byPage = new Map(pages.map((p) => [p.page, p.text]));
  const out: { text: string; page: number; evidence: string }[] = [];
  for (const h of items.slice(0, 12)) {
    const text = typeof h.text === 'string' ? h.text.trim().slice(0, 300) : '';
    const evidence = typeof h.evidence === 'string' ? h.evidence.slice(0, 300) : '';
    let page = typeof h.page === 'number' ? Math.round(h.page) : null;
    if (!text || !evidence) continue;
    if (!page || !snippetOnPage(evidence, byPage.get(page) ?? '')) {
      const alt = pages.find((p) => snippetOnPage(evidence, p.text));
      if (!alt) continue;
      page = alt.page;
    }
    out.push({ text, page, evidence });
  }
  return out;
}

function addCalculatedMetrics(metrics: ExtractedMetric[]) {
  const latest = latestPerIndicator(metrics);
  const s1 = latest.get('scope1_emissions'), s2 = latest.get('scope2_emissions');
  if (s1 && s2 && s1.value !== null && s2.value !== null && !latest.get('total_ghg_emissions') && sameUnit(s1.unit, s2.unit)) {
    metrics.push({
      category: 'environmental', metric_key: 'total_ghg_emissions', metric_name: 'Total GHG emissions (Scope 1 + 2)',
      value: Math.round((s1.value + s2.value) * 100) / 100, value_text: `${s1.value} + ${s2.value}`, unit: s1.unit, year: s1.year ?? s2.year,
      page: s1.page, evidence: `Calculated from Scope 1 (p. ${s1.page}) and Scope 2 (p. ${s2.page}) figures`, status: 'CALCULATED', confidence: Math.min(s1.confidence, s2.confidence), verified: true,
    });
  }
}
const sameUnit = (a: string | null, b: string | null) => (a ?? '').toLowerCase().replace(/\s/g, '') === (b ?? '').toLowerCase().replace(/\s/g, '');

function frameworkMapping(pages: PageText[], metrics: ExtractedMetric[]) {
  const disclosed = new Set(metrics.map((m) => m.metric_key));
  return FRAMEWORKS.map((fw) => {
    const refPages: number[] = [];
    for (const p of pages) if (fw.patterns.some((re) => re.test(p.text))) { refPages.push(p.page); if (refPages.length >= 5) break; }
    const core = frameworkIndicators(fw.key);
    const covered = core.filter((k) => disclosed.has(k));
    return {
      framework: fw.key,
      name: fw.name,
      referenced: refPages.length > 0,
      reference_pages: refPages,
      core_indicators: core.length,
      indicators_disclosed: covered.length,
      alignment_pct: core.length ? Math.round((covered.length / core.length) * 100) : null,
      status: refPages.length === 0 ? 'Not referenced' : core.length === 0 ? 'Referenced' : covered.length / core.length >= 0.6 ? 'Substantially aligned' : covered.length / core.length >= 0.3 ? 'Partially aligned' : 'Referenced, limited evidence',
    };
  }).filter((f) => f.referenced || (f.alignment_pct ?? 0) >= 30);
}

function carbonSummary(metrics: ExtractedMetric[]) {
  const latest = latestPerIndicator(metrics);
  const g = (k: string) => latest.get(k);
  const s1 = g('scope1_emissions'), s2 = g('scope2_emissions'), s3 = g('scope3_emissions'), tot = g('total_ghg_emissions');
  const fmt = (m?: ExtractedMetric) => m ? { value: m.value, unit: m.unit, year: m.year, page: m.page, status: m.status } : { value: null, status: 'NOT_DISCLOSED' as const };
  return {
    scope1: fmt(s1), scope2: fmt(s2), scope3: fmt(s3), total: fmt(tot),
    intensity: fmt(g('emissions_intensity')),
    reduction_vs_baseline: fmt(g('emissions_reduction_pct')),
    net_zero_target_year: fmt(g('net_zero_target_year')),
    note: tot ? (tot.status === 'CALCULATED' ? 'Total calculated from reported Scope 1 and Scope 2.' : 'Total as reported.') : 'Total emissions not disclosed and cannot be calculated from reported figures.',
  };
}

function qualityAssessment(metrics: ExtractedMetric[], completeness: number, assurance: Qualitative['assurance'], frameworks: ReturnType<typeof frameworkMapping>) {
  const verifiedRate = metrics.length ? metrics.filter((m) => m.verified).length / metrics.length : 0;
  const withYear = metrics.length ? metrics.filter((m) => m.year !== null).length / metrics.length : 0;
  const assured = !!(assurance && (assurance.provider || assurance.level));
  const referenced = frameworks.filter((f) => f.referenced);
  const alignment = referenced.length ? referenced.reduce((a, f) => a + (f.alignment_pct ?? 0), 0) / referenced.length : 0;
  const transparency = Math.round(verifiedRate * 100);
  const consistency = Math.round(withYear * 100);
  const assuranceScore = assured ? 100 : 0;
  const frameworkScore = Math.round(Math.min(100, referenced.length * 20 + alignment * 0.4));
  const overall = Math.round(transparency * 0.3 + completeness * 0.3 + consistency * 0.15 + assuranceScore * 0.1 + frameworkScore * 0.15);
  return {
    overall,
    transparency,
    completeness,
    consistency,
    assurance: assuranceScore,
    framework_use: frameworkScore,
    assurance_detail: assured ? assurance : { provider: null, level: null, page: null, note: 'No external assurance statement found' },
    metrics_with_year_pct: consistency,
  };
}

async function historicalComparison(admin: SupabaseClient, userId: string, reportId: string, company: string | null, year: number | null, scores: ReturnType<typeof computeScores>) {
  if (!company || company === 'Not disclosed') return { available: false, reason: 'Company name not disclosed; cannot match previous reports.' };
  const { data } = await admin.from('reports').select('id, company_name, report_year, score, analysis_data, created_at').eq('user_id', userId).eq('status', 'COMPLETED').neq('id', reportId).ilike('company_name', company).order('report_year', { ascending: true }).limit(10);
  const prev = (data ?? []).filter((r) => r.score !== null);
  if (prev.length === 0) return { available: false, reason: 'No previous completed analysis for this company.' };
  const cur = { report_year: year, score: scores.overall, breakdown: { environmental: scores.pillars.environmental.score, social: scores.pillars.social.score, governance: scores.pillars.governance.score } };
  const series = prev.map((r) => ({ report_id: r.id, report_year: r.report_year, score: Number(r.score), breakdown: r.analysis_data?.breakdown ?? null }));
  const last = series[series.length - 1];
  return {
    available: true,
    current: cur,
    previous: series,
    delta_vs_latest_previous: scores.overall !== null && last ? Math.round((scores.overall - last.score) * 10) / 10 : null,
  };
}

async function persist(admin: SupabaseClient, userId: string, reportId: string, metrics: ExtractedMetric[], scores: ReturnType<typeof computeScores>, risks: RiskItem[], targets: ReturnType<typeof verifyTargets>, highlights: ReturnType<typeof verifyHighlights>) {
  await Promise.all([
    admin.from('extracted_metrics').delete().eq('report_id', reportId),
    admin.from('esg_scores').delete().eq('report_id', reportId),
    admin.from('risk_factors').delete().eq('report_id', reportId),
    admin.from('evidence').delete().eq('report_id', reportId),
  ]);
  const chunk = async (rows: Record<string, unknown>[], table: string) => {
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await admin.from(table).insert(rows.slice(i, i + 200) as never);
      if (error) throw new Error(`Failed to save ${table}: ${error.message}`);
    }
  };
  await chunk(metrics.map((m) => ({ report_id: reportId, user_id: userId, category: m.category, metric_key: m.metric_key, metric_name: m.metric_name, value: m.value, value_text: m.value_text, unit: m.unit, year: m.year, page: m.page, evidence: m.evidence, status: m.status, confidence: m.confidence })), 'extracted_metrics');
  await chunk(PILLARS.map((p) => { const s = scores.pillars[p]; return { report_id: reportId, user_id: userId, pillar: p, score: s.score, disclosure_score: s.disclosure_score, performance_score: s.performance_score, indicators_used: s.indicators_used, weights: scores.weights, positive_factors: s.positive_factors, negative_factors: s.negative_factors, evidence: s.evidence, confidence: s.confidence, data_coverage: s.data_coverage }; }), 'esg_scores');
  await chunk(risks.map((r) => ({ report_id: reportId, user_id: userId, kind: r.kind, category: r.category, severity: r.severity, title: r.title, description: r.description, evidence: r.evidence, page: r.page, confidence: r.confidence })), 'risk_factors');
  const evidenceRows = [
    ...metrics.filter((m) => m.evidence).map((m) => ({ report_id: reportId, user_id: userId, claim: `${m.metric_name}: ${m.value_text ?? m.value}${m.unit ? ' ' + m.unit : ''}`, page: m.page, snippet: m.evidence, category: m.category, metric_key: m.metric_key, confidence: m.confidence })),
    ...targets.map((t) => ({ report_id: reportId, user_id: userId, claim: `Target: ${t.description}`, page: t.page, snippet: t.evidence, category: 'target', metric_key: t.metric_key, confidence: 0.9 })),
    ...highlights.map((h) => ({ report_id: reportId, user_id: userId, claim: h.text, page: h.page, snippet: h.evidence, category: 'highlight', metric_key: null, confidence: 0.9 })),
  ];
  await chunk(evidenceRows, 'evidence');
}
