// Side-by-side comparison of completed reports owned by the caller.
import { authenticate, AuthError, corsHeaders, json } from '../_shared/auth.ts';

const COMMON_KEYS = ['scope1_emissions', 'scope2_emissions', 'scope3_emissions', 'total_ghg_emissions', 'renewable_energy_pct', 'water_withdrawal', 'total_waste', 'waste_diverted_pct', 'total_employees', 'women_workforce_pct', 'women_management_pct', 'ltifr', 'fatalities', 'training_hours_per_employee', 'employee_turnover_pct', 'independent_directors_pct', 'women_board_pct', 'net_zero_target_year'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    const body = await req.json().catch(() => null);
    const ids: string[] = Array.isArray(body?.reportIds) ? body.reportIds.filter((x: unknown) => typeof x === 'string').slice(0, 6) : [];
    if (ids.length < 2) return json({ error: 'Provide at least two reportIds' }, 400);

    const { data: reports, error } = await auth.db.from('reports').select('id, company_name, report_year, score, analysis_data, status, document_type').in('id', ids).eq('user_id', auth.userId);
    if (error) throw new Error(error.message);
    const done = (reports ?? []).filter((r) => r.status === 'COMPLETED' && r.score !== null);
    if (done.length < 2) return json({ error: 'At least two completed analyses are required' }, 400);

    const { data: metrics } = await auth.db.from('extracted_metrics').select('report_id, metric_key, metric_name, value, unit, year, page, status').in('report_id', done.map((r) => r.id)).in('metric_key', COMMON_KEYS);

    const items = done.map((r) => {
      const own = (metrics ?? []).filter((m) => m.report_id === r.id);
      const latest: Record<string, typeof own[number]> = {};
      for (const m of own) { const cur = latest[m.metric_key]; if (!cur || (m.year ?? 0) > (cur.year ?? 0)) latest[m.metric_key] = m; }
      return {
        report_id: r.id,
        company_name: r.company_name,
        report_year: r.report_year,
        document_type: r.document_type,
        overall: Number(r.score),
        rating: r.analysis_data?.rating ?? null,
        breakdown: r.analysis_data?.breakdown ?? null,
        confidence: r.analysis_data?.confidence_level ?? null,
        completeness: r.analysis_data?.completeness ?? null,
        metrics: latest,
      };
    });
    const base = items[0];
    const comparison = items.map((it) => ({
      ...it,
      delta_vs_first: it.report_id === base.report_id ? null : {
        overall: round(it.overall - base.overall),
        environmental: delta(it.breakdown?.environmental, base.breakdown?.environmental),
        social: delta(it.breakdown?.social, base.breakdown?.social),
        governance: delta(it.breakdown?.governance, base.breakdown?.governance),
      },
    }));
    const sharedMetrics = COMMON_KEYS.filter((k) => items.filter((i) => i.metrics[k]).length >= 2);
    return json({ reports: comparison, shared_metric_keys: sharedMetrics, generated_at: new Date().toISOString() });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.message }, 401);
    return json({ error: e instanceof Error ? e.message : 'Comparison failed' }, 500);
  }
});

const round = (n: number) => Math.round(n * 10) / 10;
const delta = (a: unknown, b: unknown) => (typeof a === 'number' && typeof b === 'number' ? round(a - b) : null);
