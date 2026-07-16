"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validatePassword } from '@/lib/security';
import { getUserAccess } from '@/lib/plans';

async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function changePassword(newPassword) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (!newPassword) return { error: 'Password is required.' };
  if (newPassword.length > 128) return { error: 'Password is too long.' };
  const validation = validatePassword(newPassword);
  if (!validation.isValid) return { error: 'Password does not meet strength requirements. Need 8+ characters with uppercase, lowercase, number, and special character.' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function getPreferences() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  const { data } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return { prefs: data || null };
}

export async function savePreferences(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Get plan access to determine limits
  const access = await getUserAccess(supabase, user);
  const tagLimit = access.limit('custom_tags');
  const emotionLimit = access.limit('custom_emotions');

  // Validate avatar_url
  const avatarUrl = payload.avatar_url || null;
  if (avatarUrl && typeof avatarUrl === 'string' && !avatarUrl.startsWith('http')) {
    return { error: 'Invalid avatar URL.' };
  }

  // Validate full_name
  const fullName = (typeof payload.full_name === 'string') ? payload.full_name.trim().slice(0, 100) : undefined;

  const row = {
    user_id: user.id,
    custom_emotions: Array.isArray(payload.custom_emotions)
      ? payload.custom_emotions.filter(e => typeof e === 'string' && e.length > 0).map(e => e.trim().slice(0, 50)).slice(0, emotionLimit === Infinity ? undefined : emotionLimit)
      : [],
    custom_setups: Array.isArray(payload.custom_setups)
      ? payload.custom_setups.filter(e => typeof e === 'string' && e.length > 0).map(e => e.trim().slice(0, 100)).slice(0, 50)
      : [],
    custom_tags: Array.isArray(payload.custom_tags)
      ? payload.custom_tags.filter(e => typeof e === 'string' && e.length > 0).map(e => e.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 50)).slice(0, tagLimit === Infinity ? undefined : tagLimit)
      : [],
    default_confidence: Number(payload.default_confidence) || 0,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  // Only include full_name if explicitly provided in payload
  if (fullName !== undefined) {
    row.full_name = fullName || null;
  }

  const { data: existing } = await supabase
    .from('user_preferences')
    .select('id, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();

  let error;
  if (existing) {
    // Clean up old avatar from storage if being replaced (best effort)
    if (existing.avatar_url && avatarUrl && existing.avatar_url !== avatarUrl) {
      const oldPath = existing.avatar_url.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    delete row.user_id;
    const res = await supabase.from('user_preferences').update(row).eq('id', existing.id).eq('user_id', user.id);
    error = res.error;
  } else {
    const res = await supabase.from('user_preferences').insert(row);
    error = res.error;
  }
  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings');
  return { ok: true };
}
