"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: existing } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const row = {
    user_id: user.id,
    onboarding_complete: true,
    custom_emotions: Array.isArray(payload.custom_emotions) ? payload.custom_emotions : [],
    default_confidence: Number(payload.default_confidence) || 0,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existing) {
    delete row.user_id;
    const res = await supabase.from('user_preferences').update(row).eq('id', existing.id);
    error = res.error;
  } else {
    const res = await supabase.from('user_preferences').insert(row);
    error = res.error;
  }
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { ok: true };
}
