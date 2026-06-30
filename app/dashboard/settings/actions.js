"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validatePassword } from '@/lib/security';

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

  const row = {
    user_id: user.id,
    custom_emotions: Array.isArray(payload.custom_emotions) ? payload.custom_emotions : [],
    custom_setups: Array.isArray(payload.custom_setups) ? payload.custom_setups : [],
    default_confidence: Number(payload.default_confidence) || 0,
    avatar_url: payload.avatar_url || null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let error;
  if (existing) {
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
