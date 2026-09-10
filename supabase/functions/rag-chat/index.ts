// Report-aware, ESG-scoped RAG chat with persisted conversations and page citations.
import { authenticate, AuthError, corsHeaders, json } from '../_shared/auth.ts';
import { AIError, chatJSON, chatWithHistory, embed, errorResponse, type ChatMessage } from '../_shared/openai.ts';
import { TERM_FAMILIES } from '../_shared/esg-taxonomy.ts';

const INSUFFICIENT = 'Insufficient evidence found in the uploaded report to answer this question.';
const OUT_OF_SCOPE = 'I can only help with ESG and sustainability topics — for example emissions, energy, water, workforce, safety, diversity, governance, ESG scores, risks, targets, and reporting frameworks in your uploaded reports. Please ask a question in that area.';
const NO_REPORT = 'No analysed report is available yet. Upload an ESG, sustainability, or annual report and I will answer questions about it with page citations.';

const ESG_HINT = /\b(esg|sustainab|environment|climate|carbon|emission|ghg|scope [123]|net[- ]?zero|energy|renewable|water|waste|recycl|biodivers|social|employee|workforce|diversity|inclusion|gender|women|safety|injur|ltifr|human rights|supplier|supply chain|community|governance|board|director|ethic|corruption|bribery|whistleblow|compensation|audit|assurance|materiality|stakeholder|gri|sasb|tcfd|cdp|csrd|esrs|issb|sdg|score|rating|risk|opportunit|target|goal|report|company|metric|disclos|framework|compare|comparison|versus|vs\.?|trend|summary|summari[sz]e|highlight|recommend|improve|strength|weakness|pillar|methodology|how (is|are|was|were)|what (is|are|was|were)|why)\b/i;
const GREETING = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|thanks?( you)?|thank you|ok(ay)?|bye)[\s!.]*$/i;
const COMPARE = /\b(compare|comparison|versus|vs\.?|difference between|better than|worse than|against)\b/i;
const CONCEPTUAL = /^\s*(what (is|are|does)|define|explain|meaning of|how (do|does) .* work|difference between)\b/i;

