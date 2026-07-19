"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Ban a user with a reason. Admin-only action.
 * Sets banned_until to a far-future date and stores the reason in user_metadata.
 */
export async function banUser(userId, reason) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: 'Unauthorized.' };
  }

  const adminSb = createAdminClient();
  if (!adminSb) return { error: 'Admin client not configured.' };

  const { error } = await adminSb.auth.admin.updateUserById(userId, {
    ban_duration: '876600h',
    user_metadata: { ban_reason: reason },
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true };
}

/**
 * Unban a user. Admin-only action.
 * Clears banned_until and removes the ban reason.
 */
export async function unbanUser(userId) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: 'Unauthorized.' };
  }

  const adminSb = createAdminClient();
  if (!adminSb) return { error: 'Admin client not configured.' };

  const { error } = await adminSb.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
    user_metadata: { ban_reason: null },
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true };
}

/**
 * Permanently delete a user and all their data. Admin-only action.
 * Calls the admin_delete_user_by_email SQL function in Supabase.
 */
export async function deleteUser(targetEmail) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return { error: 'Unauthorized.' };
  }

  if (targetEmail === ADMIN_EMAIL) {
    return { error: 'Cannot delete admin account.' };
  }

  const adminSb = createAdminClient();
  if (!adminSb) return { error: 'Admin client not configured.' };

  const { data, error } = await adminSb.rpc('admin_delete_user_by_email', {
    target_email: targetEmail,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true, message: data };
}
