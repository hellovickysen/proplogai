"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserAccess } from '@/lib/plans';

const MAX_CUSTOM_BASIC = 2;
const MAX_CUSTOM_ELITE = 5;

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Create a custom habit */
export async function createHabit(name) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (!name || !name.trim()) return { error: 'Habit name is required.' };
  if (name.trim().length > 60) return { error: 'Habit name too long (max 60 chars).' };

  const access = await getUserAccess(supabase, user);
  const maxCustom = access.effectivePlan === 'elite' ? MAX_CUSTOM_ELITE : MAX_CUSTOM_BASIC;

  // Count existing custom habits
  const { count } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_custom', true);

  if ((count || 0) >= maxCustom) {
    return { error: `You can have up to ${maxCustom} custom habits. Upgrade to Elite for more.` };
  }

  const { error } = await supabase.from('habits').insert({
    user_id: user.id,
    name: name.trim(),
    is_custom: true,
    is_active: true,
    sort_order: (count || 0) + 1,
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/coach');
  return { ok: true };
}

/** Update a custom habit name */
export async function updateHabit(habitId, name) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (!name || !name.trim()) return { error: 'Habit name is required.' };

  const { error } = await supabase
    .from('habits')
    .update({ name: name.trim() })
    .eq('id', habitId)
    .eq('user_id', user.id)
    .eq('is_custom', true);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/coach');
  return { ok: true };
}

/** Delete a custom habit */
export async function deleteHabit(habitId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId)
    .eq('user_id', user.id)
    .eq('is_custom', true);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/coach');
  return { ok: true };
}

/** Toggle a habit log for a specific date */
export async function toggleHabitLog(habitId, logDate, completed) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Check ownership
  const { data: habit } = await supabase
    .from('habits')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!habit) return { error: 'Habit not found.' };

  // Upsert the log
  const { error } = await supabase
    .from('habit_logs')
    .upsert({
      habit_id: habitId,
      user_id: user.id,
      log_date: logDate,
      completed: !!completed,
    }, { onConflict: 'habit_id,log_date' });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/coach');
  return { ok: true };
}

/** Seed auto-detected habits for a user (idempotent) */
export async function seedAutoHabits() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const AUTO = [
    { name: 'Log trades daily', sort_order: 0 },
    { name: 'Tag emotions', sort_order: 1 },
    { name: 'Record lessons', sort_order: 2 },
    { name: 'Follow setups', sort_order: 3 },
  ];

  // Check if already seeded
  const { count } = await supabase
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_custom', false);

  if ((count || 0) >= AUTO.length) return { ok: true, seeded: false };

  const rows = AUTO.map((h) => ({
    user_id: user.id,
    name: h.name,
    is_custom: false,
    is_active: true,
    sort_order: h.sort_order,
  }));

  const { error } = await supabase.from('habits').insert(rows);
  if (error) return { error: error.message };

  return { ok: true, seeded: true };
}
