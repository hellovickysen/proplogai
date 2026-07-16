"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserAccess } from '@/lib/plans';

const MAX_NAME_LENGTH = 60;
const MAX_FIRM_LENGTH = 60;
const VALID_PHASES = ['challenge', 'funded', 'payout'];
const ACCOUNTS_LIMIT = 10;
const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function sanitize(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '');
}

async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Create a new trading account (Elite only). */
export async function createAccount(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Plan check
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('multi_account')) {
    return { error: 'Multi-account requires the Elite plan.' };
  }

  // Count existing non-archived accounts
  const { count } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if ((count || 0) >= ACCOUNTS_LIMIT) {
    return { error: `You can have up to ${ACCOUNTS_LIMIT} active accounts.` };
  }

  const name = sanitize(payload.name, MAX_NAME_LENGTH);
  if (!name || !name.trim()) return { error: 'Account name is required.' };

  const row = {
    user_id: user.id,
    name: name.trim(),
    prop_firm: sanitize(payload.prop_firm, MAX_FIRM_LENGTH) || null,
    account_size: payload.account_size ? Number(payload.account_size) || null : null,
    phase: VALID_PHASES.includes(payload.phase) ? payload.phase : null,
    color: COLOR_REGEX.test(payload.color) ? payload.color : '#a78bfa',
    starting_balance: payload.starting_balance ? Number(payload.starting_balance) || null : null,
    sort_order: (count || 0) + 1,
  };

  const { data, error } = await supabase
    .from('accounts')
    .insert(row)
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { ok: true, id: data.id };
}

/** Update an existing account (rename, recolor, change phase/firm/size). */
export async function updateAccount(accountId, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const updates = {};
  if (payload.name !== undefined) {
    const name = sanitize(payload.name, MAX_NAME_LENGTH);
    if (!name || !name.trim()) return { error: 'Account name is required.' };
    updates.name = name.trim();
  }
  if (payload.prop_firm !== undefined) updates.prop_firm = sanitize(payload.prop_firm, MAX_FIRM_LENGTH) || null;
  if (payload.account_size !== undefined) updates.account_size = payload.account_size ? Number(payload.account_size) || null : null;
  if (payload.phase !== undefined) updates.phase = VALID_PHASES.includes(payload.phase) ? payload.phase : null;
  if (payload.color !== undefined) updates.color = COLOR_REGEX.test(payload.color) ? payload.color : '#a78bfa';
  if (payload.starting_balance !== undefined) updates.starting_balance = payload.starting_balance ? Number(payload.starting_balance) || null : null;
  if (payload.status !== undefined) updates.status = payload.status;

  if (Object.keys(updates).length === 0) return { error: 'Nothing to update.' };

  const { error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { ok: true };
}

/** Archive an account (soft delete). Unsets active_account_id if it was the active one. */
export async function archiveAccount(accountId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase
    .from('accounts')
    .update({ is_archived: true })
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  // If this was the active account, clear the selection (back to All Accounts)
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('active_account_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefs && prefs.active_account_id === accountId) {
    await supabase
      .from('user_preferences')
      .update({ active_account_id: null })
      .eq('user_id', user.id);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { ok: true };
}

/** Restore an archived account back to active. */
export async function restoreAccount(accountId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Check active account limit before restoring
  const { count } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if ((count || 0) >= ACCOUNTS_LIMIT) {
    return { error: `You already have ${ACCOUNTS_LIMIT} active accounts. Archive one first.` };
  }

  const { error } = await supabase
    .from('accounts')
    .update({ is_archived: false })
    .eq('id', accountId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/accounts');
  return { ok: true };
}

/** Set the active account for the global switcher. Pass null for "All Accounts". */
export async function setActiveAccount(accountId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // If setting a specific account, verify it belongs to the user and is not archived
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

  const { error } = await supabase
    .from('user_preferences')
    .update({ active_account_id: accountId || null })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  // No revalidatePath here — all pages use `dynamic = 'force-dynamic'` (no cache)
  // and the AccountSwitcher does a full window.location.reload() after this action.
  return { ok: true };
}
