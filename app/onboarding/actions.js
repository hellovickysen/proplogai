"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const FOCUS_RULE_IDS = new Set([
  'planned_setups_only',
  'candle_close_confirmation',
  'one_trade_at_a_time',
  'no_averaging_down',
  'journal_before_next_trade',
  'pause_after_rule_break',
]);

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export async function completeDisciplineOnboarding(payload) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const dailyLossLimit = positiveNumber(payload?.dailyLossLimit);
  const maximumPositionSize = positiveNumber(payload?.maximumPositionSize);
  const stopOnProfit = positiveNumber(payload?.stopOnProfit);
  const focusRuleIds = Array.isArray(payload?.focusRuleIds)
    ? [...new Set(payload.focusRuleIds.filter((id) => typeof id === 'string' && FOCUS_RULE_IDS.has(id)))]
    : [];

  if (!dailyLossLimit || !maximumPositionSize || !stopOnProfit) {
    return { error: 'Set a positive value for each required guardrail.' };
  }
  if (focusRuleIds.length < 3 || focusRuleIds.length > 5) {
    return { error: 'Choose between three and five Focus rules.' };
  }

  const { data: programId, error: programError } = await supabase.rpc('complete_discipline_onboarding', {
    p_user_id: user.id,
    p_daily_loss_limit: dailyLossLimit,
    p_maximum_position_size: maximumPositionSize,
    p_stop_on_profit: stopOnProfit,
    p_focus_rule_ids: focusRuleIds,
  });
  if (programError) return { error: programError.message || 'Unable to start your programme. Please retry.' };


  revalidatePath('/dashboard/discipline');
  revalidatePath('/onboarding/discipline');
  return { ok: true, programId };
}
