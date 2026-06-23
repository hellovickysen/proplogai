"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: 'Unauthorized.' };
  }
  return { user };
}

export async function banUser(userId) {
  const auth = await verifyAdmin();
  if (auth.error) return auth;

  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client unavailable.' };

  // Ban for 100 years (effectively permanent)
  const { error } = await sb.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
  });
  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true };
}

export async function unbanUser(userId) {
  const auth = await verifyAdmin();
  if (auth.error) return auth;

  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client unavailable.' };

  const { error } = await sb.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  });
  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true };
}
