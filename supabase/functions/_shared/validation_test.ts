// Deterministic tests for the document gatekeeper (no network, no AI).
// Fixtures are real page text: `apple_pages.json` is extracted from Apple's public
// 2024 Environmental Progress Report (first 12 pages); the others are generated PDFs.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { classifyDocument, snippetOnPage, findValuePage, type PageText } from "./validation.ts";

const load = (name: string): PageText[] =>
  JSON.parse(Deno.readTextFileSync(new URL(`./fixtures/${name}`, import.meta.url)));

Deno.test("real ESG report (Apple EPR 2024) is accepted as VALID", () => {
  const r = classifyDocument(load("apple_pages.json"));
  assertEquals(r.classification, "VALID");
  assert(r.score >= 70, `score ${r.score}`);
  assert(r.signals.frameworks.length > 0, "frameworks detected");
  assert(r.candidate_company_names.some((n) => /apple/i.test(n)), `company candidates: ${r.candidate_company_names}`);
  assert(r.candidate_years.includes(2024) || r.candidate_years.includes(2023), `years: ${r.candidate_years}`);
});

Deno.test("unrelated document (recipes) is rejected as INVALID with reasons", () => {
  const r = classifyDocument(load("recipes_pages.json"));
  assertEquals(r.classification, "INVALID");
  assert(r.reasons.length > 0);
  assertEquals(r.signals.frameworks.length, 0);
});

Deno.test("annual report with an ESG section is accepted (VALID or PARTIAL), never INVALID", () => {
  const r = classifyDocument(load("annual_pages.json"));
  assert(r.classification !== "INVALID", `got ${r.classification}: ${r.reasons.join("; ")}`);
  assert(/annual/i.test(r.document_type), `document_type ${r.document_type}`);
  assert(r.signals.frameworks.includes("GRI") && r.signals.frameworks.includes("TCFD"));
  assert(r.candidate_years.includes(2023));
});

Deno.test("empty extraction (blank pages) is INVALID and explains why", () => {
  const r = classifyDocument(load("blank_pages.json"));
  assertEquals(r.classification, "INVALID");
  assert(r.reasons.some((x) => /text|empty|scanned|extract/i.test(x)), r.reasons.join("; "));
});

Deno.test("evidence helpers verify snippets and locate values on real pages", () => {
  const pages = load("annual_pages.json");
  const p2 = pages.find((p) => p.page === 2)!;
  assert(snippetOnPage("Scope 1 emissions were 182,400 tCO2e", p2.text));
  assert(!snippetOnPage("Scope 1 emissions were 999,999 tCO2e", p2.text));
  assertEquals(findValuePage("182,400", pages, "scope 1"), 2);
  assertEquals(findValuePage("0.62", pages, "LTIFR"), 3);
  assertEquals(findValuePage("123456789", pages), null);
});
