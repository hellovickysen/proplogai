"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function generateCode() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function generateShareCode() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  // Check if already has a code
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('share_code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefs && prefs.share_code) {
    return { ok: true, share_code: prefs.share_code };
  }

  const code = generateCode();
  const { error } = await supabase
    .from('user_preferences')
    .update({ share_code: code })
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings');
  return { ok: true, share_code: code };
}

export async function updateProfileSettings(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const updates = {};
  if (payload.show_calendar !== undefined) updates.show_calendar = !!payload.show_calendar;
  if (payload.show_payouts !== undefined) updates.show_payouts = !!payload.show_payouts;
  if (payload.show_trophies !== undefined) updates.show_trophies = !!payload.show_trophies;
  if (payload.calendar_mode !== undefined) {
    updates.calendar_mode = payload.calendar_mode === 'fixed' ? 'fixed' : 'rolling';
  }
  if (payload.calendar_start !== undefined) updates.calendar_start = payload.calendar_start || null;
  if (payload.calendar_end !== undefined) updates.calendar_end = payload.calendar_end || null;
  if (payload.calendar_rolling_days !== undefined) {
    const days = Number(payload.calendar_rolling_days);
    updates.calendar_rolling_days = [30, 60, 90].includes(days) ? days : 30;
  }

  const { error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings');
  return { ok: true };
}
