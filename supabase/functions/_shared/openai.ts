// Thin OpenAI client with explicit error classification. Server-side only.

export class AIError extends Error {
  constructor(public code: string, message: string, public status = 500, public retryable = false) {
    super(message);
  }
}

const BASE = 'https://api.openai.com/v1';

function apiKey(): string {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new AIError('MISSING_API_KEY', 'AI service is not configured (missing API key).', 500);
  return key;
}

async function classify(res: Response, label: string): Promise<never> {
  const body = await res.text().catch(() => '');
  let msg = body;
  try { msg = JSON.parse(body)?.error?.message ?? body; } catch { /* keep raw */ }
  if (res.status === 401) throw new AIError('INVALID_API_KEY', 'AI service rejected the API key.', 500);
  if (res.status === 429) {
    const quota = /quota|billing/i.test(msg);
    throw new AIError(quota ? 'QUOTA_EXCEEDED' : 'RATE_LIMITED', quota ? 'AI service quota exceeded.' : 'AI service is rate limited. Please retry shortly.', 429, !quota);
  }
  if (res.status === 400) throw new AIError('BAD_REQUEST', `AI request rejected (${label}): ${msg.slice(0, 300)}`, 500);
  if (res.status >= 500) throw new AIError('UPSTREAM_ERROR', `AI service error (${res.status}).`, 502, true);
  throw new AIError('AI_ERROR', `AI service returned ${res.status}: ${msg.slice(0, 300)}`, 502);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const retryable = e instanceof AIError ? e.retryable : (e instanceof TypeError); // network errors
      if (!retryable || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 800 * 2 ** i + Math.random() * 300));
    }
  }
  throw last;
}

export interface ChatOptions {
  model?: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** When true, response_format json_object is used and the reply is parsed */
  json?: boolean;
  timeoutMs?: number;
}

export async function chat(opts: ChatOptions): Promise<string> {
  const key = apiKey();
  return withRetry(async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 110_000);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: opts.model ?? 'gpt-4o-mini',
          temperature: opts.temperature ?? 0,
          max_tokens: opts.maxTokens ?? 4000,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
          messages: [
            { role: 'system', content: opts.system },
            { role: 'user', content: opts.user },
          ],
        }),
      });
      if (!res.ok) await classify(res, 'chat');
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new AIError('EMPTY_RESPONSE', 'AI returned an empty response.', 502, true);
      return content;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw new AIError('TIMEOUT', 'AI request timed out.', 504, true);
      throw e;
    } finally { clearTimeout(t); }
  });
}

export async function chatJSON<T = unknown>(opts: Omit<ChatOptions, 'json'>): Promise<T> {
  const raw = await chat({ ...opts, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // salvage a JSON object embedded in prose
    const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(raw.slice(start, end + 1)) as T; } catch { /* fallthrough */ }
    }
    throw new AIError('MALFORMED_RESPONSE', 'AI returned malformed JSON.', 502, true);
  }
}

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function chatWithHistory(messages: ChatMessage[], model = 'gpt-4o-mini', maxTokens = 1200, temperature = 0.2): Promise<string> {
  const key = apiKey();
  return withRetry(async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages }),
      });
      if (!res.ok) await classify(res, 'chat');
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) throw new AIError('EMPTY_RESPONSE', 'AI returned an empty response.', 502, true);
      return content;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw new AIError('TIMEOUT', 'AI request timed out.', 504, true);
      throw e;
    } finally { clearTimeout(t); }
  });
}

/** Embeddings sized to the existing vector(384) column */
export async function embed(texts: string[], dimensions = 384): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = apiKey();
  return withRetry(async () => {
    const res = await fetch(`${BASE}/embeddings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: texts, dimensions }),
    });
    if (!res.ok) await classify(res, 'embeddings');
    const data = await res.json();
    const list = data?.data;
    if (!Array.isArray(list) || list.length !== texts.length) throw new AIError('MALFORMED_RESPONSE', 'Embedding response malformed.', 502, true);
    return list.sort((a: { index: number }, b: { index: number }) => a.index - b.index).map((d: { embedding: number[] }) => d.embedding);
  });
}

/** Vision OCR of a page image (PNG/JPEG data URL). Returns plain text only. */
export async function ocrImage(dataUrl: string): Promise<string> {
  const key = apiKey();
  return withRetry(async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 3000,
          messages: [
            { role: 'system', content: 'You are an OCR engine. Transcribe ALL text visible in the image exactly as written, preserving numbers, units, table rows (one row per line, cells separated by " | ") and headings. Output plain text only. If the image contains no readable text, output exactly: [NO_TEXT]' },
            { role: 'user', content: [{ type: 'image_url', image_url: { url: dataUrl, detail: 'high' } }] },
          ],
        }),
      });
      if (!res.ok) await classify(res, 'ocr');
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new AIError('EMPTY_RESPONSE', 'OCR returned no content.', 502, true);
      return content.trim() === '[NO_TEXT]' ? '' : content;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw new AIError('TIMEOUT', 'OCR request timed out.', 504, true);
      throw e;
    } finally { clearTimeout(t); }
  });
}

export function errorResponse(e: unknown, corsHeaders: Record<string, string>): Response {
  const isAI = e instanceof AIError;
  const status = isAI ? (e.status >= 400 ? e.status : 500) : 500;
  const body = {
    error: e instanceof Error ? e.message : 'Unexpected error',
    code: isAI ? e.code : 'INTERNAL_ERROR',
  };
  console.error('[edge-error]', body.code, body.error);
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
