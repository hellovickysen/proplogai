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
    return null;
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdminConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Admin email — set via ADMIN_EMAIL env var in Vercel dashboard */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
