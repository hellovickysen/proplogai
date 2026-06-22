"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function toNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function getCtx() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function buildRow(user, payload) {
  return {
    user_id: user.id,
    pair: String(payload.pair || '').toUpperCase(),
    direction: payload.direction === 'short' ? 'short' : 'long',
    entry_price: toNum(payload.entry_price),
    exit_price: toNum(payload.exit_price),
    stop_loss: toNum(payload.stop_loss),
    take_profit: toNum(payload.take_profit),
    lot_size: toNum(payload.lot_size),
    pnl: toNum(payload.pnl),
    r_multiple: toNum(payload.r_multiple),
    setup: payload.setup || null,
    timeframe: payload.timeframe || null,
    opened_at: payload.opened_at || null,
    closed_at: payload.closed_at || null,
  };
}

export async function createTrade(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (toNum(payload.pnl) === null) return { error: 'Please enter the trade P&L.' };
  if (!payload.pair) return { error: 'Please enter a pair.' };
  const { error } = await supabase.from('trades').insert(buildRow(user, payload));
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  return { ok: true };
}

export async function updateTrade(id, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (toNum(payload.pnl) === null) return { error: 'Please enter the trade P&L.' };
  const row = buildRow(user, payload);
  delete row.user_id;
  const { error } = await supabase.from('trades').update(row).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  revalidatePath('/dashboard/trades/' + id);
  return { ok: true };
}

export async function deleteTrade(id) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  return { ok: true };
}

export async function saveJournal(tradeId, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  const entry = {
    user_id: user.id,
    trade_id: tradeId,
    note: payload.note || null,
    emotions: Array.isArray(payload.emotions) ? payload.emotions : [],
    confidence: toNum(payload.confidence),
    screenshot_url: payload.screenshot_url || null,
  };
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('trade_id', tradeId)
    .maybeSingle();
  let error;
  if (existing) {
    const res = await supabase.from('journal_entries').update(entry).eq('id', existing.id);
    error = res.error;
  } else {
    const res = await supabase.from('journal_entries').insert(entry);
    error = res.error;
  }
  if (error) return { error: error.message };
  revalidatePath('/dashboard/trades/' + tradeId);
  return { ok: true };
}
