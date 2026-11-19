"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { appendRuleVersion, latestRuleVersion, RULE_HISTORY_KEY, validRuleDate, rulebookDate } from '@/lib/rulebook-history.mjs';

const VALID_CATEGORIES = new Set(['non_negotiable', 'behavior', 'condition', 'response', 'custom']);

function cleanText(value, max = 500) {
  return String(value || '').trim().replace(/<[^>]*>/g, '').slice(0, max);
}

async function getContext(accountId) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  if (accountId) {
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .maybeSingle();
    if (!account) return { error: 'Account not found.' };
  }

  return { supabase, user };
}

export async function saveDisciplineRule(payload) {
  const category = cleanText(payload.category, 40);
  const ruleKey = cleanText(payload.rule_key, 80);
  const title = cleanText(payload.title, 100);
  const description = cleanText(payload.description, 500);
  const value = cleanText(payload.value, 100);
  const unit = cleanText(payload.unit, 40) || null;
  const ruleType = cleanText(payload.rule_type, 80) || ruleKey;
  const accountId = payload.account_id || null;
  const effectiveFrom = payload.effective_from || rulebookDate();

  if (!VALID_CATEGORIES.has(category) || !ruleKey || !title) return { error: 'Invalid rule.' };
  if (category === 'non_negotiable' && (!value || !Number.isFinite(Number(value)) || Number(value) <= 0)) return { error: 'Enter a value greater than 0.' };
  if (['max_trades_per_day', 'consecutive_losses'].includes(ruleType) && (!Number.isInteger(Number(value)) || Number(value) < 1)) return { error: 'Enter a whole number of at least 1.' };
  if (!validRuleDate(effectiveFrom)) return { error: 'Choose a valid effective date.' };

  const context = await getContext(accountId);
  if (context.error) return context;
  const { supabase, user } = context;

  let existingQuery = supabase
    .from('rulebook_rules')
    .select('id,account_id,rule_key,category,title,value,unit,guidance,enabled,metadata,sort_order,created_at,updated_at')
    .eq('user_id', user.id)
    .eq('rule_key', ruleKey);
  existingQuery = accountId ? existingQuery.eq('account_id', accountId) : existingQuery.is('account_id', null);
  const { data: existing, error: readError } = await existingQuery.maybeSingle();
  if (readError) return { error: readError.message };

  const next = {
    user_id: user.id,
    account_id: accountId,
    rule_key: ruleKey,
    rule_type: ruleType,
    category,
    title,
    value,
    unit,
    guidance: description || null,
    enabled: payload.enabled !== false,
    metadata: payload.metadata || {},
    sort_order: Number(payload.sort_order) || 0,
  };
  const recordedAt = new Date().toISOString();
  const history = appendRuleVersion(existing, next, effectiveFrom, recordedAt);
  const current = latestRuleVersion(history, rulebookDate(recordedAt));
  const latest = current || latestRuleVersion(history);
  const row = {
    ...next,
    value: latest.value,
    unit: latest.unit,
    enabled: latest.enabled,
    metadata: { ...latest.settings, [RULE_HISTORY_KEY]: history },
    updated_at: recordedAt,
  };

  const { data: saved, error } = existing
    ? await supabase.from('rulebook_rules').update(row).eq('id', existing.id).eq('user_id', user.id).eq('updated_at', existing.updated_at).select('id')
    : await supabase.from('rulebook_rules').insert(row).select('id');
  if (error) return { error: error.message };
  if (!saved?.length) return { error: 'This rule changed elsewhere. Refresh the Rulebook and try again.' };

  revalidatePath('/dashboard/rulebook');
  revalidatePath('/dashboard/analytics');
  revalidatePath('/dashboard/analytics/review');
  return { ok: true, currentValue: current?.value || "", currentUnit: current?.unit || null, scheduled: effectiveFrom > rulebookDate(recordedAt), effectiveFrom };
}
