// Thin AI client (Lovable AI Gateway) with explicit error classification. Server-side only.
// Chat/text calls use the gateway Responses API (streamed and consumed server-side);
// embeddings use the gateway embeddings endpoint. The module keeps its historical name so
// every edge function's import path stays unchanged.

export class AIError extends Error {
  constructor(public code: string, message: string, public status = 500, public retryable = false) {
    super(message);
  }
}

const GATEWAY = 'https://ai.gateway.lovable.dev/v1';
export const CHAT_MODEL = 'openai/gpt-6-astra';
export const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

function apiKey(): string {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) throw new AIError('MISSING_API_KEY', 'AI service is not configured (missing LOVABLE_API_KEY).', 500);
  return key;
}

function headers(): Record<string, string> {
  return { 'Lovable-API-Key': apiKey(), 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' };
}

async function classify(res: Response, label: string): Promise<never> {
  const body = await res.text().catch(() => '');
  let msg = body;
  try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? body; } catch { /* keep raw */ }
  msg = String(msg).slice(0, 300);
  if (res.status === 401) throw new AIError('INVALID_API_KEY', 'AI service rejected the API key.', 500);
  if (res.status === 402) throw new AIError('QUOTA_EXCEEDED', msg || 'AI credits are exhausted. Add credits to your Lovable workspace to continue.', 402);
  if (res.status === 403) throw new AIError('AI_BLOCKED', msg || 'AI access is blocked by workspace policy.', 403);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') ?? '0');
    const e = new AIError('RATE_LIMITED', 'AI service is rate limited. Please retry shortly.', 429, true);
    (e as AIError & { retryAfterMs?: number }).retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined;
    throw e;
  }
  if (res.status === 400) throw new AIError('BAD_REQUEST', `AI request rejected (${label}): ${msg}`, 500);
  if (res.status >= 500) throw new AIError('UPSTREAM_ERROR', `AI service error (${res.status}).`, 502, true);
  throw new AIError('AI_ERROR', `AI service returned ${res.status}: ${msg}`, 502);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const retryable = e instanceof AIError ? e.retryable : (e instanceof TypeError); // network errors
      if (!retryable || i === attempts - 1) throw e;
      const hinted = e instanceof AIError ? (e as AIError & { retryAfterMs?: number }).retryAfterMs : undefined;
      await new Promise((r) => setTimeout(r, hinted ?? 800 * 2 ** i + Math.random() * 300));
    }
  }
  throw last;
}

// ---------------------------------------------------------------- Responses API (streamed)

type InputItem = { role: 'user' | 'assistant'; content: string | unknown[] };

interface ResponsesCall {
  instructions?: string;
  input: InputItem[];
  json?: boolean;
  label: string;
}

/** Streams a Responses API call and returns the final output text. Never aborted on a timer. */
async function responses(call: ResponsesCall): Promise<string> {
  return withRetry(async () => {
    const res = await fetch(`${GATEWAY}/responses`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        model: CHAT_MODEL,
        stream: true,
        store: false,
        reasoning: { effort: 'low' },
        ...(call.instructions ? { instructions: call.instructions } : {}),
        input: call.input,
        ...(call.json ? { text: { format: { type: 'json_object' } } } : {}),
      }),
    });
    if (!res.ok || !res.body) await classify(res, call.label);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let finalText: string | null = null;
    let failure: string | null = null;

    const handle = (raw: string) => {
      if (!raw || raw === '[DONE]') return;
      let ev: Record<string, unknown>;
      try { ev = JSON.parse(raw); } catch { return; }
      const type = ev.type as string | undefined;
      if (type === 'response.output_text.delta' && typeof ev.delta === 'string') text += ev.delta;
      else if (type === 'response.completed') {
        const out = (ev.response as { output_text?: string; output?: { type: string; content?: { type: string; text?: string }[] }[] } | undefined);
        if (out?.output_text) finalText = out.output_text;
        else if (Array.isArray(out?.output)) {
          const joined = out.output.filter((o) => o.type === 'message').flatMap((o) => o.content ?? []).filter((c) => c.type === 'output_text').map((c) => c.text ?? '').join('');
          if (joined) finalText = joined;
        }
      } else if (type === 'response.failed' || type === 'response.incomplete' || type === 'error') {
        const err = (ev.response as { error?: { message?: string } } | undefined)?.error ?? (ev.error as { message?: string } | undefined) ?? ev;
        failure = (err as { message?: string })?.message ?? `AI response ${type}`;
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of frame.split('\n')) if (line.startsWith('data:')) handle(line.slice(5).trim());
      }
    }
    if (buffer.trim()) for (const line of buffer.split('\n')) if (line.startsWith('data:')) handle(line.slice(5).trim());

    if (failure) throw new AIError('UPSTREAM_ERROR', `AI service failed: ${String(failure).slice(0, 300)}`, 502, true);
    const content = (finalText ?? text).trim();
    if (!content) throw new AIError('EMPTY_RESPONSE', 'AI returned an empty response.', 502, true);
    return content;
  });
}

// ---------------------------------------------------------------- public API (unchanged signatures)

export interface ChatOptions {
  /** Ignored: every chat call uses CHAT_MODEL. Kept for call-site compatibility. */
  model?: string;
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  /** When true, JSON output mode is used and the reply is parsed */
  json?: boolean;
  timeoutMs?: number;
}

export async function chat(opts: ChatOptions): Promise<string> {
  // json_object mode requires the word "json" to appear in the input messages
  const user = opts.json && !/json/i.test(opts.user) ? `${opts.user}\n\nRespond with JSON only.` : opts.user;
  return responses({ instructions: opts.system, input: [{ role: 'user', content: user }], json: !!opts.json, label: 'chat' });
}

export async function chatJSON<T = unknown>(opts: Omit<ChatOptions, 'json'>): Promise<T> {
  const raw = await chat({ ...opts, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // salvage a JSON object embedded in prose / code fences
    const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(raw.slice(start, end + 1)) as T; } catch { /* fallthrough */ }
    }
    throw new AIError('MALFORMED_RESPONSE', 'AI returned malformed JSON.', 502, true);
  }
}

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function chatWithHistory(messages: ChatMessage[], _model = CHAT_MODEL, _maxTokens = 1200, _temperature = 0.2): Promise<string> {
  const instructions = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n') || undefined;
  const input: InputItem[] = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  if (input.length === 0) throw new AIError('BAD_REQUEST', 'No conversation messages to send.', 400);
  return responses({ instructions, input, label: 'chat' });
}

/** Embeddings sized to the existing vector(384) column */
export async function embed(texts: string[], dimensions = 384): Promise<number[][]> {
  if (texts.length === 0) return [];
  return withRetry(async () => {
    const res = await fetch(`${GATEWAY}/embeddings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts, dimensions }),
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
  const content = await responses({
    instructions: 'You are an OCR engine. Transcribe ALL text visible in the image exactly as written, preserving numbers, units, table rows (one row per line, cells separated by " | ") and headings. Output plain text only. If the image contains no readable text, output exactly: [NO_TEXT]',
    input: [{ role: 'user', content: [{ type: 'input_text', text: 'Transcribe this page.' }, { type: 'input_image', image_url: dataUrl, detail: 'high' }] }],
    label: 'ocr',
  }).catch((e) => {
    if (e instanceof AIError && e.code === 'EMPTY_RESPONSE') return '[NO_TEXT]';
    throw e;
  });
  return content.trim() === '[NO_TEXT]' ? '' : content;
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
