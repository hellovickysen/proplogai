import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client — uses the service role key to bypass RLS.
 * ONLY use in server components/actions within /admin routes.
 * Never import this in client components or non-admin routes.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it to Vercel env vars (server-only, no NEXT_PUBLIC_ prefix).');
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Hardcoded admin email — the only user allowed to access /admin */
export const ADMIN_EMAIL = 'vickysen126@gmail.com';
