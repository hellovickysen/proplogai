"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

  if (!VALID_CATEGORIES.has(category) || !ruleKey || !title) return { error: 'Invalid rule.' };
  if (category === 'non_negotiable' && (!value || Number(value) <= 0)) return { error: 'Enter a value greater than 0.' };
  if (['max_trades_per_day', 'consecutive_losses'].includes(ruleType) && (!Number.isInteger(Number(value)) || Number(value) < 1)) return { error: 'Enter a whole number of at least 1.' };

  const context = await getContext(accountId);
  if (context.error) return context;
  const { supabase, user } = context;

  let existingQuery = supabase
    .from('rulebook_rules')
    .select('id')
    .eq('user_id', user.id)
    .eq('rule_key', ruleKey);
  existingQuery = accountId ? existingQuery.eq('account_id', accountId) : existingQuery.is('account_id', null);
  const { data: existing, error: readError } = await existingQuery.maybeSingle();
  if (readError) return { error: readError.message };

  const row = {
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
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from('rulebook_rules').update(row).eq('id', existing.id).eq('user_id', user.id)
    : await supabase.from('rulebook_rules').insert(row);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/rulebook');
  return { ok: true };
}
