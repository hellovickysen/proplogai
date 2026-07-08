"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function sanitize(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '').trim();
}

function toNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const VALID_ACCOUNT_TYPES = ['futures', 'cfd'];
const VALID_PURCHASE_TYPES = ['new', 'renewal', 'activation'];

export async function createExpense(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const firmName = sanitize(payload.firm_name, 100);
  if (!firmName) return { error: 'Firm name is required.' };

  const totalCost = toNum(payload.total_cost);
  if (totalCost === null || totalCost <= 0) return { error: 'Total cost is required.' };

  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    firm_name: firmName,
    account_type: VALID_ACCOUNT_TYPES.includes(payload.account_type) ? payload.account_type : null,
    account_size: sanitize(payload.account_size, 20),
    purchase_type: VALID_PURCHASE_TYPES.includes(payload.purchase_type) ? payload.purchase_type : null,
    account_cost: toNum(payload.account_cost),
    num_accounts: Math.max(1, Math.min(toNum(payload.num_accounts) || 1, 100)),
    total_cost: totalCost,
    expense_date: payload.expense_date || null,
    notes: sanitize(payload.notes, 500),
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateExpense(id, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const updates = {};
  if (payload.firm_name !== undefined) {
    const fn = sanitize(payload.firm_name, 100);
    if (!fn) return { error: 'Firm name is required.' };
    updates.firm_name = fn;
  }
  if (payload.account_type !== undefined) updates.account_type = VALID_ACCOUNT_TYPES.includes(payload.account_type) ? payload.account_type : null;
  if (payload.account_size !== undefined) updates.account_size = sanitize(payload.account_size, 20);
  if (payload.purchase_type !== undefined) updates.purchase_type = VALID_PURCHASE_TYPES.includes(payload.purchase_type) ? payload.purchase_type : null;
  if (payload.account_cost !== undefined) updates.account_cost = toNum(payload.account_cost);
  if (payload.num_accounts !== undefined) updates.num_accounts = Math.max(1, Math.min(toNum(payload.num_accounts) || 1, 100));
  if (payload.total_cost !== undefined) {
    const tc = toNum(payload.total_cost);
    if (tc === null || tc <= 0) return { error: 'Total cost must be positive.' };
    updates.total_cost = tc;
  }
  if (payload.expense_date !== undefined) updates.expense_date = payload.expense_date || null;
  if (payload.notes !== undefined) updates.notes = sanitize(payload.notes, 500);

  if (Object.keys(updates).length === 0) return { ok: true };

  const { error } = await supabase.from('expenses').update(updates).eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteExpense(id) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function createPayout(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const firmName = sanitize(payload.firm_name, 100);
  if (!firmName) return { error: 'Firm name is required.' };

  const amount = toNum(payload.amount);
  if (amount === null || amount <= 0) return { error: 'Amount is required.' };

  const { error } = await supabase.from('payouts').insert({
    user_id: user.id,
    firm_name: firmName,
    amount,
    payout_date: payload.payout_date || null,
    notes: sanitize(payload.notes, 500),
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updatePayout(id, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const updates = {};
  if (payload.firm_name !== undefined) {
    const fn = sanitize(payload.firm_name, 100);
    if (!fn) return { error: 'Firm name is required.' };
    updates.firm_name = fn;
  }
  if (payload.amount !== undefined) {
    const amt = toNum(payload.amount);
    if (amt === null || amt <= 0) return { error: 'Amount must be positive.' };
    updates.amount = amt;
  }
  if (payload.payout_date !== undefined) updates.payout_date = payload.payout_date || null;
  if (payload.notes !== undefined) updates.notes = sanitize(payload.notes, 500);

  if (Object.keys(updates).length === 0) return { ok: true };

  const { error } = await supabase.from('payouts').update(updates).eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deletePayout(id) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };
  const { error } = await supabase.from('payouts').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function renameFirm(oldName, newName) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const cleanOld = sanitize(oldName, 100);
  const cleanNew = sanitize(newName, 100);
  if (!cleanOld || !cleanNew) return { error: 'Firm name is required.' };
  if (cleanOld === cleanNew) return { ok: true };

  // Update all expenses with this firm name
  const { error: e1 } = await supabase
    .from('expenses')
    .update({ firm_name: cleanNew })
    .eq('firm_name', cleanOld)
    .eq('user_id', user.id);
  if (e1) return { error: e1.message };

  // Update all payouts with this firm name
  const { error: e2 } = await supabase
    .from('payouts')
    .update({ firm_name: cleanNew })
    .eq('firm_name', cleanOld)
    .eq('user_id', user.id);
  if (e2) return { error: e2.message };

  revalidatePath('/dashboard/prop-expenses');
  revalidatePath('/dashboard');
  return { ok: true };
}
