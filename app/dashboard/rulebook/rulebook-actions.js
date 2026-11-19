"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { appendRuleVersion, latestRuleVersion, RULE_HISTORY_KEY, rulebookDate } from '@/lib/rulebook-history.mjs';

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
  if (!cleanValue || !Number.isFinite(Number(cleanValue)) || Number(cleanValue) <= 0) return { error: 'Enter a personal limit greater than 0.' };

  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const rule = RULES[ruleKey];
  const { data: existing, error: readError } = await supabase
    .from('rulebook_rules')
    .select('id,value,unit,enabled,metadata,created_at,updated_at')
    .eq('user_id', user.id)
    .eq('rule_key', ruleKey)
    .is('account_id', null)
    .maybeSingle();
  if (readError) return { error: readError.message };

  const recordedAt = new Date().toISOString();
  const history = appendRuleVersion(existing, { ...rule, value: cleanValue, enabled: true }, rulebookDate(recordedAt), recordedAt);
  const latest = latestRuleVersion(history, rulebookDate(recordedAt)) || latestRuleVersion(history);
  const payload = { ...rule, value: latest.value, unit: latest.unit, enabled: latest.enabled, metadata: { ...latest.settings, [RULE_HISTORY_KEY]: history }, updated_at: recordedAt };
  const { data: saved, error } = existing
    ? await supabase.from('rulebook_rules').update(payload).eq('id', existing.id).eq('user_id', user.id).eq('updated_at', existing.updated_at).select('id')
    : await supabase.from('rulebook_rules').insert({ ...payload, user_id: user.id }).select('id');
  if (error) return { error: error.message };
  if (!saved?.length) return { error: 'This rule changed elsewhere. Refresh and try again.' };

  revalidatePath('/dashboard/rulebook');
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/analytics/review');
  return { ok: true };
}

