// Document Validation & Recognition gatekeeper.
// Input: page-preserving extracted text. Output: VALID / PARTIAL / INVALID with reasons,
// plus report metadata (company, year, type) — "Not disclosed" when it cannot be established.

import { authenticate, AuthError, corsHeaders, json } from '../_shared/auth.ts';
import { classifyDocument, normalize, type PageText } from '../_shared/validation.ts';
import { AIError, chatJSON, errorResponse } from '../_shared/openai.ts';

interface LLMVerdict {
  is_corporate_report: boolean;
  document_type: string;
  company_name: string | null;
  reporting_year: number | null;
  reporting_period: string | null;
  industry: string | null;
  headquarters_country: string | null;
  confidence: number;
  rationale: string;
}

const MAX_PAGES = 1500;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.pages)) return json({ error: 'Expected { pages: [{page, text}], fileName }' }, 400);

    const fileName: string = typeof body.fileName === 'string' ? body.fileName.slice(0, 255) : 'document';
    const pages: PageText[] = (body.pages as unknown[])
      .filter((p): p is { page: number; text: string } => !!p && typeof (p as PageText).page === 'number' && typeof (p as PageText).text === 'string')
      .slice(0, MAX_PAGES)
      .map((p) => ({ page: p.page, text: p.text.slice(0, 20000) }));

    const totalChars = pages.reduce((a, p) => a + p.text.trim().length, 0);
    if (totalChars < 300) {
      return json(buildResult({
        classification: 'INVALID',
        confidence: 0,
        document_type: 'Unknown',
        reasons: ['No readable text could be extracted from the document (it may be image-only, encrypted, or empty).'],
        heuristic: classifyDocument(pages),
        llm: null,
        pageCount: pages.length,
        fileName,
        rejection: 'The document contains no extractable text, so it cannot be verified as an ESG report.',
      }));
    }

    const heuristic = classifyDocument(pages);
    console.log(`[validate] ${fileName}: heuristic=${heuristic.classification} score=${heuristic.score} esgRatio=${heuristic.signals.esg_page_ratio} frameworks=${heuristic.signals.frameworks.join(',')}`);

    // ---- LLM confirmation + metadata (never used to invent content) ----
    let llm: LLMVerdict | null = null;
    let llmError: string | null = null;
    try {
      llm = await llmVerdict(pages, heuristic.top_esg_pages, fileName);
    } catch (e) {
      llmError = e instanceof Error ? e.message : String(e);
      console.warn('[validate] LLM verdict unavailable:', llmError);
    }

    // ---- Combine ----
    let classification = heuristic.classification;
    let confidence = heuristic.score;
    const reasons = [...heuristic.reasons];

    if (llm) {
      const llmConf = Math.round(Math.max(0, Math.min(1, llm.confidence)) * 100);
      if (llm.is_corporate_report) {
        confidence = Math.round(heuristic.score * 0.6 + llmConf * 0.4);
        if (classification === 'PARTIAL' && llmConf >= 80 && heuristic.score >= 45) classification = 'VALID';
        if (classification === 'INVALID' && llmConf >= 85 && heuristic.score >= 25) classification = 'PARTIAL';
        reasons.push(`AI review: ${llm.rationale}`);
      } else {
        confidence = Math.round(heuristic.score * 0.6 + (100 - llmConf) * 0.4);
        if (classification === 'VALID' && llmConf >= 70) classification = 'PARTIAL';
        if (classification === 'PARTIAL' && llmConf >= 85) classification = 'INVALID';
        reasons.push(`AI review disagrees: ${llm.rationale}`);
      }
    } else {
      reasons.push('AI review unavailable; decision based on document structure and content signals only.');
      if (classification === 'VALID' && heuristic.score < 70) classification = 'PARTIAL';
    }

    const documentType = (llm?.is_corporate_report && llm.document_type) ? llm.document_type : heuristic.document_type;
    const rejection = classification === 'INVALID'
      ? `This file does not appear to be an ESG, sustainability, or annual report. ${heuristic.signals.negative_signals.length ? 'It resembles: ' + heuristic.signals.negative_signals.join(', ') + '. ' : ''}Only ${Math.round(heuristic.signals.esg_page_ratio * 100)}% of pages contain ESG content.`
      : undefined;

    return json(buildResult({ classification, confidence, document_type: documentType, reasons, heuristic, llm, pageCount: pages.length, fileName, rejection, llmError }));
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.message }, 401);
    if (e instanceof AIError) return errorResponse(e, corsHeaders);
    console.error('[validate] error', e);
    return json({ error: e instanceof Error ? e.message : 'Validation failed' }, 500);
  }
});

