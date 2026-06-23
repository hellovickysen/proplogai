"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeTradeWithAI } from '@/lib/ai';

/** Input validation limits */
const MAX_PAIR_LENGTH = 20;
const MAX_NOTE_LENGTH = 5000;
const MAX_EMOTIONS = 20;
const MAX_SETUP_LENGTH = 100;
const PNL_RANGE = [-1000000, 1000000];
const MAX_SCREENSHOTS = 10;

/** Simple in-memory rate limiter for AI calls (per user, resets on deploy) */
const aiRateLimit = new Map();
const AI_RATE_LIMIT = 20; // max AI calls per hour
const AI_RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkAiRateLimit(userId) {
  const now = Date.now();
  const entry = aiRateLimit.get(userId);
  if (!entry || now - entry.start > AI_RATE_WINDOW) {
    aiRateLimit.set(userId, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= AI_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function sanitizeText(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '');
}

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

const VALID_SETUP_FOLLOWED = ['yes', 'partial', 'no'];

function buildRow(user, payload) {
  const pair = sanitizeText(payload.pair, MAX_PAIR_LENGTH) || '';
  const pnl = toNum(payload.pnl);
  if (pnl !== null && (pnl < PNL_RANGE[0] || pnl > PNL_RANGE[1])) {
    throw new Error('P&L value out of range.');
  }
  return {
    user_id: user.id,
    pair: pair.toUpperCase(),
    direction: payload.direction === 'short' ? 'short' : 'long',
    entry_price: toNum(payload.entry_price),
    exit_price: toNum(payload.exit_price),
    stop_loss: toNum(payload.stop_loss),
    take_profit: toNum(payload.take_profit),
    lot_size: toNum(payload.lot_size),
    pnl: toNum(payload.pnl),
    r_multiple: toNum(payload.r_multiple),
    setup: sanitizeText(payload.setup, MAX_SETUP_LENGTH),
    setup_id: payload.setup_id || null,
    setup_followed: VALID_SETUP_FOLLOWED.includes(payload.setup_followed) ? payload.setup_followed : null,
    no_setup_reason: sanitizeText(payload.no_setup_reason, 50) || null,
    timeframe: payload.timeframe || null,
    session: payload.session || null,
    trade_date: payload.trade_date || null,
    opened_at: payload.opened_at || null,
    closed_at: payload.closed_at || null,
  };
}

/** Normalize screenshot data into a flat array of URL strings. */
function normalizeScreenshots(urls, legacyUrl) {
  const arr = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (arr.length === 0 && legacyUrl) return [legacyUrl];
  return arr;
}

export async function createTrade(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (toNum(payload.pnl) === null) return { error: 'Please enter the trade P&L.' };
  if (!payload.pair) return { error: 'Please enter a pair.' };
  const { data, error } = await supabase.from('trades').insert(buildRow(user, payload)).select('id').single();
  if (error) return { error: error.message };

  // If journal fields were included, create the journal entry too
  const j = payload.journal;
  if (j && (j.note || (j.emotions && j.emotions.length) || j.confidence || (j.screenshot_urls && j.screenshot_urls.length))) {
    const entry = {
      user_id: user.id,
      trade_id: data.id,
      note: j.note || null,
      emotions: Array.isArray(j.emotions) ? j.emotions : [],
      confidence: toNum(j.confidence),
      screenshot_url: normalizeScreenshots(j.screenshot_urls)[0] || null,
      screenshot_urls: normalizeScreenshots(j.screenshot_urls),
    };
    await supabase.from('journal_entries').insert(entry);
  }

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
  const urls = normalizeScreenshots(payload.screenshot_urls, payload.screenshot_url).slice(0, MAX_SCREENSHOTS);
  const emotions = Array.isArray(payload.emotions) ? payload.emotions.slice(0, MAX_EMOTIONS).map((e) => sanitizeText(e, 50)) : [];
  const entry = {
    user_id: user.id,
    trade_id: tradeId,
    note: sanitizeText(payload.note, MAX_NOTE_LENGTH),
    emotions,
    confidence: toNum(payload.confidence),
    screenshot_url: urls[0] || null,
    screenshot_urls: urls,
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

export async function analyzeTrade(tradeId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  if (!checkAiRateLimit(user.id)) return { error: 'Rate limit reached. Try again in an hour.' };

  const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).maybeSingle();
  if (!trade) return { error: 'Trade not found.' };
  const { data: journal } = await supabase.from('journal_entries').select('*').eq('trade_id', tradeId).maybeSingle();

  let analysis;
  try {
    analysis = await analyzeTradeWithAI(trade, journal);
  } catch (e) {
    return { error: (e && e.message) || 'AI analysis failed.' };
  }

  const row = {
    user_id: user.id,
    trade_id: tradeId,
    type: 'trade_analysis',
    summary: analysis.summary || null,
    mistakes: analysis,
    severity: Number.isFinite(Number(analysis.execution_score)) ? Math.round(Number(analysis.execution_score)) : null,
  };

  const { data: existing } = await supabase
    .from('ai_insights')
    .select('id')
    .eq('trade_id', tradeId)
    .eq('type', 'trade_analysis')
    .maybeSingle();

  let error;
  if (existing) {
    const res = await supabase.from('ai_insights').update(row).eq('id', existing.id);
    error = res.error;
  } else {
    const res = await supabase.from('ai_insights').insert(row);
    error = res.error;
  }
  if (error) return { error: error.message };
  revalidatePath('/dashboard/trades/' + tradeId);
  return { ok: true };
}
