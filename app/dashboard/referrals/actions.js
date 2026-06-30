"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function generateCode() {
  return 'pl' + crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Generate a unique referral code for the current user */
export async function generateReferralCode() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  // Check if already has a code
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) return { ok: true, code: existing.code };

  const code = generateCode();
  const { error } = await supabase.from('referral_codes').insert({
    user_id: user.id,
    code,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/referrals');
  return { ok: true, code };
}

/** Capture a referral: called when a new user with a ref cookie loads the dashboard */
export async function captureReferral(refCode) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  if (!refCode || typeof refCode !== 'string' || refCode.length > 20) return { error: 'Invalid referral code.' };

  // Check if already referred
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('referred_by')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefs && prefs.referred_by) return { ok: true, already: true };

  // Look up referral code
  const { data: refRow } = await supabase
    .from('referral_codes')
    .select('user_id, code')
    .eq('code', refCode)
    .maybeSingle();

  if (!refRow) return { error: 'Invalid referral code.' };

  // Don't let users refer themselves
  if (refRow.user_id === user.id) return { ok: true, self: true };

  // Store referred_by
  await supabase
    .from('user_preferences')
    .update({ referred_by: refCode })
    .eq('user_id', user.id);

  // Create referral record
  await supabase.from('referrals').insert({
    referrer_id: refRow.user_id,
    referred_user_id: user.id,
    referred_email: user.email || null,
    status: 'pending',
    reward_given: false,
  });

  return { ok: true };
}

/**
 * Check if the current user has earned a referral reward (called after creating a trade).
 * Triggers when: user has 3+ trades, was referred, and reward not yet given.
 */
async function checkAndRewardReferral(supabaseClient, userId) {
  const supabase = supabaseClient;

  // Get user prefs
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('referred_by, referral_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (!prefs || !prefs.referred_by) return; // Not referred

  // Check if reward already given
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, referrer_id, reward_given')
    .eq('referred_user_id', userId)
    .maybeSingle();

  if (!referral || referral.reward_given) return; // Already rewarded or no record

  // Count user's trades
  const { count } = await supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count || 0) < 3) return; // Not enough trades yet

  // Award $1 to both users using atomic SQL increment (prevents race conditions)
  const REWARD = 1;

  // Credit the referred user (atomic)
  await supabase.rpc('increment_referral_balance', { target_user_id: userId, amount: REWARD });

  // Credit the referrer (atomic)
  await supabase.rpc('increment_referral_balance', { target_user_id: referral.referrer_id, amount: REWARD });

  // Mark referral as completed
  await supabase
    .from('referrals')
    .update({ status: 'completed', reward_given: true })
    .eq('id', referral.id);
}