async function llmVerdict(pages: PageText[], topPages: number[], fileName: string): Promise<LLMVerdict> {
  const byPage = new Map(pages.map((p) => [p.page, p.text]));
  const parts: string[] = [];
  for (const p of pages.slice(0, 2)) parts.push(`[Page ${p.page}]\n${normalize(p.text).slice(0, 3000)}`);
  for (const pn of topPages.slice(0, 4)) {
    if (pn <= 2) continue;
    const t = byPage.get(pn); if (t) parts.push(`[Page ${pn}]\n${normalize(t).slice(0, 1500)}`);
  }
  const excerpt = parts.join('\n\n');

  const prompt = `File name: ${fileName}\nTotal pages: ${pages.length}\n\nDocument excerpts:\n${excerpt}`;
  const system = `You are a strict document classifier for an ESG analytics platform. Decide whether the excerpts come from a genuine corporate ESG / sustainability / CSR / integrated / annual report (or an ESG data supplement) published by an organisation about its own operations.
Return ONLY JSON:
{"is_corporate_report": boolean, "document_type": "Sustainability Report"|"ESG Report"|"CSR Report"|"Integrated Report"|"Annual Report"|"ESG Data Supplement"|"Climate/TCFD Report"|"Other", "company_name": string|null, "reporting_year": number|null, "reporting_period": string|null, "industry": string|null, "headquarters_country": string|null, "confidence": number between 0 and 1, "rationale": short sentence}
Rules: company_name must be the reporting organisation exactly as printed, or null if not evident. reporting_year is the fiscal/reporting year covered, or null. Never guess: use null when the excerpts do not state it. Academic papers, textbooks, news articles, consultancy whitepapers about ESG in general, regulations, and marketing brochures are NOT corporate reports.`;

  const out = await chatJSON<LLMVerdict>({ system, user: prompt, maxTokens: 400, timeoutMs: 45_000 });
  return {
    is_corporate_report: !!out.is_corporate_report,
    document_type: typeof out.document_type === 'string' ? out.document_type : 'Other',
    company_name: typeof out.company_name === 'string' && out.company_name.trim() ? out.company_name.trim().slice(0, 120) : null,
    reporting_year: typeof out.reporting_year === 'number' && out.reporting_year > 1990 && out.reporting_year < 2100 ? out.reporting_year : null,
    reporting_period: typeof out.reporting_period === 'string' ? out.reporting_period.slice(0, 60) : null,
    industry: typeof out.industry === 'string' ? out.industry.slice(0, 80) : null,
    headquarters_country: typeof out.headquarters_country === 'string' ? out.headquarters_country.slice(0, 60) : null,
    confidence: typeof out.confidence === 'number' ? out.confidence : 0.5,
    rationale: typeof out.rationale === 'string' ? out.rationale.slice(0, 300) : '',
  };
}

function buildResult(args: {
  classification: 'VALID' | 'PARTIAL' | 'INVALID';
  confidence: number;
  document_type: string;
  reasons: string[];
  heuristic: ReturnType<typeof classifyDocument>;
  llm: LLMVerdict | null;
  pageCount: number;
  fileName: string;
  rejection?: string;
  llmError?: string | null;
}) {
  const { classification, confidence, heuristic, llm } = args;
  const companyName = llm?.company_name ?? heuristic.candidate_company_names[0] ?? 'Not disclosed';
  const year = llm?.reporting_year ?? heuristic.candidate_years[0] ?? null;
  const s = heuristic.signals;
  const legacyStatus = classification === 'VALID' ? 'Accepted: ESG/Sustainability Report' : classification === 'PARTIAL' ? 'Maybe: Needs manual confirmation' : 'Rejected: Not an ESG report';
  const confidenceLevel = confidence >= 75 ? 'High' : confidence >= 45 ? 'Medium' : 'Low';
  const legacyType = /sustainability|esg data|climate/i.test(args.document_type) ? 'Sustainability Report' : /esg/i.test(args.document_type) ? 'ESG Report' : /csr/i.test(args.document_type) ? 'CSR Report' : /annual|integrated|brsr/i.test(args.document_type) ? 'Annual Report' : 'Unknown';

  return {
    // ---- New contract ----
    classification,
    confidence,
    reasons: args.reasons,
    signals: s,
    metadata: {
      company_name: companyName,
      reporting_year: year,
      reporting_period: llm?.reporting_period ?? null,
      industry: llm?.industry ?? 'Not disclosed',
      headquarters_country: llm?.headquarters_country ?? 'Not disclosed',
      document_type: args.document_type,
      source: llm ? 'ai+heuristic' : 'heuristic',
    },
    ai_review_available: !!llm,
    ai_review_error: args.llmError ?? null,
    // ---- Legacy fields consumed by the existing UI ----
    company_name: companyName,
    detected_year: year,
    page_count: args.pageCount,
    document_type: legacyType,
    contains_esg_sections: s.section_headers.length > 0,
    esg_keywords_detected: Object.values(s.family_hits).reduce((a, b) => a + b, 0),
    keyword_breakdown: {
      environmental: s.pillar_hits.environmental,
      social: s.pillar_hits.social,
      governance: s.pillar_hits.governance,
      frameworks: s.frameworks.length,
    },
    detected_frameworks: s.frameworks,
    semantic_match_score: llm ? Math.round(llm.confidence * 100) : heuristic.score,
    section_headers_found: s.section_headers,
    final_validation_status: legacyStatus,
    confidence_level: confidenceLevel,
    rejection_reason: args.rejection,
    extracted_preview: args.reasons.slice(0, 4).join(' • '),
    validation_details: {
      keyword_score: Math.min(100, s.distinct_families * 5),
      structure_score: Math.min(100, s.section_headers.length * 10),
      semantic_score: llm ? Math.round(llm.confidence * 100) : heuristic.score,
      total_score: confidence,
    },
  };
}
