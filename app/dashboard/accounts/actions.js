"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createAccount, deployAccount, getHistoricalTrades } from '@/lib/metaapi';

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
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

export async function connectAccount(form) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (!form.server || !form.login || !form.password) {
    return { error: 'Broker server, login, and investor password are all required.' };
  }

  let acc;
  try {
    acc = await createAccount({
      login: form.login,
      password: form.password,
      server: form.server,
      name: form.name || 'MT5 ' + form.login,
      region: form.region || 'new-york',
      keywords: form.broker ? [form.broker] : [],
    });
  } catch (e) {
    return { error: (e && e.message) || 'Failed to connect to MetaApi.' };
  }

  const metaapiId = acc.id || acc._id;
  if (!metaapiId) {
    return { error: 'MetaApi did not return an account id. Response: ' + JSON.stringify(acc).slice(0, 200) };
  }

  // Kick off deployment so the account connects to the broker.
  await deployAccount(metaapiId);

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    broker: form.broker || null,
    server: form.server,
    login: String(form.login),
    name: form.name || 'MT5 ' + form.login,
    metaapi_id: metaapiId,
    region: form.region || 'new-york',
    status: 'deploying',
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/accounts');
  return { ok: true };
}

export async function syncAccount(accountRowId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const { data: acc } = await supabase.from('accounts').select('*').eq('id', accountRowId).maybeSingle();
  if (!acc) return { error: 'Account not found.' };
  if (!acc.metaapi_id) return { error: 'This account is not linked to MetaApi.' };

  // Make sure the account is deployed (idempotent) before asking for history.
  await deployAccount(acc.metaapi_id);

  let result;
  try {
    result = await getHistoricalTrades(acc.metaapi_id, acc.region);
  } catch (e) {
    return { error: (e && e.message) || 'Sync failed.' };
  }
  if (result.pending) {
    return {
      error: 'Your MT5 account is still deploying and connecting to the broker. First connect takes ~2-5 minutes — I have (re)started deployment, so wait a few minutes and click Sync again.',
    };
  }

  const rows = [];
  for (const t of result.trades) {
    const type = (t.type || '').toString();
    if (/BALANCE|CREDIT|deposit|withdraw/i.test(type)) continue;
    if (!t.symbol) continue;
    const closed = t.closeTime || t.closeBrokerTime || null;
    const externalId = t._id || t.id || null;
    if (!externalId || !closed) continue;
    rows.push({
      user_id: user.id,
      account_id: acc.id,
      external_id: externalId,
      source: 'mt5',
      pair: String(t.symbol).toUpperCase(),
      direction: /sell/i.test(type) ? 'short' : 'long',
      entry_price: numOrNull(t.openPrice),
      exit_price: numOrNull(t.closePrice),
      lot_size: numOrNull(t.volume),
      pnl: numOrNull(t.profit),
      r_multiple: null,
      opened_at: t.openTime || null,
      closed_at: closed,
    });
  }

  if (!rows.length) {
    await supabase.from('accounts').update({ last_synced_at: new Date().toISOString(), status: 'connected' }).eq('id', acc.id);
    return { ok: true, imported: 0, message: 'Connected, but no closed trades found yet. Place/close a trade on the demo account, then sync again.' };
  }

  const { error } = await supabase
    .from('trades')
    .upsert(rows, { onConflict: 'user_id,external_id', ignoreDuplicates: true });
  if (error) return { error: error.message };

  await supabase.from('accounts').update({ last_synced_at: new Date().toISOString(), status: 'connected' }).eq('id', acc.id);

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  revalidatePath('/dashboard/accounts');
  return { ok: true, imported: rows.length };
}

export async function removeAccount(accountRowId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  const { error } = await supabase.from('accounts').delete().eq('id', accountRowId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/accounts');
  return { ok: true };
}
