"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeTradeWithAI } from '@/lib/ai';
import { notify, TYPES } from '@/lib/notifications';

/** Input validation limits */
const MAX_PAIR_LENGTH = 20;
const MAX_NOTE_LENGTH = 5000;
const MAX_EMOTIONS = 20;
const MAX_SETUP_LENGTH = 200;
const MAX_SETUPS_PER_TRADE = 5;
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

  // Multi-setup: validate and store setup_ids array
  const setupIds = Array.isArray(payload.setup_ids)
    ? payload.setup_ids.filter((id) => typeof id === 'string' && id.length > 0).slice(0, MAX_SETUPS_PER_TRADE)
    : [];

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
    setup_ids: setupIds,
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

/** Format P&L for notification message */
function fmtPnl(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
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

  // ── Check for referral reward (DB trigger fires on 3rd trade) ──
  try {
    const { data: referral } = await supabase
      .from('referrals')
      .select('referrer_id, reward_given')
      .eq('referred_user_id', user.id)
      .eq('reward_given', true)
      .maybeSingle();
    if (referral) {
      const { data: alreadyNotified } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'referral_reward')
        .maybeSingle();
      if (!alreadyNotified) {
        await notify(supabase, user.id, TYPES.REFERRAL_REWARD, '🎁 Referral Reward', 'You earned $1.00 credit for completing 3 trades!', { link: '/dashboard/referrals' });
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSb = createAdminClient();
        if (adminSb) {
          await adminSb.from('notifications').insert({
            user_id: referral.referrer_id,
            type: 'referral_reward',
            title: '🎁 Referral Reward',
            message: 'Your referral completed 3 trades! You earned $1.00 credit.',
            metadata: { link: '/dashboard/referrals' },
          });
        }
      }
    }
  } catch (e) {}

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
  const { error } = await supabase.from('trades').update(row).eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  revalidatePath('/dashboard/trades/' + id);
  return { ok: true };
}

export async function deleteTrade(id) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  const { error } = await supabase.from('trades').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/trades');
  return { ok: true };
}

export async function saveJournal(tradeId, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };
  // Verify trade belongs to the current user (prevents IDOR)
  const { data: tradeOwner } = await supabase.from('trades').select('id').eq('id', tradeId).eq('user_id', user.id).maybeSingle();
  if (!tradeOwner) return { error: 'Trade not found.' };
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
    .eq('user_id', user.id)
    .maybeSingle();
  let error;
  if (existing) {
    const res = await supabase.from('journal_entries').update(entry).eq('id', existing.id).eq('user_id', user.id);
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

  const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).eq('user_id', user.id).maybeSingle();
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
    .eq('user_id', user.id)
    .maybeSingle();

  let error;
  if (existing) {
    const res = await supabase.from('ai_insights').update(row).eq('id', existing.id).eq('user_id', user.id);
    error = res.error;
  } else {
    const res = await supabase.from('ai_insights').insert(row);
    error = res.error;
  }
  if (error) return { error: error.message };

  // ── Notification ──
  const grade = analysis.grade || '';
  await notify(supabase, user.id, TYPES.AI_ANALYSIS, 'AI Analysis Complete', `${trade.pair} — Grade: ${grade}`, { link: '/dashboard/trades/' + tradeId });

  revalidatePath('/dashboard/trades/' + tradeId);
  return { ok: true };
}


/* ─── Trade Journal Sharing (24h expiry) ──────────────────── */

export async function shareTrade(tradeId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Verify ownership
  const { data: trade } = await supabase
    .from('trades')
    .select('id, share_id, shared_until')
    .eq('id', tradeId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!trade) return { error: 'Trade not found.' };

  // If already shared and not expired, return existing link
  if (trade.share_id && trade.shared_until && new Date(trade.shared_until) > new Date()) {
    return { ok: true, shareId: trade.share_id, sharedUntil: trade.shared_until };
  }

  // Generate new share_id and set 24h expiry
  const shareId = crypto.randomUUID();
  const sharedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('trades')
    .update({ share_id: shareId, shared_until: sharedUntil })
    .eq('id', tradeId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/trades/' + tradeId);
  return { ok: true, shareId, sharedUntil };
}

export async function unshareTrade(tradeId) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase
    .from('trades')
    .update({ share_id: null, shared_until: null })
    .eq('id', tradeId)
    .eq('user_id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/trades/' + tradeId);
  return { ok: true };
}
