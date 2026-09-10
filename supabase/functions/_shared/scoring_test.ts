// Deterministic scoring engine tests: scores come only from evidence-backed metrics.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeScores, computeTrends, forecast, type ExtractedMetric, type RiskItem } from "./scoring.ts";

const m = (partial: Partial<ExtractedMetric> & Pick<ExtractedMetric, "category" | "metric_key" | "value">): ExtractedMetric => ({
  metric_name: partial.metric_key,
  value_text: null,
  unit: null,
  year: 2023,
  page: 2,
  evidence: "snippet",
  status: "REPORTED",
  confidence: 0.9,
  verified: true,
  ...partial,
});

Deno.test("no metrics → no scores (null), not fabricated numbers", () => {
  const r = computeScores([], []);
  assertEquals(r.overall, null);
  assertEquals(r.pillars.environmental.score, null);
  assertEquals(r.pillars.social.score, null);
  assertEquals(r.pillars.governance.score, null);
  assertEquals(r.completeness, 0);
  assertEquals(r.confidence, "Low");
});

Deno.test("scores are deterministic and weighted E40/S30/G30 by default", () => {
  const metrics: ExtractedMetric[] = [
    m({ category: "environmental", metric_key: "renewable_energy_pct", value: 80, unit: "%" }),
    m({ category: "environmental", metric_key: "emissions_reduction_pct", value: 25, unit: "%" }),
    m({ category: "social", metric_key: "ltifr", value: 0.3 }),
    m({ category: "social", metric_key: "women_workforce_pct", value: 45, unit: "%" }),
    m({ category: "governance", metric_key: "independent_directors_pct", value: 70, unit: "%" }),
  ];
  const a = computeScores(metrics, []);
  const b = computeScores(metrics, []);
  assertEquals(JSON.stringify(a), JSON.stringify(b));
  assertEquals(a.weights.environmental, 0.4);
  assertEquals(a.weights.social, 0.3);
  assertEquals(a.weights.governance, 0.3);
  assert(a.overall !== null && a.overall > 0 && a.overall <= 100);
  for (const p of ["environmental", "social", "governance"] as const) {
    assert(a.pillars[p].score !== null, `${p} scored`);
    assert(a.pillars[p].indicators_used.length > 0);
    assert(a.pillars[p].evidence.every((e) => e.page !== null), "every score factor carries a page");
  }
});

Deno.test("user-adjusted weights change the overall score but not pillar scores", () => {
  const metrics: ExtractedMetric[] = [
    m({ category: "environmental", metric_key: "renewable_energy_pct", value: 90, unit: "%" }),
    m({ category: "social", metric_key: "ltifr", value: 6 }),
    m({ category: "governance", metric_key: "independent_directors_pct", value: 40, unit: "%" }),
  ];
  const base = computeScores(metrics, []);
  const envHeavy = computeScores(metrics, [], { environmental: 80, social: 10, governance: 10 });
  assertEquals(base.pillars.environmental.score, envHeavy.pillars.environmental.score);
  assert((envHeavy.overall ?? 0) > (base.overall ?? 0));
});

Deno.test("high-severity risks reduce the pillar score", () => {
  const metrics: ExtractedMetric[] = [m({ category: "governance", metric_key: "independent_directors_pct", value: 70, unit: "%" })];
  const risk: RiskItem = { kind: "risk", category: "governance", severity: "high", title: "Regulatory investigation", description: "", evidence: "snippet", page: 4, confidence: 0.9 };
  const clean = computeScores(metrics, []);
  const risky = computeScores(metrics, [risk]);
  assert((risky.pillars.governance.score ?? 0) < (clean.pillars.governance.score ?? 0));
  assert(risky.risk_score > clean.risk_score);
});

Deno.test("historical trends and forecasts derive only from multi-year metrics", () => {
  const metrics: ExtractedMetric[] = [
    m({ category: "environmental", metric_key: "scope1_emissions", value: 100, year: 2021 }),
    m({ category: "environmental", metric_key: "scope1_emissions", value: 90, year: 2022 }),
    m({ category: "environmental", metric_key: "scope1_emissions", value: 80, year: 2023 }),
    m({ category: "social", metric_key: "ltifr", value: 1.0, year: 2023 }),
  ];
  const trends = computeTrends(metrics);
  const scope1 = trends.find((t) => t.metric_key === "scope1_emissions");
  assert(scope1, "scope1 trend present");
  assert(!trends.find((t) => t.metric_key === "ltifr"), "single-year metric has no trend");
  const f = forecast(scope1!.series, 2);
  assert(f, "forecast available with 3 data points");
  assertEquals(f!.status, "ESTIMATED");
  assertEquals(f!.points.length, 2);
  assert(f!.points[0].year === 2024 && f!.points[0].value < 80, "linear projection continues the decline");
  assertEquals(forecast(scope1!.series.slice(0, 2), 2), null, "no forecast from fewer than 3 points");
});
