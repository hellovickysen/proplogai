"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const DEFAULT_SETUPS = [
  { name: 'Breakout', direction: 'Only trade breakouts after a confirmed candle close above or below a key level. Avoid chasing if price is already extended.', sort_order: 1 },
  { name: 'Pullback', direction: 'Trade with the trend after price pulls back to a valid area and shows continuation confirmation.', sort_order: 2 },
  { name: 'Liquidity Sweep', direction: 'Trade only after price sweeps liquidity and shows rejection or reversal confirmation.', sort_order: 3 },
  { name: 'Support / Resistance', direction: 'Trade around clearly marked levels with confirmation. Avoid random entries in the middle of a range.', sort_order: 4 },
  { name: 'Trend Continuation', direction: 'Enter in the direction of the established trend after a healthy retracement or consolidation breakout.', sort_order: 5 },
  { name: 'Reversal', direction: 'Trade reversals only at major structural levels with multiple confirmations. Higher risk — reduce size.', sort_order: 6 },
  { name: 'Good SL', direction: 'You followed your setup correctly but the market hit your stop loss. This is not a mistake — it is the cost of doing business. Mark this when your process was right and the loss was simply the market doing its thing.', sort_order: 7 },
  { name: 'Bad SL', direction: 'You broke your own stop loss rule — moved it, widened it, or ignored it entirely. This is a risk management violation. Every time you select this, ask yourself: was the extra risk worth it? Your stop loss exists to protect your account.', sort_order: 8 },
  { name: 'No Setup', direction: 'Use this when the trade did not follow any planned setup, was emotional, or was taken impulsively.', is_default: true, sort_order: 99 },
];

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
    custom_emotions: Array.isArray(payload.custom_emotions)
      ? payload.custom_emotions.filter(e => typeof e === 'string' && e.length > 0).map(e => e.trim().slice(0, 50)).slice(0, 50)
      : [],
    default_confidence: Number(payload.default_confidence) || 0,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existing) {
    delete row.user_id;
    const res = await supabase.from('user_preferences').update(row).eq('id', existing.id).eq('user_id', user.id);
    error = res.error;
  } else {
    const res = await supabase.from('user_preferences').insert(row);
    error = res.error;
  }
  if (error) return { error: error.message };

  // Seed default setups for the new user (only if they have none)
  const { count } = await supabase
    .from('setups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (!count || count === 0) {
    const setupRows = DEFAULT_SETUPS.map((s) => ({
      user_id: user.id,
      name: s.name,
      direction: s.direction,
      is_default: s.is_default || false,
      is_active: true,
      sort_order: s.sort_order,
    }));
    await supabase.from('setups').insert(setupRows);
  }

  revalidatePath('/dashboard');
  return { ok: true };
}
