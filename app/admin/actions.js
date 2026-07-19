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
 * Delete all files in a storage bucket for a given user.
 * Files are stored as userId/... so we list by prefix and remove.
 */
async function cleanupUserStorage(adminSb, bucket, userId) {
  try {
    const { data: files, error: listErr } = await adminSb.storage
      .from(bucket)
      .list(String(userId), { limit: 1000 });

    if (listErr || !files || files.length === 0) return;

    const paths = files.map((f) => `${String(userId)}/${f.name}`);
    await adminSb.storage.from(bucket).remove(paths);
  } catch (e) {
    // Best effort — don't block user deletion if storage cleanup fails
  }
}

/**
 * Permanently delete a user and all their data. Admin-only action.
 * 1. Deletes storage files (screenshots + trophies)
 * 2. Calls admin_delete_user_by_email SQL function (DB + auth cleanup)
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

  // Resolve email to user ID for storage cleanup
  const { data: targetUser } = await adminSb.rpc('admin_list_users');
  const match = (targetUser || []).find((u) => u.email === targetEmail);

  if (match) {
    // Clean up storage files before deleting DB rows
    // Ensure userId is a string (RPC returns uuid type which can cause type mismatches)
    const userId = String(match.id);
    await cleanupUserStorage(adminSb, 'screenshots', userId);
    await cleanupUserStorage(adminSb, 'trophies', userId);
  }

  // Delete DB rows + auth user via SQL function
  const { data, error } = await adminSb.rpc('admin_delete_user_by_email', {
    target_email: targetEmail,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { ok: true, message: data };
}
