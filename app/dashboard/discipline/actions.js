"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getActiveAccountId } from '@/lib/accounts';

const MAX_RULE_NAME = 80;
const MAX_INSTRUMENT = 30;

function cleanText(value, maxLength) {
  if (!value) return null;
  return String(value).replace(/<[^>]*>/g, '').trim().slice(0, maxLength) || null;
}

function cleanThreshold(value) {
  if (value === '' || value === null || value === undefined) return null;
  const threshold = Number(value);
  return Number.isFinite(threshold) && threshold > 0 ? threshold : NaN;
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getContext() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, activeAccountId: null };
  const activeAccountId = await getActiveAccountId(supabase, user.id);
  return { supabase, user, activeAccountId };
}

function refreshDiscipline() {
  revalidatePath('/dashboard/discipline');
}

export async function startDisciplineProgram() {
  const { supabase, user } = await getContext();
  if (!user) return { error: 'You must be signed in.' };

  const { data: programId, error } = await supabase.rpc('start_discipline_program', {
    p_user_id: user.id,
  });

  if (error) return { error: error.message };
  refreshDiscipline();
  return { ok: true, programId };
}

export async function addDisciplineRule(payload) {
  const { supabase, user, activeAccountId } = await getContext();
  if (!user) return { error: 'You must be signed in.' };

  const programId = cleanText(payload?.programId, 100);
  const name = cleanText(payload?.name, MAX_RULE_NAME);
  const metric = cleanText(payload?.metric, 40);
  const ruleType = cleanText(payload?.ruleType, 40);
  const unit = cleanText(payload?.unit, 20);
  const instrument = cleanText(payload?.instrument, MAX_INSTRUMENT);
  const threshold = cleanThreshold(payload?.threshold);

  if (!isUuid(programId)) return { error: 'Programme not found.' };
  if (!name) return { error: 'Rule name is required.' };
  if (!['required_guardrail', 'focus', 'library'].includes(ruleType)) return { error: 'Invalid rule type.' };
  if (!['risk_per_trade', 'daily_loss_limit', 'maximum_position_size', 'stop_on_profit', 'behavior'].includes(metric)) return { error: 'Invalid rule metric.' };
  if (Number.isNaN(threshold)) return { error: 'Threshold must be a positive number.' };

  const { data: program, error: programError } = await supabase
    .from('discipline_programs')
    .select('id, account_id, status')
    .eq('id', programId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (programError) return { error: 'Unable to verify the active programme. Please retry.' };
  if (!program) return { error: 'Active programme not found.' };
  if ((program.account_id || null) !== (activeAccountId || null)) {
    return { error: 'Switch back to the programme account before changing its rules.' };
  }

  const { error } = await supabase.rpc('create_discipline_rule_with_focus', {
    p_user_id: user.id,
    p_program_id: program.id,
    p_name: name,
    p_rule_type: ruleType,
    p_metric: metric,
    p_threshold: threshold,
    p_unit: unit,
    p_instrument: instrument,
  });

  if (error) return { error: error.message };
  refreshDiscipline();
  return { ok: true };
}

export async function completeDisciplineProgramSetup(programId) {
  const { supabase, user, activeAccountId } = await getContext();
  if (!user) return { error: 'You must be signed in.' };

  const cleanProgramId = cleanText(programId, 100);
  if (!isUuid(cleanProgramId)) return { error: 'Programme not found.' };

  const { data: program, error: programError } = await supabase
    .from('discipline_programs')
    .select('id, account_id, status')
    .eq('id', cleanProgramId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (programError) return { error: 'Unable to verify the active programme. Please retry.' };
  if (!program) return { error: 'Active programme not found.' };
  if ((program.account_id || null) !== (activeAccountId || null)) {
    return { error: 'Switch back to the programme account before completing setup.' };
  }

  const { error } = await supabase.rpc('complete_discipline_program_setup', {
    p_user_id: user.id,
    p_program_id: program.id,
  });

  if (error) return { error: error.message };
  refreshDiscipline();
  return { ok: true };
}
