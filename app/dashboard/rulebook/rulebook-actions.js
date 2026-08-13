"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RULES = {
  daily_loss_limit: {
    category: 'non_negotiable',
    title: 'Daily Loss Limit',
    value: '250',
    unit: '$',
    guidance: 'Stop trading for the day once this loss limit is reached.',
    sort_order: 1,
  },
  maximum_lot_contract_size: {
    category: 'non_negotiable',
    title: 'Maximum Lot / Contract Size',
    value: '1',
    unit: 'lot / contract',
    guidance: 'Do not exceed this size on any single trade.',
    sort_order: 2,
  },
};

function sanitizeValue(value) {
  return String(value || '').trim().slice(0, 40);
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function saveRulebookRule(ruleKey, value) {
  if (!RULES[ruleKey]) return { error: 'Unknown rule.' };
  const cleanValue = sanitizeValue(value);
  if (!cleanValue) return { error: 'A personal limit is required.' };

  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const rule = RULES[ruleKey];
  const { data: existing, error: readError } = await supabase
    .from('rulebook_rules')
    .select('id')
    .eq('user_id', user.id)
    .eq('rule_key', ruleKey)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const payload = { ...rule, value: cleanValue, updated_at: new Date().toISOString() };
  const { error } = existing
    ? await supabase.from('rulebook_rules').update(payload).eq('id', existing.id).eq('user_id', user.id)
    : await supabase.from('rulebook_rules').insert({ ...payload, user_id: user.id });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/rulebook');
  return { ok: true };
}

