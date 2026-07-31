"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const MAX_RULE_NAME = 80;
const MAX_INSTRUMENT = 30;

function cleanText(value, maxLength) {
  if (!value) return null;
  return String(value).replace(/<[^>]*>/g, '').trim().slice(0, maxLength) || null;
}

async function getContext() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function startDisciplineProgram() {
  const { supabase, user } = await getContext();
  if (!user) return { error: 'You must be signed in.' };

  const { data: existing } = await supabase
    .from('discipline_programs')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) return { ok: true, programId: existing.id };

  const { data, error } = await supabase
    .from('discipline_programs')
    .insert({ user_id: user.id, status: 'active' })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/dashboard/discipline');
  return { ok: true, programId: data.id };
}

export async function addDisciplineRule(payload) {
  const { supabase, user } = await getContext();
  if (!user) return { error: 'You must be signed in.' };

  const programId = cleanText(payload.programId, 100);
  const name = cleanText(payload.name, MAX_RULE_NAME);
  const metric = cleanText(payload.metric, 40);
  const ruleType = cleanText(payload.ruleType, 40);
  const unit = cleanText(payload.unit, 20);
  const instrument = cleanText(payload.instrument, MAX_INSTRUMENT);
  const threshold = payload.threshold === '' || payload.threshold === null || payload.threshold === undefined
    ? null
    : Number(payload.threshold);

  if (!programId || !name) return { error: 'Rule name is required.' };
  if (!['required_guardrail', 'focus', 'library'].includes(ruleType)) return { error: 'Invalid rule type.' };
  if (!['risk_per_trade', 'daily_loss_limit', 'maximum_position_size', 'stop_on_profit', 'behavior'].includes(metric)) return { error: 'Invalid rule metric.' };
  if (threshold !== null && (!Number.isFinite(threshold) || threshold <= 0)) return { error: 'Threshold must be a positive number.' };

  const { data: program } = await supabase
    .from('discipline_programs')
    .select('id')
    .eq('id', programId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  if (!program) return { error: 'Active programme not found.' };

  const { data: rule, error } = await supabase
    .from('discipline_rules')
    .insert({
      user_id: user.id,
      program_id: program.id,
      name,
      rule_type: ruleType,
      metric,
      threshold,
      unit,
      instrument,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  if (ruleType === 'focus') {
    const { count } = await supabase
      .from('discipline_program_focus_rules')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', program.id)
      .eq('user_id', user.id);

    if ((count || 0) >= 5) {
      await supabase
        .from('discipline_rules')
        .delete()
        .eq('id', rule.id)
        .eq('user_id', user.id);
      return { error: 'Choose up to five Focus rules for this programme.' };
    }

    const { error: focusError } = await supabase
      .from('discipline_program_focus_rules')
      .insert({ user_id: user.id, program_id: program.id, rule_id: rule.id, sort_order: count || 0 });

    if (focusError) {
      await supabase
        .from('discipline_rules')
        .delete()
        .eq('id', rule.id)
        .eq('user_id', user.id);
      return { error: focusError.message };
    }
  }

  revalidatePath('/dashboard/discipline');
  return { ok: true };
}
