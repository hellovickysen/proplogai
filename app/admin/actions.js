"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Toggle beta access for a user. Admin-only action.
 */
export async function toggleBeta(userId, newValue) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: 'Unauthorized.' };
  }

  const adminSb = createAdminClient();
  if (!adminSb) return { error: 'Admin client not configured.' };

  const { error } = await adminSb
    .from('user_preferences')
    .update({ is_beta: !!newValue })
    .eq('user_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true };
}