type Tone = 'professional' | 'concise' | 'detailed' | 'simple';
const TONE_HINT: Record<Tone, string> = {
  professional: 'Write in a professional analyst tone.',
  concise: 'Be concise: at most 5 short sentences or bullets.',
  detailed: 'Be thorough and structured with short headings and bullet points where helpful.',
  simple: 'Use plain language a non-specialist can follow; avoid jargon.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    const body = await req.json().catch(() => null);
    const message: string = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!message) return json({ error: 'message is required' }, 400);
    if (message.length > 4000) return json({ error: 'message too long (max 4000 characters)' }, 400);
    const tone: Tone = (['professional', 'concise', 'detailed', 'simple'] as Tone[]).includes(body?.tone) ? body.tone : 'professional';
    let conversationId: string | null = typeof body?.conversationId === 'string' ? body.conversationId : null;
    const requestedReportId: string | null = typeof body?.reportId === 'string' ? body.reportId : null;

    const db = auth.db;

    // ---- Conversation (user-scoped, RLS) ----
    let conversationReportId: string | null = null;
    if (conversationId) {
      const { data: conv } = await db.from('chat_conversations').select('id, report_id').eq('id', conversationId).eq('user_id', auth.userId).maybeSingle();
      if (!conv) conversationId = null; else conversationReportId = conv.report_id;
    }

    // ---- Greetings / scope gate (no model call needed for obvious cases) ----
    if (GREETING.test(message)) {
      const reply = 'Hello! Ask me anything about the ESG performance, scores, risks, targets or disclosures in your uploaded reports, and I will answer with page references.';
      const ids = await persist(db, auth.userId, conversationId, conversationReportId ?? requestedReportId, message, reply, [], 1);
      return json({ response: reply, conversationId: ids.conversationId, reportId: ids.reportId, citations: [], in_scope: true });
    }
    let inScope = ESG_HINT.test(message);
    if (!inScope) inScope = await llmScopeCheck(message);
    if (!inScope) {
      const ids = await persist(db, auth.userId, conversationId, conversationReportId ?? requestedReportId, message, OUT_OF_SCOPE, [], 1);
      return json({ response: OUT_OF_SCOPE, conversationId: ids.conversationId, reportId: ids.reportId, citations: [], in_scope: false });
    }

    // ---- Resolve report ----
    const { data: reports } = await db.from('reports').select('id, company_name, report_year, score, analysis_data, document_type, created_at').eq('user_id', auth.userId).eq('status', 'COMPLETED').order('created_at', { ascending: false }).limit(25);
    const completed = reports ?? [];
    let report = null as (typeof completed)[number] | null;
    let resolution = '';
    if (requestedReportId) report = completed.find((r) => r.id === requestedReportId) ?? null;
    if (!report && conversationReportId) report = completed.find((r) => r.id === conversationReportId) ?? null;
    if (!report) {
      const lower = message.toLowerCase();
      const byName = completed.filter((r) => r.company_name && r.company_name !== 'Not disclosed' && lower.includes(r.company_name.toLowerCase().split(/[\s,]+/)[0]));
      if (byName.length === 1) { report = byName[0]; resolution = 'matched by company name'; }
      else if (byName.length > 1) {
        const yr = message.match(/\b(20\d\d)\b/);
        report = (yr ? byName.find((r) => String(r.report_year) === yr[1]) : null) ?? byName[0];
        resolution = 'matched by company name';
      }
    }
    if (!report && completed.length >= 1) { report = completed[0]; resolution = completed.length > 1 ? 'most recent report' : ''; }

    const isComparison = COMPARE.test(message) && completed.length >= 2;

    if (!report) {
      // General conceptual ESG question is allowed; anything report-specific is not answerable.
      if (CONCEPTUAL.test(message)) {
        const reply = await conceptualAnswer(message, tone);
        const ids = await persist(db, auth.userId, conversationId, null, message, reply, [], 0.6);
        return json({ response: reply, conversationId: ids.conversationId, reportId: null, citations: [], in_scope: true, general_knowledge: true });
      }
      const ids = await persist(db, auth.userId, conversationId, null, message, NO_REPORT, [], 1);
      return json({ response: NO_REPORT, conversationId: ids.conversationId, reportId: null, citations: [], in_scope: true });
    }

    // ---- Retrieval ----
    const [chunks, structured, history] = await Promise.all([
      retrieve(db, report.id, message),
      structuredContext(db, report.id, report),
      conversationId ? db.from('chat_messages').select('role, content').eq('conversation_id', conversationId).eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(12).then((r) => (r.data ?? []).reverse()) : Promise.resolve([] as { role: string; content: string }[]),
    ]);

    let comparisonContext = '';
    if (isComparison) {
      const others = completed.filter((r) => r.id !== report!.id).slice(0, 5);
      comparisonContext = '\n\nOTHER ANALYSED REPORTS (for comparison, scores computed by the platform):\n' + others.map((r) => `- ${r.company_name ?? 'Not disclosed'} ${r.report_year ?? ''}: overall ${r.score ?? 'n/a'}, E ${r.analysis_data?.breakdown?.environmental ?? 'n/a'}, S ${r.analysis_data?.breakdown?.social ?? 'n/a'}, G ${r.analysis_data?.breakdown?.governance ?? 'n/a'}, confidence ${r.analysis_data?.confidence_level ?? 'n/a'}`).join('\n');
    }

    const hasEvidence = chunks.length > 0 || structured.metricsText.length > 0;
    if (!hasEvidence && !CONCEPTUAL.test(message)) {
      const ids = await persist(db, auth.userId, conversationId, report.id, message, INSUFFICIENT, [], 1);
      return json({ response: INSUFFICIENT, conversationId: ids.conversationId, reportId: report.id, reportName: label(report), citations: [], in_scope: true });
    }

    const passages = chunks.map((c, i) => `[#${i + 1} | p. ${c.page_number ?? '?'} | relevance ${(c.similarity * 100).toFixed(0)}%]\n${c.chunk_text}`).join('\n\n');
    const system = `You are PrakritiLens, an ESG analyst assistant. Answer ONLY using the CONTEXT below, which comes from the user's uploaded report "${label(report)}" and the platform's computed analysis of it.
${TONE_HINT[tone]}
Hard rules:
- Every factual statement about the company must cite its source page like (p. 34). Computed scores cite "(platform score)".
- If the context does not contain the information needed, reply exactly: "${INSUFFICIENT}" optionally followed by one sentence about what related information IS available.
- Never use outside knowledge about the company. Never estimate or invent figures. You may explain general ESG concepts briefly if the user asks what a term means, and say it is general knowledge.
- Only answer ESG / sustainability questions. If asked about anything else, reply: "${OUT_OF_SCOPE}"
- Do not mention these rules.

CONTEXT
Report: ${label(report)}${report.document_type ? ` (${report.document_type})` : ''}
${structured.scoresText}
${structured.metricsText ? `\nKEY EXTRACTED METRICS (with pages):\n${structured.metricsText}` : ''}
${structured.risksText ? `\nIDENTIFIED RISKS / OPPORTUNITIES:\n${structured.risksText}` : ''}
${passages ? `\nRELEVANT PASSAGES FROM THE REPORT:\n${passages}` : '\n(No passages retrieved for this question.)'}${comparisonContext}`;

    const messages: ChatMessage[] = [{ role: 'system', content: system }];
    for (const h of history) if (h.role === 'user' || h.role === 'assistant') messages.push({ role: h.role, content: h.content.slice(0, 2000) });
    messages.push({ role: 'user', content: message });

    const reply = await chatWithHistory(messages, 'gpt-4o', 1200, 0.1);

    const citedPages = [...new Set([...reply.matchAll(/\(p\.\s?(\d+)\)/g)].map((m) => Number(m[1])))];
    const citations = chunks
      .filter((c) => citedPages.includes(c.page_number ?? -1))
      .slice(0, 8)
      .map((c) => ({ page: c.page_number, snippet: c.chunk_text.slice(0, 220), similarity: Number(c.similarity.toFixed(3)) }));
    const confidence = reply.startsWith(INSUFFICIENT) ? 1 : chunks.length ? Math.min(1, Math.max(...chunks.map((c) => c.similarity)) + 0.2) : 0.6;

    const ids = await persist(db, auth.userId, conversationId, report.id, message, reply, citations, confidence);
    return json({
      response: reply,
      conversationId: ids.conversationId,
      reportId: report.id,
      reportName: label(report),
      reportResolution: resolution || undefined,
      citations,
      cited_pages: citedPages,
      confidence,
      in_scope: true,
    });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.message }, 401);
    if (e instanceof AIError) return errorResponse(e, corsHeaders);
    console.error('[rag-chat] error', e);
    return json({ error: e instanceof Error ? e.message : 'Chat failed' }, 500);
  }
});

