// OCR for image-only PDF pages. The browser renders the page to PNG and sends it here.
import { authenticate, AuthError, corsHeaders, json } from '../_shared/auth.ts';
import { AIError, errorResponse, ocrImage } from '../_shared/openai.ts';

const MAX_DATA_URL = 6 * 1024 * 1024; // ~4.5MB image

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    await authenticate(req);
    const body = await req.json().catch(() => null);
    const image = body?.image;
    const page = Number(body?.page);
    if (typeof image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(image)) return json({ error: 'Expected { image: data URL (png/jpeg/webp), page }' }, 400);
    if (image.length > MAX_DATA_URL) return json({ error: 'Page image too large for OCR' }, 413);
    const text = await ocrImage(image);
    return json({ page: Number.isFinite(page) ? page : null, text, chars: text.length });
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.message }, 401);
    if (e instanceof AIError) return errorResponse(e, corsHeaders);
    return json({ error: e instanceof Error ? e.message : 'OCR failed' }, 500);
  }
});
