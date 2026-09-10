// Request authentication helper for edge functions.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface AuthContext {
  userId: string;
  /** Client acting as the caller (RLS enforced) */
  db: SupabaseClient;
  /** Service-role client for privileged writes (still scoped by user_id in code) */
  admin: SupabaseClient;
}

export class AuthError extends Error {
  status = 401;
}

export async function authenticate(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new AuthError('Missing authorization token');

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const db = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) throw new AuthError('Invalid or expired session');

  const admin = createClient(url, service, { auth: { persistSession: false } });
  return { userId: data.user.id, db, admin };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
