# PrakritiLens core functionality rebuild

Constraint: no UI redesign. Only logic, backend, DB, AI, tests.

## Findings (what is broken)
- PDF extraction is regex over raw bytes (no stream decoding) -> garbage/empty text, fake page markers, first 3-5MB only.
- Validation auto-accepts on raw keyword count; semantic falls back to 50 on API failure.
- Scores come straight from an LLM prompt (not computed); analysis runs entirely client-side; storage upload happens after analysis with fake progress timers.
- Embeddings are generated under a random UUID never linked to the saved report -> RAG has no data.
- Live chat (ContextAwareChat -> useChats -> ai-assistant) has no report context, no history.
- No analysis_runs / metrics / scores / risks / evidence tables; no vector similarity RPC.

## Tasks
- [x] Inspect codebase, schema, RLS, functions
- [ ] Migration: analysis_runs, report_documents, document_pages, extracted_metrics, esg_scores, risk_factors, evidence, match_document_embeddings RPC, reports columns, grants, RLS
- [ ] Client extraction lib (pdfjs page-by-page, mammoth DOCX, TXT/CSV, password/empty/scanned detection, OCR attempt)
- [ ] Edge: validate-document rewrite (multi-signal classifier, VALID/PARTIAL/INVALID, metadata)
- [ ] Edge: analyze-esg (metric extraction w/ evidence verification, deterministic scoring, risks/opps, frameworks, trends, quality, persistence)
- [ ] Edge: generate-embeddings from stored pages (real page numbers)
- [ ] Edge: rag-chat rewrite (scope, report resolution, vector retrieval, history, citations, no-hallucination)
- [ ] Edge: ocr-page (OpenAI vision) and compare-reports
- [ ] Remove structured-esg-analysis, extract-pdf-text, ai-assistant (duplicates)
- [ ] Hooks: useDocumentUpload pipeline w/ real statuses; useESGScoring wrapper; useChats -> rag-chat; useReports delete cascade
- [ ] ProfessionalFileUpload: wire real statuses (no fake timers), keep JSX
- [ ] Dashboard modal: remove Math.random fallbacks
- [ ] Tests: deno unit tests (validation, scoring) + Playwright e2e with real PDFs (valid report, random PDF, empty/scanned)
- [ ] Deploy functions, run tests, fix errors

## Added 2026-09-11
- [x] Switch backend AI helpers (chat/JSON/history/embeddings/OCR) from OpenAI direct to Lovable AI Gateway (OpenAI balance exhausted)
- [ ] Rerun Apple pipeline walk-through: validation → extraction → scores → risks → chat with evidence
- [ ] Scanned-PDF mode: detect image-only pages, OCR them, retry extraction (re-render at higher scale) until text is readable, surface status in upload UI
