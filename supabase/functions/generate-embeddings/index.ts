// Builds the retrieval index for a report from its stored pages (real page numbers).
import { authenticate, AuthError, corsHeaders, json } from '../_shared/auth.ts';
import { AIError, embed, errorResponse } from '../_shared/openai.ts';

const CHUNK_CHARS = 900;
const OVERLAP = 120;
const MAX_CHUNKS = 2000;

function chunkPage(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= CHUNK_CHARS) return clean ? [clean] : [];
  const out: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_CHARS, clean.length);
    if (end < clean.length) {
      const cut = clean.lastIndexOf('. ', end);
      if (cut > start + CHUNK_CHARS * 0.5) end = cut + 1;
    }
    out.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - OVERLAP, start + 1);
  }
  return out.filter((c) => c.length > 40);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authenticate(req);
    const body = await req.json().catch(() => null);
    if (!body || typeof body.reportId !== 'string') return json({ error: 'Expected { reportId }' }, 400);
    const reportId: string = body.reportId;

    const { data: report } = await auth.admin.from('reports').select('id, user_id').eq('id', reportId).single();
    if (!report) return json({ error: 'Report not found' }, 404);
    if (report.user_id !== auth.userId) return json({ error: 'Forbidden' }, 403);

    // Load pages
    const pages: { page_number: number; text: string }[] = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await auth.admin.from('document_pages').select('page_number, text').eq('report_id', reportId).order('page_number').range(from, from + 499);
      if (error) throw new Error(error.message);
      pages.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    if (pages.length === 0) return json({ error: 'No pages stored for this report' }, 400);

    const chunks: { text: string; page: number; index: number }[] = [];
    let idx = 0;
    for (const p of pages) {
      for (const c of chunkPage(p.text ?? '')) {
        chunks.push({ text: c, page: p.page_number, index: idx++ });
        if (chunks.length >= MAX_CHUNKS) break;
      }
      if (chunks.length >= MAX_CHUNKS) break;
    }
    if (chunks.length === 0) return json({ error: 'No text chunks could be built from the stored pages' }, 400);

    await auth.admin.from('document_embeddings').delete().eq('report_id', reportId);

    let stored = 0;
    for (let i = 0; i < chunks.length; i += 100) {
      const batch = chunks.slice(i, i + 100);
      const vectors = await embed(batch.map((b) => b.text));
      const rows = batch.map((b, j) => ({
        report_id: reportId,
        user_id: auth.userId,
        chunk_text: b.text,
        chunk_index: b.index,
        page_number: b.page,
        embedding: JSON.stringify(vectors[j]),
        metadata: { chars: b.text.length, model: 'openai/text-embedding-3-small', dims: 384 },
      }));
      const { error } = await auth.admin.from('document_embeddings').insert(rows);
      if (error) throw new Error(`Failed to store embeddings: ${error.message}`);
      stored += rows.length;
    }
    console.log(`[embeddings] report=${reportId} pages=${pages.length} chunks=${stored}`);
    return json({ reportId, pages: pages.length, chunks: stored });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.message }, 401);
    if (e instanceof AIError) return errorResponse(e, corsHeaders);
    console.error('[embeddings] error', e);
    return json({ error: e instanceof Error ? e.message : 'Embedding generation failed' }, 500);
  }
});
