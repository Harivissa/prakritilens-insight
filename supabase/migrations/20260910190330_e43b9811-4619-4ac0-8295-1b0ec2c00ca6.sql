-- Extend reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quality jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.reports ALTER COLUMN score DROP NOT NULL;

-- Analysis runs
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'UPLOADING',
  stage text,
  progress integer NOT NULL DEFAULT 0,
  error text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analysis_runs TO authenticated;
GRANT ALL ON public.analysis_runs TO service_role;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analysis runs" ON public.analysis_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS analysis_runs_report_idx ON public.analysis_runs(report_id);

-- Report documents
CREATE TABLE IF NOT EXISTS public.report_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  page_count integer,
  extraction_method text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_documents TO authenticated;
GRANT ALL ON public.report_documents TO service_role;
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own report documents" ON public.report_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS report_documents_report_idx ON public.report_documents(report_id);

-- Document pages
CREATE TABLE IF NOT EXISTS public.document_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  page_number integer NOT NULL,
  text text NOT NULL,
  char_count integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, page_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_pages TO authenticated;
GRANT ALL ON public.document_pages TO service_role;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own document pages" ON public.document_pages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS document_pages_report_idx ON public.document_pages(report_id, page_number);

-- Extracted metrics
CREATE TABLE IF NOT EXISTS public.extracted_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL,
  metric_key text NOT NULL,
  metric_name text NOT NULL,
  value numeric,
  value_text text,
  unit text,
  year integer,
  page integer,
  evidence text,
  status text NOT NULL DEFAULT 'REPORTED',
  confidence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extracted_metrics TO authenticated;
GRANT ALL ON public.extracted_metrics TO service_role;
ALTER TABLE public.extracted_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own extracted metrics" ON public.extracted_metrics FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS extracted_metrics_report_idx ON public.extracted_metrics(report_id);

-- ESG scores
CREATE TABLE IF NOT EXISTS public.esg_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pillar text NOT NULL,
  score numeric,
  disclosure_score numeric,
  performance_score numeric,
  indicators_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  positive_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  negative_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text,
  data_coverage numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, pillar)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.esg_scores TO authenticated;
GRANT ALL ON public.esg_scores TO service_role;
ALTER TABLE public.esg_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own esg scores" ON public.esg_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Risks and opportunities
CREATE TABLE IF NOT EXISTS public.risk_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'risk',
  category text NOT NULL,
  severity text,
  title text NOT NULL,
  description text,
  evidence text,
  page integer,
  confidence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_factors TO authenticated;
GRANT ALL ON public.risk_factors TO service_role;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own risk factors" ON public.risk_factors FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS risk_factors_report_idx ON public.risk_factors(report_id);

-- Evidence
CREATE TABLE IF NOT EXISTS public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  claim text NOT NULL,
  page integer,
  snippet text,
  category text,
  metric_key text,
  confidence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
GRANT ALL ON public.evidence TO service_role;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own evidence" ON public.evidence FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS evidence_report_idx ON public.evidence(report_id);

-- Chat conversations: make sure messages cascade with conversations
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_conversation_id_fkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations, public.chat_messages, public.document_embeddings, public.reports TO authenticated;
GRANT ALL ON public.chat_conversations, public.chat_messages, public.document_embeddings, public.reports TO service_role;

-- Vector similarity search scoped to the caller's own report
CREATE OR REPLACE FUNCTION public.match_document_embeddings(
  p_report_id uuid,
  p_query_embedding vector(384),
  p_match_count integer DEFAULT 8
)
RETURNS TABLE (id uuid, chunk_text text, page_number integer, chunk_index integer, similarity double precision)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT e.id, e.chunk_text, e.page_number, e.chunk_index,
         1 - (e.embedding <=> p_query_embedding) AS similarity
  FROM public.document_embeddings e
  WHERE e.report_id = p_report_id
    AND e.user_id = auth.uid()
    AND e.embedding IS NOT NULL
  ORDER BY e.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
GRANT EXECUTE ON FUNCTION public.match_document_embeddings(uuid, vector, integer) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx ON public.document_embeddings USING hnsw (embedding vector_cosine_ops);