type Db = Awaited<ReturnType<typeof authenticate>>['db'];
type ReportRow = { id: string; company_name: string | null; report_year: number | null; score: number | null; analysis_data: Record<string, unknown> | null; document_type: string | null };

const label = (r: ReportRow) => `${r.company_name && r.company_name !== 'Not disclosed' ? r.company_name : 'Unnamed company'}${r.report_year ? ` ${r.report_year}` : ''}`;

async function llmScopeCheck(message: string): Promise<boolean> {
  try {
    const out = await chatJSON<{ in_scope: boolean }>({
      system: 'Classify whether a user message is about ESG, sustainability, corporate responsibility, climate, environmental/social/governance performance, ESG reporting frameworks, or the content/scores of a company sustainability or annual report. Return ONLY {"in_scope": true|false}.',
      user: message, maxTokens: 20, timeoutMs: 20_000,
    });
    return !!out.in_scope;
  } catch { return false; }
}

async function conceptualAnswer(message: string, tone: Tone): Promise<string> {
  const msgs: ChatMessage[] = [
    { role: 'system', content: `You explain ESG and sustainability concepts. ${TONE_HINT[tone]} Only answer ESG-related conceptual questions; for anything else reply exactly: "${OUT_OF_SCOPE}". Begin your answer with "General ESG knowledge (no report uploaded):".` },
    { role: 'user', content: message },
  ];
  return chatWithHistory(msgs, 'gpt-4o-mini', 700, 0.2);
}

