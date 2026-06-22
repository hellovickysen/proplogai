"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function toNum(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createTrade(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const pnl = toNum(payload.pnl);
  if (pnl === null) return { error: 'Please enter the trade P&L.' };
  if (!payload.pair) return { error: 'Please enter a pair.' };

  const row = {
    user_id: user.id,
    pair: String(payload.pair).toUpperCase(),
    direction: payload.direction === 'short' ? 'short' : 'long',
    entry_price: toNum(payload.entry_price),
    exit_price: toNum(payload.exit_price),
    stop_loss: toNum(payload.stop_loss),
    take_profit: toNum(payload.take_profit),
    lot_size: toNum(payload.lot_size),
    pnl: pnl,
    r_multiple: toNum(payload.r_multiple),
    setup: payload.setup || null,
    timeframe: payload.timeframe || null,
    opened_at: payload.opened_at || null,
    closed_at: payload.closed_at || null,
  };

  const { error } = await supabase.from('trades').insert(row);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  return { ok: true };
}