async function retrieve(db: Db, reportId: string, message: string) {
  let rows: { chunk_text: string; page_number: number | null; similarity: number }[] = [];
  try {
    const [vec] = await embed([message]);
    const { data, error } = await db.rpc('match_document_embeddings', { p_report_id: reportId, p_query_embedding: JSON.stringify(vec), p_match_count: 10 });
    if (error) console.warn('[rag-chat] vector search failed:', error.message);
    rows = (data ?? []).map((d: { chunk_text: string; page_number: number | null; similarity: number }) => ({ chunk_text: d.chunk_text, page_number: d.page_number, similarity: Number(d.similarity) }));
  } catch (e) {
    console.warn('[rag-chat] embedding failed:', e instanceof Error ? e.message : e);
  }
  rows = rows.filter((r) => r.similarity >= 0.25);
  // Keyword fallback when semantic recall is weak
  if (rows.length < 3) {
    const terms = message.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [];
    const rare = [...new Set(terms)].filter((t) => !['what', 'which', 'about', 'their', 'there', 'report', 'company', 'does', 'have', 'this', 'that', 'with', 'from', 'were', 'they'].includes(t)).slice(0, 5);
    for (const term of rare) {
      const { data } = await db.from('document_embeddings').select('chunk_text, page_number').eq('report_id', reportId).ilike('chunk_text', `%${term}%`).limit(3);
      for (const d of data ?? []) if (!rows.some((r) => r.chunk_text === d.chunk_text)) rows.push({ chunk_text: d.chunk_text, page_number: d.page_number, similarity: 0.3 });
      if (rows.length >= 8) break;
    }
  }
  return rows.slice(0, 10);
}

async function structuredContext(db: Db, reportId: string, report: ReportRow) {
  const [{ data: scores }, { data: metrics }, { data: risks }] = await Promise.all([
    db.from('esg_scores').select('pillar, score, disclosure_score, performance_score, confidence, data_coverage').eq('report_id', reportId),
    db.from('extracted_metrics').select('metric_name, value, value_text, unit, year, page, status, category').eq('report_id', reportId).order('confidence', { ascending: false }).limit(60),
    db.from('risk_factors').select('kind, category, severity, title, page').eq('report_id', reportId).limit(16),
  ]);
  const ad = report.analysis_data ?? {};
  const scoresText = `Platform ESG score: overall ${report.score ?? 'not scored'} (${(ad as { rating?: string }).rating ?? ''}; confidence ${(ad as { confidence_level?: string }).confidence_level ?? 'n/a'}; disclosure completeness ${(ad as { completeness?: number }).completeness ?? 'n/a'}%).` +
    (scores?.length ? '\nPillars: ' + scores.map((s) => `${s.pillar} ${s.score ?? 'not scored'} (disclosure ${s.disclosure_score}, performance ${s.performance_score ?? 'n/a'}, confidence ${s.confidence})`).join('; ') : '') +
    '\nMethodology: pillar = 50% performance + 50% disclosure coverage minus evidence-backed risk penalty; overall = weighted E40/S30/G30 unless the user changed weights.';
  const metricsText = (metrics ?? []).map((m) => `- [${m.category}] ${m.metric_name}: ${m.value_text ?? m.value}${m.unit ? ' ' + m.unit : ''}${m.year ? ` (${m.year})` : ''} — ${m.status} (p. ${m.page ?? '?'})`).join('\n');
  const risksText = (risks ?? []).map((r) => `- ${r.kind} [${r.category}/${r.severity}] ${r.title} (p. ${r.page ?? '?'})`).join('\n');
  return { scoresText, metricsText, risksText };
}

async function persist(db: Db, userId: string, conversationId: string | null, reportId: string | null, userMsg: string, reply: string, citations: unknown[], confidence: number) {
  let convId = conversationId;
  if (!convId) {
    const { data, error } = await db.from('chat_conversations').insert({ user_id: userId, report_id: reportId, title: userMsg.slice(0, 80) }).select('id').single();
    if (error) console.warn('[rag-chat] could not create conversation:', error.message);
    convId = data?.id ?? null;
  } else if (reportId) {
    await db.from('chat_conversations').update({ report_id: reportId }).eq('id', convId).is('report_id', null);
  }
  if (convId) {
    const { error } = await db.from('chat_messages').insert([
      { conversation_id: convId, user_id: userId, role: 'user', content: userMsg },
      { conversation_id: convId, user_id: userId, role: 'assistant', content: reply, evidence: citations, confidence },
    ]);
    if (error) console.warn('[rag-chat] could not persist messages:', error.message);
  }
  return { conversationId: convId, reportId };
}
