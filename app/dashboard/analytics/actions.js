"use server";

import { createClient } from '@/lib/supabase/server';
import { getActiveAccountId } from '@/lib/accounts';
import { evaluateTrade, backfillEvaluations } from '@/lib/analytics-evaluator';
import { revalidatePath } from 'next/cache';

/* ─── Date range helpers (Asia/Kolkata boundary = UTC midnight) ──── */

function getDateRange(preset) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dayOfWeek = now.getUTCDay(); // 0=Sun

  switch (preset) {
    case 'this_week': {
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
      return { from: monday.toISOString().slice(0, 10), to: today };
    }
    case 'last_week': {
      const lastMon = new Date(now);
      lastMon.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7) - 7);
      const lastSun = new Date(lastMon);
      lastSun.setUTCDate(lastMon.getUTCDate() + 6);
      return { from: lastMon.toISOString().slice(0, 10), to: lastSun.toISOString().slice(0, 10) };
    }
    case 'this_month': {
      const monthStart = now.toISOString().slice(0, 7) + '-01';
      return { from: monthStart, to: today };
    }
    case 'this_year': {
      const yearStart = now.getUTCFullYear() + '-01-01';
      return { from: yearStart, to: today };
    }
    case 'all':
    default:
      return { from: null, to: null };
  }
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/* ─── Previous equal period (for score delta); null for 'all' ──── */

function getPreviousDateRange(preset) {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  switch (preset) {
    case 'this_week':
      return getDateRange('last_week');
    case 'last_week': {
      const lastMon = new Date(now);
      lastMon.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7) - 14);
      const lastSun = new Date(lastMon);
      lastSun.setUTCDate(lastMon.getUTCDate() + 6);
      return { from: lastMon.toISOString().slice(0, 10), to: lastSun.toISOString().slice(0, 10) };
    }
    case 'this_month': {
      const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
      return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
    }
    case 'this_year': {
      const y = now.getUTCFullYear() - 1;
      return { from: y + '-01-01', to: y + '-12-31' };
    }
    default:
      return null; // 'all' — no previous period
  }
}

/* ─── Discipline Score v2 (process / adherence only) ────
   Compliance: NEVER scores P&L, raw volume, loss count, or review frequency.
   The evolved dimensions are measured as ADHERENCE (rules kept / within a limit),
   not raw counts — e.g. post-loss discipline is "% of post-loss trades with no
   rule break", not the number of losses. */

function stdev(nums) {
  if (nums.length < 2) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) * (b - mean), 0) / nums.length;
  return Math.sqrt(variance);
}

function computeDisciplineScore(trades, evals, opts) {
  const options = opts || {};
  const provisional = !options.hasGuardrails;
  const total = trades.length;
  const brokenByTrade = new Set(evals.filter((e) => e.outcome === 'broken').map((e) => e.trade_id));
  const cleanTrades = trades.filter((t) => !brokenByTrade.has(t.id)).length;

  const dims = [];

  // 1) Rule adherence — % of trades with no rule break
  dims.push({
    key: 'rule_adherence', label: 'Rule adherence', weight: 0.35,
    hasData: total >= 3,
    value: total > 0 ? Math.round((cleanTrades / total) * 100) : 0,
  });

  // 2) Setup adherence — % of trades where a valid setup was present (not "No Setup")
  const noSetupBroken = new Set(evals.filter((e) => e.rule_key === 'no_setup' && e.outcome === 'broken').map((e) => e.trade_id));
  dims.push({
    key: 'setup_adherence', label: 'Setup adherence', weight: 0.20,
    hasData: total >= 3,
    value: total > 0 ? Math.round((1 - noSetupBroken.size / total) * 100) : 0,
  });

  // 3) Post-loss discipline — % of post-loss trades with NO rule break
  const ordered = [...trades].sort((a, b) => {
    const d = String(a.trade_date || '').localeCompare(String(b.trade_date || ''));
    return d !== 0 ? d : String(a.id).localeCompare(String(b.id));
  });
  let postLossTotal = 0, postLossClean = 0;
  for (let i = 1; i < ordered.length; i++) {
    const prevPnl = Number(ordered[i - 1].pnl);
    if (Number.isFinite(prevPnl) && prevPnl < 0) {
      postLossTotal++;
      if (!brokenByTrade.has(ordered[i].id)) postLossClean++;
    }
  }
  dims.push({
    key: 'post_loss_discipline', label: 'Post-loss discipline', weight: 0.25,
    hasData: postLossTotal >= 3,
    value: postLossTotal > 0 ? Math.round((postLossClean / postLossTotal) * 100) : 0,
  });

  // 4) Risk consistency — steadiness of $ risk per trade (process, not P&L)
  const risks = [];
  trades.forEach((t) => {
    const entry = Number(t.entry_price), sl = Number(t.stop_loss), lot = Number(t.lot_size);
    if (Number.isFinite(entry) && Number.isFinite(sl) && Number.isFinite(lot) && lot > 0 && entry !== sl) {
      risks.push(Math.abs(entry - sl) * lot);
    }
  });
  let riskValue = 0, riskHasData = false;
  if (risks.length >= 3) {
    const mean = risks.reduce((a, b) => a + b, 0) / risks.length;
    const cv = mean > 0 ? stdev(risks) / mean : 0;
    riskValue = Math.round(Math.max(0, Math.min(1, 1 - cv)) * 100);
    riskHasData = true;
  }
  dims.push({ key: 'risk_consistency', label: 'Risk consistency', weight: 0.20, hasData: riskHasData, value: riskValue });

  // Weighted composite over dimensions with data (renormalized)
  const active = dims.filter((d) => d.hasData);
  const wSum = active.reduce((a, d) => a + d.weight, 0);
  const score = wSum > 0 ? Math.round(active.reduce((a, d) => a + d.weight * d.value, 0) / wSum) : null;

  return { score, provisional, dimensions: dims, cleanTrades, totalTrades: total };
}

/* Loss-attribution categories — mirrors fetchLossAttribution so figures match. */
function makeLossCategories() {
  return {
    not_following_setup: { key: 'not_following_setup', label: 'Not Following Setups', ruleKeys: ['setup_adherence', 'no_setup'], totalLoss: 0, count: 0, action: 'Only take trades when a valid setup is present — no setup, no trade.' },
    fomo: { key: 'fomo', label: 'FOMO Trading', ruleKeys: ['fomo'], totalLoss: 0, count: 0, action: 'Only enter on a predefined setup — skip impulsive entries.' },
    over_sizing: { key: 'over_sizing', label: 'Over-Sizing', ruleKeys: ['max_lot_size', 'risk_per_trade'], totalLoss: 0, count: 0, action: 'Keep risk within your defined per-trade limit.' },
    over_trading: { key: 'over_trading', label: 'Over-Trading', ruleKeys: ['over_trading'], totalLoss: 0, count: 0, action: 'Stop once you hit your daily trade limit.' },
    bad_sl: { key: 'bad_sl', label: 'Bad Stop Loss', ruleKeys: ['bad_sl'], totalLoss: 0, count: 0, action: 'Place your stop at your planned invalidation and leave it.' },
    daily_loss_limit: { key: 'daily_loss_limit', label: 'Daily Loss Limit Breached', ruleKeys: ['daily_loss_limit'], totalLoss: 0, count: 0, action: 'Stop trading for the day once you hit your daily loss limit.' },
  };
}

/* ─── Fetch analytics overview data ──── */

export async function fetchAnalyticsOverview(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  // Fetch evaluations
  let evalQuery = supabase
    .from('trade_rule_evaluations')
    .select('rule_key, rule_label, outcome, trade_id, trade_date, evidence')
    .eq('user_id', user.id);

  if (accountId) evalQuery = evalQuery.eq('account_id', accountId);
  if (from) evalQuery = evalQuery.gte('trade_date', from);
  if (to) evalQuery = evalQuery.lte('trade_date', to);

  const { data: evaluations, error: evalErr } = await evalQuery;
  // Non-fatal: if evaluations table doesn't exist yet, continue with empty
  const evals = evalErr ? [] : (evaluations || []);

  // Fetch trades for the same range
  let tradeQuery = supabase
    .from('trades')
    .select('id, pnl, trade_date, pair, direction, setup_ids, setup_follow_map, no_setup_reason, lot_size, session, account_id')
    .eq('user_id', user.id);

  if (accountId) tradeQuery = tradeQuery.eq('account_id', accountId);
  if (from) tradeQuery = tradeQuery.gte('trade_date', from);
  if (to) tradeQuery = tradeQuery.lte('trade_date', to);
  tradeQuery = tradeQuery.order('trade_date', { ascending: false });

  const { data: trades, error: tradeErr } = await tradeQuery;
  if (tradeErr) return { error: tradeErr.message };

  // Compute overview stats
  const tradeList = trades || [];
  const totalTrades = tradeList.length;
  const totalBreaches = evals.filter((e) => e.outcome === 'broken').length;
  const uniqueBreachedTradeIds = new Set(evals.filter((e) => e.outcome === 'broken').map((e) => e.trade_id));
  const breachedTrades = tradeList.filter((t) => uniqueBreachedTradeIds.has(t.id));
  const lossFromBreaches = breachedTrades.reduce((sum, t) => {
    const pnl = Number(t.pnl);
    return sum + (Number.isFinite(pnl) && pnl < 0 ? Math.abs(pnl) : 0);
  }, 0);

  // Strongest adherence (rule with highest follow rate)
  const ruleStats = {};
  evals.forEach((e) => {
    if (!ruleStats[e.rule_key]) ruleStats[e.rule_key] = { label: e.rule_label, followed: 0, broken: 0, total: 0 };
    ruleStats[e.rule_key].total++;
    if (e.outcome === 'followed') ruleStats[e.rule_key].followed++;
    if (e.outcome === 'broken') ruleStats[e.rule_key].broken++;
  });

  const ruleEntries = Object.entries(ruleStats).filter(([, s]) => s.total >= 3);
  const strongest = ruleEntries.length > 0
    ? ruleEntries.sort((a, b) => (b[1].followed / b[1].total) - (a[1].followed / a[1].total))[0]
    : null;
  const weakest = ruleEntries.length > 0
    ? ruleEntries.sort((a, b) => (b[1].broken / b[1].total) - (a[1].broken / a[1].total))[0]
    : null;

  return {
    totalTrades,
    totalBreaches,
    uniqueBreachedTrades: uniqueBreachedTradeIds.size,
    lossFromBreaches: Math.round(lossFromBreaches * 100) / 100,
    strongestAdherence: strongest ? { key: strongest[0], label: strongest[1].label, rate: Math.round((strongest[1].followed / strongest[1].total) * 100) } : null,
    biggestLeak: weakest ? { key: weakest[0], label: weakest[1].label, rate: Math.round((weakest[1].broken / weakest[1].total) * 100), count: weakest[1].broken } : null,
    ruleStats,
  };
}

/* ─── Overview V2: Discipline Score + #1 Problem + #1 Strength ──── */

export async function fetchAnalyticsOverviewV2(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  async function gather(rangeFrom, rangeTo) {
    let eq = supabase
      .from('trade_rule_evaluations')
      .select('rule_key, rule_label, outcome, trade_id, trade_date')
      .eq('user_id', user.id);
    if (accountId) eq = eq.eq('account_id', accountId);
    if (rangeFrom) eq = eq.gte('trade_date', rangeFrom);
    if (rangeTo) eq = eq.lte('trade_date', rangeTo);
    const { data: evData, error: evErr } = await eq;
    const evs = evErr ? [] : (evData || []);

    let tq = supabase
      .from('trades')
      .select('id, pnl, trade_date, entry_price, stop_loss, lot_size, account_id')
      .eq('user_id', user.id);
    if (accountId) tq = tq.eq('account_id', accountId);
    if (rangeFrom) tq = tq.gte('trade_date', rangeFrom);
    if (rangeTo) tq = tq.lte('trade_date', rangeTo);
    const { data: tData, error: tErr } = await tq;
    if (tErr) return { error: tErr.message };
    return { evs, trades: tData || [] };
  }

  const cur = await gather(from, to);
  if (cur.error) return { error: cur.error };
  const { evs, trades } = cur;

  // Guardrail presence (for provisional flag). Non-fatal if table missing.
  let hasGuardrails = false;
  try {
    const { count: guardrailCount, error: gErr } = await supabase
      .from('rulebook_rules')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('enabled', true);
    hasGuardrails = !gErr && (guardrailCount || 0) > 0;
  } catch (e) { hasGuardrails = false; }

  const scoreData = computeDisciplineScore(trades, evs, { hasGuardrails });

  // Previous-period delta (only for bounded presets)
  let delta = null;
  const prev = getPreviousDateRange(preset);
  if (prev) {
    const p = await gather(prev.from, prev.to);
    if (!p.error && p.trades.length >= 3) {
      const prevScore = computeDisciplineScore(p.trades, p.evs, { hasGuardrails }).score;
      if (prevScore != null && scoreData.score != null) delta = scoreData.score - prevScore;
    }
  }

  // Basic stats
  const total = trades.length;
  const pnlById = {};
  trades.forEach((t) => { pnlById[t.id] = Number(t.pnl); });
  const brokenEvals = evs.filter((e) => e.outcome === 'broken');
  const brokenSet = new Set(brokenEvals.map((e) => e.trade_id));
  const lossFromBreaches = [...brokenSet].reduce((s, id) => {
    const p = pnlById[id];
    return s + (Number.isFinite(p) && p < 0 ? Math.abs(p) : 0);
  }, 0);

  // Loss-attribution categories (mirrors the Loss Attribution tab)
  const cats = makeLossCategories();
  brokenEvals.forEach((b) => {
    for (const key of Object.keys(cats)) {
      if (cats[key].ruleKeys.includes(b.rule_key)) {
        cats[key].count++;
        const p = pnlById[b.trade_id];
        if (Number.isFinite(p) && p < 0) cats[key].totalLoss += Math.abs(p);
        break;
      }
    }
  });
  const catList = Object.values(cats).filter((c) => c.count > 0).sort((a, b) => b.totalLoss - a.totalLoss);
  const totalAttributable = catList.reduce((s, c) => s + c.totalLoss, 0);
  const top = catList[0] || null;
  const problem = top ? {
    key: top.key,
    label: top.label,
    violations: top.count,
    attributableLoss: Math.round(top.totalLoss * 100) / 100,
    pctOfAttributable: totalAttributable > 0 ? Math.round((top.totalLoss / totalAttributable) * 100) : 0,
    action: top.action,
  } : null;

  // Strength — highest follow-rate rule, excluding the #1 problem's rule keys
  // so the two cards never surface the same behavior.
  const ruleStats = {};
  evs.forEach((e) => {
    if (!ruleStats[e.rule_key]) ruleStats[e.rule_key] = { key: e.rule_key, label: e.rule_label, followed: 0, broken: 0, total: 0 };
    ruleStats[e.rule_key].total++;
    if (e.outcome === 'followed') ruleStats[e.rule_key].followed++;
    if (e.outcome === 'broken') ruleStats[e.rule_key].broken++;
  });
  const excluded = new Set(top ? top.ruleKeys : []);
  const strengthEntries = Object.values(ruleStats)
    .filter((s) => s.total >= 3 && !excluded.has(s.key) && (s.followed + s.broken) > 0)
    .sort((a, b) => (b.followed / b.total) - (a.followed / a.total));
  const st = strengthEntries[0] || null;
  const strength = st ? {
    key: st.key,
    label: st.label,
    rate: Math.round((st.followed / st.total) * 100),
    followedCount: st.followed,
  } : null;

  return {
    totalTrades: total,
    totalBreaches: brokenEvals.length,
    uniqueBreachedTrades: brokenSet.size,
    lossFromBreaches: Math.round(lossFromBreaches * 100) / 100,
    disciplineScore: { ...scoreData, delta },
    problem,
    strength,
    hasGuardrails,
  };
}

/* ─── Setup Analytics ──── */

export async function fetchSetupAnalytics(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  // Fetch trades with setup data
  let query = supabase
    .from('trades')
    .select('id, pnl, trade_date, pair, direction, setup_ids, setup_follow_map, setup_followed, no_setup_reason, lot_size, setup')
    .eq('user_id', user.id);

  if (accountId) query = query.eq('account_id', accountId);
  if (from) query = query.gte('trade_date', from);
  if (to) query = query.lte('trade_date', to);
  query = query.order('trade_date', { ascending: false });

  const { data: trades, error } = await query;
  if (error) return { error: error.message };

  // Fetch user's defined setups for labels
  let setupQuery = supabase.from('setups').select('id, name').eq('user_id', user.id);
  const { data: setups } = await setupQuery;
  const setupMap = {};
  (setups || []).forEach((s) => { setupMap[s.id] = s.name; });

  // Group by setup
  const setupStats = {};
  (trades || []).forEach((t) => {
    const ids = Array.isArray(t.setup_ids) && t.setup_ids.length > 0 ? t.setup_ids : (t.setup ? [t.setup] : ['No Setup']);
    ids.forEach((sid) => {
      const name = setupMap[sid] || sid;
      if (!setupStats[name]) setupStats[name] = { name, count: 0, wins: 0, losses: 0, totalPnl: 0, followed: 0, partial: 0, notFollowed: 0, badSl: 0, noSetup: 0, trades: [] };
      const s = setupStats[name];
      s.count++;
      const pnl = Number(t.pnl);
      if (Number.isFinite(pnl)) {
        s.totalPnl += pnl;
        if (pnl > 0) s.wins++;
        else if (pnl < 0) s.losses++;
      }
      // Check Bad SL from setup names
      const setupNames = ids.map((id) => setupMap[id] || id);
      if (setupNames.some((n) => n.toLowerCase() === 'bad sl')) s.badSl++;
      if (t.no_setup_reason) s.noSetup++;

      // Setup follow from follow_map
      const followValue = t.setup_follow_map && t.setup_follow_map[sid];
      if (followValue === 'yes') s.followed++;
      else if (followValue === 'partial') s.partial++;
      else if (followValue === 'no') s.notFollowed++;

      // Keep last 5 trades for drill-down
      if (s.trades.length < 20) {
        s.trades.push({ id: t.id, pair: t.pair, direction: t.direction, pnl: t.pnl, trade_date: t.trade_date });
      }
    });
  });

  // Rule-break cost for behavior-marker setups (No Setup / Bad SL), so the UI can
  // explain that a profitable-looking marker is still a discipline leak.
  const behaviorCost = { 'No Setup': 0, 'Bad SL': 0 };
  {
    let bq = supabase
      .from('trade_rule_evaluations')
      .select('rule_key, outcome, trade_id')
      .eq('user_id', user.id)
      .eq('outcome', 'broken')
      .in('rule_key', ['no_setup', 'bad_sl']);
    if (accountId) bq = bq.eq('account_id', accountId);
    if (from) bq = bq.gte('trade_date', from);
    if (to) bq = bq.lte('trade_date', to);
    const { data: bev } = await bq;
    const ids = [...new Set((bev || []).map((e) => e.trade_id))];
    const pnlMap = {};
    if (ids.length > 0) {
      const { data: btr } = await supabase
        .from('trades')
        .select('id, pnl')
        .eq('user_id', user.id)
        .in('id', ids);
      (btr || []).forEach((t) => { pnlMap[t.id] = Number(t.pnl); });
    }
    (bev || []).forEach((e) => {
      const p = pnlMap[e.trade_id];
      if (Number.isFinite(p) && p < 0) {
        const bucket = e.rule_key === 'no_setup' ? 'No Setup' : 'Bad SL';
        behaviorCost[bucket] += Math.abs(p);
      }
    });
  }

  // Convert to sorted array (most used first)
  const result = Object.values(setupStats)
    .sort((a, b) => b.count - a.count)
    .map((s) => ({
      ...s,
      totalPnl: Math.round(s.totalPnl * 100) / 100,
      adherenceRate: (s.followed + s.partial + s.notFollowed) > 0
        ? Math.round((s.followed / (s.followed + s.partial + s.notFollowed)) * 100)
        : null,
      improvementPriority: s.notFollowed + s.badSl + s.noSetup, // higher = needs more attention
      ruleBreakCost: behaviorCost[s.name] ? Math.round(behaviorCost[s.name] * 100) / 100 : null,
    }));

  return { setups: result, totalTrades: (trades || []).length };
}

/* ─── Rule Breach Analytics ──── */

export async function fetchRuleBreachAnalytics(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  // Fetch evaluations
  let evalQuery = supabase
    .from('trade_rule_evaluations')
    .select('rule_key, rule_label, outcome, trade_id, trade_date, evidence')
    .eq('user_id', user.id);

  if (accountId) evalQuery = evalQuery.eq('account_id', accountId);
  if (from) evalQuery = evalQuery.gte('trade_date', from);
  if (to) evalQuery = evalQuery.lte('trade_date', to);

  const { data: evaluations, error: evalErr } = await evalQuery;
  if (evalErr) return { error: evalErr.message };

  // Fetch matching trades for drill-down
  const brokenTradeIds = [...new Set((evaluations || []).filter((e) => e.outcome === 'broken').map((e) => e.trade_id))];
  let tradeMap = {};
  if (brokenTradeIds.length > 0) {
    const PAGE = 100;
    for (let i = 0; i < brokenTradeIds.length; i += PAGE) {
      const batch = brokenTradeIds.slice(i, i + PAGE);
      const { data: trades } = await supabase
        .from('trades')
        .select('id, pair, direction, pnl, trade_date, lot_size')
        .eq('user_id', user.id)
        .in('id', batch);
      (trades || []).forEach((t) => { tradeMap[t.id] = t; });
    }
  }

  // Group by rule_key
  const ruleBreaches = {};
  (evaluations || []).forEach((e) => {
    if (!ruleBreaches[e.rule_key]) ruleBreaches[e.rule_key] = { key: e.rule_key, label: e.rule_label, broken: 0, followed: 0, unknown: 0, total: 0, lossAmount: 0, trades: [], monthlyBreakdown: {} };
    const r = ruleBreaches[e.rule_key];
    r.total++;
    if (e.outcome === 'broken') {
      r.broken++;
      const trade = tradeMap[e.trade_id];
      if (trade) {
        const pnl = Number(trade.pnl);
        if (Number.isFinite(pnl) && pnl < 0) r.lossAmount += Math.abs(pnl);
        if (r.trades.length < 20) {
          r.trades.push({ id: trade.id, pair: trade.pair, direction: trade.direction, pnl: trade.pnl, trade_date: trade.trade_date });
        }
      }
      // Monthly breakdown
      if (e.trade_date) {
        const month = e.trade_date.slice(0, 7);
        r.monthlyBreakdown[month] = (r.monthlyBreakdown[month] || 0) + 1;
      }
    } else if (e.outcome === 'followed') {
      r.followed++;
    } else {
      r.unknown++;
    }
  });

  // Sort by breach count (most broken first)
  const result = Object.values(ruleBreaches)
    .filter((r) => r.broken > 0 || r.followed > 0)
    .sort((a, b) => b.broken - a.broken)
    .map((r) => ({
      ...r,
      lossAmount: Math.round(r.lossAmount * 100) / 100,
      breachRate: r.total > 0 ? Math.round((r.broken / r.total) * 100) : 0,
    }));

  return { rules: result, totalEvaluations: (evaluations || []).length };
}

/* ─── Day Pattern Analytics ──── */

export async function fetchDayPatternAnalytics(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  let query = supabase
    .from('trades')
    .select('id, pnl, trade_date, pair, direction, lot_size, created_at, entry_price, stop_loss')
    .eq('user_id', user.id);

  if (accountId) query = query.eq('account_id', accountId);
  if (from) query = query.gte('trade_date', from);
  if (to) query = query.lte('trade_date', to);
  query = query.order('trade_date', { ascending: true }).order('created_at', { ascending: true });

  const { data: trades, error } = await query;
  if (error) return { error: error.message };

  // Fetch evaluations for breach data
  let evalQuery = supabase
    .from('trade_rule_evaluations')
    .select('trade_id, outcome, rule_key')
    .eq('user_id', user.id)
    .eq('outcome', 'broken');

  if (accountId) evalQuery = evalQuery.eq('account_id', accountId);
  if (from) evalQuery = evalQuery.gte('trade_date', from);
  if (to) evalQuery = evalQuery.lte('trade_date', to);

  const { data: breachEvals } = await evalQuery;
  const breachTradeIds = new Set((breachEvals || []).map((e) => e.trade_id));

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Group by date and weekday
  const dateStats = {};
  const weekdayStats = {};
  DAYS.forEach((d) => { weekdayStats[d] = { day: d, trades: 0, pnl: 0, wins: 0, losses: 0, breaches: 0, tradeList: [] }; });

  (trades || []).forEach((t) => {
    const pnl = Number(t.pnl) || 0;
    const date = t.trade_date;
    if (!date) return;

    // Date stats
    if (!dateStats[date]) dateStats[date] = { date, pnl: 0, trades: 0, wins: 0, losses: 0, tradeList: [] };
    dateStats[date].pnl += pnl;
    dateStats[date].trades++;
    if (pnl > 0) dateStats[date].wins++;
    if (pnl < 0) dateStats[date].losses++;
    if (dateStats[date].tradeList.length < 10) {
      dateStats[date].tradeList.push({ id: t.id, pair: t.pair, direction: t.direction, pnl: t.pnl });
    }

    // Weekday stats
    const dayIndex = new Date(date + 'T00:00:00Z').getUTCDay();
    const dayName = DAYS[dayIndex];
    weekdayStats[dayName].trades++;
    weekdayStats[dayName].pnl += pnl;
    if (pnl > 0) weekdayStats[dayName].wins++;
    if (pnl < 0) weekdayStats[dayName].losses++;
    if (breachTradeIds.has(t.id)) weekdayStats[dayName].breaches++;
    if (weekdayStats[dayName].tradeList.length < 10) {
      weekdayStats[dayName].tradeList.push({ id: t.id, pair: t.pair, direction: t.direction, pnl: t.pnl, trade_date: date });
    }
  });

  // Best and worst dates
  const dateEntries = Object.values(dateStats);
  const bestDate = dateEntries.length > 0 ? dateEntries.sort((a, b) => b.pnl - a.pnl)[0] : null;
  const worstDate = dateEntries.length > 0 ? dateEntries.sort((a, b) => a.pnl - b.pnl)[0] : null;

  // Weekday analysis
  const weekdayList = Object.values(weekdayStats)
    .filter((w) => w.trades > 0)
    .map((w) => ({
      ...w,
      pnl: Math.round(w.pnl * 100) / 100,
      avgPnl: w.trades > 0 ? Math.round((w.pnl / w.trades) * 100) / 100 : 0,
      winRate: w.trades > 0 ? Math.round((w.wins / w.trades) * 100) : 0,
      breachRate: w.trades > 0 ? Math.round((w.breaches / w.trades) * 100) : 0,
    }));

  // Monday comparison
  const monday = weekdayStats['Monday'];
  const otherDays = Object.entries(weekdayStats).filter(([d]) => d !== 'Monday' && d !== 'Sunday' && d !== 'Saturday');
  const otherAvgPnl = otherDays.reduce((sum, [, s]) => sum + s.pnl, 0) / Math.max(otherDays.filter(([, s]) => s.trades > 0).length, 1);

  // ── After-loss / after-win behavior + trade-number analysis ──
  // seq is already chronological (trade_date asc, created_at asc).
  const seq = trades || [];
  const riskOf = (t) => {
    const e = Number(t.entry_price), s = Number(t.stop_loss), l = Number(t.lot_size);
    return (Number.isFinite(e) && Number.isFinite(s) && Number.isFinite(l) && l > 0 && e !== s) ? Math.abs(e - s) * l : null;
  };
  let baselineRiskSum = 0, baselineRiskN = 0;
  seq.forEach((t) => { const r = riskOf(t); if (r != null) { baselineRiskSum += r; baselineRiskN++; } });
  const afterLoss = { total: 0, wins: 0, sumPnl: 0, riskSum: 0, riskN: 0 };
  const afterWin = { total: 0, wins: 0, sumPnl: 0 };
  for (let i = 1; i < seq.length; i++) {
    const prev = Number(seq[i - 1].pnl);
    const cur = Number(seq[i].pnl);
    if (!Number.isFinite(prev)) continue;
    if (prev < 0) {
      afterLoss.total++;
      if (Number.isFinite(cur)) { afterLoss.sumPnl += cur; if (cur > 0) afterLoss.wins++; }
      const r = riskOf(seq[i]); if (r != null) { afterLoss.riskSum += r; afterLoss.riskN++; }
    } else if (prev > 0) {
      afterWin.total++;
      if (Number.isFinite(cur)) { afterWin.sumPnl += cur; if (cur > 0) afterWin.wins++; }
    }
  }
  const afterEvents = {
    afterLoss: {
      total: afterLoss.total,
      winRate: afterLoss.total > 0 ? Math.round((afterLoss.wins / afterLoss.total) * 100) : 0,
      avgPnl: afterLoss.total > 0 ? Math.round((afterLoss.sumPnl / afterLoss.total) * 100) / 100 : 0,
      avgRisk: afterLoss.riskN >= 3 ? Math.round((afterLoss.riskSum / afterLoss.riskN) * 100) / 100 : null,
    },
    afterWin: {
      total: afterWin.total,
      winRate: afterWin.total > 0 ? Math.round((afterWin.wins / afterWin.total) * 100) : 0,
      avgPnl: afterWin.total > 0 ? Math.round((afterWin.sumPnl / afterWin.total) * 100) / 100 : 0,
    },
    baselineAvgRisk: baselineRiskN >= 3 ? Math.round((baselineRiskSum / baselineRiskN) * 100) / 100 : null,
  };

  // Trade-number within each day (1st / 2nd / 3rd / 4th+)
  const byDay = {};
  seq.forEach((t) => { if (t.trade_date) (byDay[t.trade_date] = byDay[t.trade_date] || []).push(t); });
  const numBuckets = {};
  Object.values(byDay).forEach((list) => {
    list.forEach((t, idx) => {
      const k = idx < 3 ? String(idx + 1) : '4+';
      const b = numBuckets[k] = numBuckets[k] || { k, trades: 0, wins: 0, sumPnl: 0 };
      b.trades++;
      const p = Number(t.pnl);
      if (Number.isFinite(p)) { b.sumPnl += p; if (p > 0) b.wins++; }
    });
  });
  const numLabels = { '1': '1st', '2': '2nd', '3': '3rd', '4+': '4th+' };
  const tradeNumbers = ['1', '2', '3', '4+']
    .filter((k) => numBuckets[k])
    .map((k) => {
      const b = numBuckets[k];
      return {
        label: numLabels[k],
        trades: b.trades,
        winRate: b.trades > 0 ? Math.round((b.wins / b.trades) * 100) : 0,
        avgPnl: b.trades > 0 ? Math.round((b.sumPnl / b.trades) * 100) / 100 : 0,
      };
    });

  return {
    bestDate: bestDate ? { ...bestDate, pnl: Math.round(bestDate.pnl * 100) / 100 } : null,
    worstDate: worstDate ? { ...worstDate, pnl: Math.round(worstDate.pnl * 100) / 100 } : null,
    weekdays: weekdayList,
    mondayComparison: {
      mondayPnl: Math.round(monday.pnl * 100) / 100,
      mondayTrades: monday.trades,
      mondayWinRate: monday.trades > 0 ? Math.round((monday.wins / monday.trades) * 100) : 0,
      otherDaysAvgPnl: Math.round(otherAvgPnl * 100) / 100,
      isMonday_worse: monday.trades >= 3 && (monday.pnl / Math.max(monday.trades, 1)) < (otherAvgPnl / Math.max(otherDays.filter(([, s]) => s.trades > 0).length, 1)),
    },
    afterEvents,
    tradeNumbers,
    totalTrades: (trades || []).length,
    sampleSize: dateEntries.length,
  };
}

/* ─── Loss Attribution Analytics ──── */

export async function fetchLossAttribution(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  // Fetch broken evaluations with their trades
  let evalQuery = supabase
    .from('trade_rule_evaluations')
    .select('rule_key, rule_label, outcome, trade_id, evidence')
    .eq('user_id', user.id)
    .eq('outcome', 'broken');

  if (accountId) evalQuery = evalQuery.eq('account_id', accountId);
  if (from) evalQuery = evalQuery.gte('trade_date', from);
  if (to) evalQuery = evalQuery.lte('trade_date', to);

  const { data: breaches, error: evalErr } = await evalQuery;
  if (evalErr) return { error: evalErr.message };

  // Fetch trades for drill-down
  const tradeIds = [...new Set((breaches || []).map((e) => e.trade_id))];
  let tradeMap = {};
  if (tradeIds.length > 0) {
    const PAGE = 100;
    for (let i = 0; i < tradeIds.length; i += PAGE) {
      const batch = tradeIds.slice(i, i + PAGE);
      const { data: trades } = await supabase
        .from('trades')
        .select('id, pair, direction, pnl, trade_date, lot_size')
        .eq('user_id', user.id)
        .in('id', batch);
      (trades || []).forEach((t) => { tradeMap[t.id] = t; });
    }
  }

  // Group into loss attribution categories
  const categories = {
    over_sizing: { label: 'Over-Sizing', ruleKeys: ['max_lot_size', 'risk_per_trade'], trades: [], totalLoss: 0, count: 0 },
    fomo: { label: 'FOMO Trading', ruleKeys: ['fomo'], trades: [], totalLoss: 0, count: 0 },
    over_trading: { label: 'Over-Trading', ruleKeys: ['over_trading'], trades: [], totalLoss: 0, count: 0 },
    not_following_setup: { label: 'Not Following Setups', ruleKeys: ['setup_adherence', 'no_setup'], trades: [], totalLoss: 0, count: 0 },
    bad_sl: { label: 'Bad Stop Loss', ruleKeys: ['bad_sl'], trades: [], totalLoss: 0, count: 0 },
    daily_loss_limit: { label: 'Daily Loss Limit Breached', ruleKeys: ['daily_loss_limit'], trades: [], totalLoss: 0, count: 0 },
  };

  (breaches || []).forEach((b) => {
    const trade = tradeMap[b.trade_id];
    if (!trade) return;

    for (const [catKey, cat] of Object.entries(categories)) {
      if (cat.ruleKeys.includes(b.rule_key)) {
        cat.count++;
        const pnl = Number(trade.pnl);
        if (Number.isFinite(pnl) && pnl < 0) cat.totalLoss += Math.abs(pnl);
        // Avoid duplicate trades in the list
        if (!cat.trades.find((t) => t.id === trade.id) && cat.trades.length < 20) {
          cat.trades.push({ id: trade.id, pair: trade.pair, direction: trade.direction, pnl: trade.pnl, trade_date: trade.trade_date });
        }
        break; // Each breach maps to one category
      }
    }
  });

  const result = Object.entries(categories)
    .map(([key, cat]) => ({
      key,
      label: cat.label,
      count: cat.count,
      totalLoss: Math.round(cat.totalLoss * 100) / 100,
      trades: cat.trades,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalLoss - a.totalLoss);

  // ── What-if simulator (HISTORICAL simulation — not a prediction, not recoverable profit) ──
  let allQuery = supabase.from('trades').select('id, pnl').eq('user_id', user.id);
  if (accountId) allQuery = allQuery.eq('account_id', accountId);
  if (from) allQuery = allQuery.gte('trade_date', from);
  if (to) allQuery = allQuery.lte('trade_date', to);
  const { data: allTrades } = await allQuery;
  const pnlAll = (allTrades || [])
    .map((t) => ({ id: t.id, pnl: Number(t.pnl) }))
    .filter((t) => Number.isFinite(t.pnl));
  const currentPnl = pnlAll.reduce((s, t) => s + t.pnl, 0);

  // Per-category set of trade ids exhibiting that behavior (any matching broken rule).
  const catSets = {};
  Object.keys(categories).forEach((k) => { catSets[k] = new Set(); });
  (breaches || []).forEach((b) => {
    for (const [k, cat] of Object.entries(categories)) {
      if (cat.ruleKeys.includes(b.rule_key)) catSets[k].add(b.trade_id);
    }
  });
  const whatIf = Object.entries(categories)
    .map(([k, cat]) => {
      const set = catSets[k];
      if (!set || set.size === 0) return null;
      const withoutPnl = pnlAll.filter((t) => !set.has(t.id)).reduce((s, t) => s + t.pnl, 0);
      return {
        key: k,
        label: cat.label,
        excludedCount: set.size,
        withoutPnl: Math.round(withoutPnl * 100) / 100,
        difference: Math.round((withoutPnl - currentPnl) * 100) / 100,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.difference - a.difference);

  return {
    categories: result,
    currentPnl: Math.round(currentPnl * 100) / 100,
    whatIf,
    totalTrades: pnlAll.length,
  };
}

/* ─── Backfill evaluations for all trades ──── */

export async function runBackfill() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Backfill ALL trades regardless of selected account
  // (analytics should evaluate every trade, not just the active account)
  const result = await backfillEvaluations(supabase, user.id, null);

  // Debug: count trades to help diagnose issues
  const { count: tradeCount } = await supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  revalidatePath('/dashboard/analytics');
  return { ...result, debug: { userId: user.id, tradeCount: tradeCount || 0 } };
}

/* ─── Coach hub: Trader Profile + Habits + Best/Worst Conditions + Findings ──── */

export async function fetchCoach(preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  const accountId = await getActiveAccountId(supabase, user.id);
  const { from, to } = getDateRange(preset);

  let tq = supabase
    .from('trades')
    .select('id, pnl, trade_date, created_at, entry_price, stop_loss, lot_size, direction, session, setup, setup_ids, no_setup_reason')
    .eq('user_id', user.id);
  if (accountId) tq = tq.eq('account_id', accountId);
  if (from) tq = tq.gte('trade_date', from);
  if (to) tq = tq.lte('trade_date', to);
  tq = tq.order('trade_date', { ascending: true }).order('created_at', { ascending: true });
  const { data: tData, error: tErr } = await tq;
  if (tErr) return { error: tErr.message };
  const trades = tData || [];
  if (trades.length === 0) return { empty: true };

  let eq = supabase.from('trade_rule_evaluations').select('rule_key, rule_label, outcome, trade_id').eq('user_id', user.id);
  if (accountId) eq = eq.eq('account_id', accountId);
  if (from) eq = eq.gte('trade_date', from);
  if (to) eq = eq.lte('trade_date', to);
  const { data: evData, error: evErr } = await eq;
  const evals = evErr ? [] : (evData || []);

  const { data: setupRows } = await supabase.from('setups').select('id, name').eq('user_id', user.id);
  const setupMap = {};
  (setupRows || []).forEach((s) => { setupMap[s.id] = s.name; });

  let hasGuardrails = false;
  try {
    const { count, error } = await supabase.from('rulebook_rules').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('enabled', true);
    hasGuardrails = !error && (count || 0) > 0;
  } catch (e) { hasGuardrails = false; }

  const score = computeDisciplineScore(trades, evals, { hasGuardrails });
  const pnlById = {};
  trades.forEach((t) => { pnlById[t.id] = Number(t.pnl); });

  // Intra-day trade number
  const byDay = {};
  trades.forEach((t) => { if (t.trade_date) (byDay[t.trade_date] = byDay[t.trade_date] || []).push(t); });
  const tradeNo = new Map();
  Object.values(byDay).forEach((list) => list.forEach((t, idx) => tradeNo.set(t.id, idx < 3 ? String(idx + 1) : '4+')));

  // Risk
  const riskOf = (t) => {
    const e = Number(t.entry_price), s = Number(t.stop_loss), l = Number(t.lot_size);
    return (Number.isFinite(e) && Number.isFinite(s) && Number.isFinite(l) && l > 0 && e !== s) ? Math.abs(e - s) * l : null;
  };
  const risks = trades.map(riskOf).filter((r) => r != null);
  const avgRisk = risks.length >= 3 ? risks.reduce((a, b) => a + b, 0) / risks.length : null;
  const largestRisk = risks.length >= 1 ? Math.max.apply(null, risks) : null;
  let alRiskSum = 0, alRiskN = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = Number(trades[i - 1].pnl);
    if (Number.isFinite(prev) && prev < 0) { const r = riskOf(trades[i]); if (r != null) { alRiskSum += r; alRiskN++; } }
  }
  const afterLossAvgRisk = alRiskN >= 3 ? alRiskSum / alRiskN : null;

  // Habits
  const dayCount = Object.keys(byDay).length;
  const noSetupBroken = new Set(evals.filter((e) => e.rule_key === 'no_setup' && e.outcome === 'broken').map((e) => e.trade_id));
  const overtradingN = trades.filter((t) => { const b = tradeNo.get(t.id); return b === '3' || b === '4+'; }).length;
  const riskDim = score.dimensions.find((d) => d.key === 'risk_consistency');
  const habits = {
    tradesPerDay: dayCount > 0 ? Math.round((trades.length / dayCount) * 10) / 10 : trades.length,
    setupSelectionPct: Math.round((1 - noSetupBroken.size / trades.length) * 100),
    overtradingPct: Math.round((overtradingN / trades.length) * 100),
    avgRisk: avgRisk != null ? Math.round(avgRisk * 100) / 100 : null,
    largestRisk: largestRisk != null ? Math.round(largestRisk * 100) / 100 : null,
    riskConsistency: riskDim && riskDim.hasData ? riskDim.value : null,
    afterLossRiskUp: (afterLossAvgRisk != null && avgRisk != null) ? afterLossAvgRisk > avgRisk : null,
  };

  // Best / worst conditions across dimensions
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function dimValue(t, dim) {
    if (dim === 'Setup') { const ids = Array.isArray(t.setup_ids) && t.setup_ids.length ? t.setup_ids : (t.setup ? [t.setup] : ['No Setup']); return setupMap[ids[0]] || ids[0] || 'No Setup'; }
    if (dim === 'Day') { if (!t.trade_date) return null; return DAYS[new Date(t.trade_date + 'T00:00:00Z').getUTCDay()]; }
    if (dim === 'Session') { return t.session || null; }
    if (dim === 'Direction') { return t.direction === 'long' ? 'Long' : 'Short'; }
    if (dim === 'Trade #') { const b = tradeNo.get(t.id); return b ? '#' + b : null; }
    return null;
  }
  function bucketize(dim) {
    const m = {};
    trades.forEach((t) => {
      const v = dimValue(t, dim);
      if (!v) return;
      const b = m[v] = m[v] || { value: v, n: 0, wins: 0, sum: 0 };
      b.n++;
      const p = Number(t.pnl);
      if (Number.isFinite(p)) { b.sum += p; if (p > 0) b.wins++; }
    });
    return Object.values(m).filter((b) => b.n >= 3).map((b) => ({ dim, value: b.value, n: b.n, winRate: Math.round((b.wins / b.n) * 100), avgPnl: Math.round((b.sum / b.n) * 100) / 100 }));
  }
  const best = [], worst = [];
  ['Setup', 'Day', 'Session', 'Direction', 'Trade #'].forEach((dim) => {
    const arr = bucketize(dim);
    if (arr.length === 0) return;
    const b = arr.slice().sort((x, y) => y.avgPnl - x.avgPnl)[0];
    const w = arr.slice().sort((x, y) => x.avgPnl - y.avgPnl)[0];
    if (b) best.push(b);
    if (w && w.value !== b.value) worst.push(w);
  });

  // #1 leak (loss attribution)
  const cats = makeLossCategories();
  evals.filter((e) => e.outcome === 'broken').forEach((bk) => {
    for (const k of Object.keys(cats)) {
      if (cats[k].ruleKeys.includes(bk.rule_key)) {
        cats[k].count++;
        const p = pnlById[bk.trade_id];
        if (Number.isFinite(p) && p < 0) cats[k].totalLoss += Math.abs(p);
        break;
      }
    }
  });
  const catList = Object.values(cats).filter((c) => c.count > 0).sort((a, b) => b.totalLoss - a.totalLoss);
  const topLeak = catList[0] || null;

  // After-loss vs after-win win rate (for a finding)
  let alT = 0, alW = 0, awT = 0, awW = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = Number(trades[i - 1].pnl), cur = Number(trades[i].pnl);
    if (!Number.isFinite(prev)) continue;
    if (prev < 0) { alT++; if (Number.isFinite(cur) && cur > 0) alW++; }
    else if (prev > 0) { awT++; if (Number.isFinite(cur) && cur > 0) awW++; }
  }

  // Findings (top 3, ranked by impact)
  const findings = [];
  if (topLeak) findings.push({ title: topLeak.label, detail: topLeak.count + ' trades · -$' + (Math.round(topLeak.totalLoss * 100) / 100).toFixed(2), action: topLeak.action });
  if (alT >= 3 && awT > 0) {
    const alWr = Math.round((alW / alT) * 100), awWr = Math.round((awW / awT) * 100);
    if (alWr < awWr - 5) findings.push({ title: 'You trade worse after a loss', detail: 'Win rate ' + alWr + '% after a loss vs ' + awWr + '% after a win.', action: 'Take a mandatory pause after any losing trade before your next entry.' });
  }
  const worstSorted = worst.slice().sort((a, b) => a.avgPnl - b.avgPnl);
  if (worstSorted[0] && worstSorted[0].avgPnl < 0) {
    const w = worstSorted[0];
    findings.push({ title: w.dim + ': ' + w.value + ' is costing you', detail: w.avgPnl.toFixed(2) + ' avg over ' + w.n + ' trades (' + w.winRate + '% win rate).', action: 'Be extra selective on ' + String(w.value).toLowerCase() + ' — or sit it out.' });
  }
  const topFindings = findings.slice(0, 3);

  // Trader profile
  const archetypeMap = {
    not_following_setup: { name: 'The Impulsive Entry Trader', weak: 'Entering trades without a valid setup' },
    fomo: { name: 'The FOMO Chaser', weak: 'Impulsive entries driven by fear of missing out' },
    over_trading: { name: 'The Over-Trader', weak: 'Taking too many trades per session' },
    over_sizing: { name: 'The Over-Sizer', weak: 'Risking too much on single trades' },
    bad_sl: { name: 'The Stop Mover', weak: 'Moving or removing your stop loss' },
    daily_loss_limit: { name: 'The Tilt Trader', weak: 'Trading past your daily loss limit' },
  };
  let arche = (topLeak && archetypeMap[topLeak.key]) ? archetypeMap[topLeak.key] : { name: 'The Developing Trader', weak: 'Still building consistent habits' };
  if (score.score != null && score.score >= 75) arche = { name: 'The Disciplined Operator', weak: 'Only minor lapses remain' };
  const ruleStats = {};
  evals.forEach((e) => { if (!ruleStats[e.rule_key]) ruleStats[e.rule_key] = { label: e.rule_label, f: 0, t: 0 }; ruleStats[e.rule_key].t++; if (e.outcome === 'followed') ruleStats[e.rule_key].f++; });
  const strengthArr = Object.values(ruleStats).filter((r) => r.t >= 3).sort((a, b) => (b.f / b.t) - (a.f / a.t));
  const profile = {
    archetype: arche.name,
    weakness: arche.weak,
    strength: strengthArr[0] ? strengthArr[0].label : 'Consistent logging',
    bestEnvironment: best.slice(0, 4).map((b) => b.dim + ': ' + b.value),
    dangerZone: worstSorted.slice(0, 2).map((w) => w.dim + ': ' + w.value),
    score: score.score,
    nextMilestone: score.score != null ? Math.min(100, (Math.floor(score.score / 5) + 1) * 5) : null,
  };

  return { habits, conditions: { best, worst }, profile, findings: topFindings, priority: topFindings[0] || null, score };
}

/* ─── AI Explanation (on-demand, cached) ──── */

export async function fetchAIExplanation(analysisType, preset) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'You must be signed in.' };

  // Import AI + guardrails
  const { GUARDRAIL_SYSTEM_PROMPT, scanResponse } = await import('@/lib/guardrails');

  // Gather the relevant aggregated data based on analysis type
  let contextData = {};
  if (analysisType === 'overview') {
    contextData = await fetchAnalyticsOverview(preset);
  } else if (analysisType === 'weekday_patterns') {
    contextData = await fetchDayPatternAnalytics(preset);
  } else if (analysisType === 'rule_breaches') {
    contextData = await fetchRuleBreachAnalytics(preset);
  } else if (analysisType === 'loss_attribution') {
    contextData = await fetchLossAttribution(preset);
  } else if (analysisType === 'setup_analysis') {
    contextData = await fetchSetupAnalytics(preset);
  }

  if (contextData.error) return { error: contextData.error };

  const systemPrompt = `${GUARDRAIL_SYSTEM_PROMPT}

You are analyzing AGGREGATED analytics data from a trader's journal. Your job is to:
1. Explain the patterns you see in plain English (like talking to a friend)
2. Identify the single most impactful thing to fix (Next Focus)
3. Note any interesting correlations or patterns the trader might not notice
4. Keep it SHORT — 3-4 paragraphs max

NEVER recommend trades, instruments, or give financial advice.
NEVER estimate future profits or guarantee results.
ALWAYS reference specific numbers from the data provided.
Frame everything as evidence from their own records.`;

  const userContent = `Analysis type: ${analysisType}
Date range: ${preset || 'all time'}

Data:
${JSON.stringify(contextData, null, 2)}

Provide a plain-English analysis with:
1. Key patterns (2-3 bullet points)
2. The "why" behind the numbers (1 paragraph)
3. Next Focus: the single most impactful improvement (1 sentence)`;

  try {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return { error: 'AI is not configured.' };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'X-Title': 'PropLogAI' },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);
    if (!res.ok) {
      const t = await res.text();
      return { error: 'AI request failed: ' + t.slice(0, 200) };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return { error: 'AI returned no content.' };

    // Guardrail check
    const checked = scanResponse(content);
    if (checked.blocked) return { error: 'AI response was blocked by guardrails.' };

    return { explanation: checked.output, warnings: checked.warnings };
  } catch (e) {
    if (e.name === 'AbortError') return { error: 'AI request timed out.' };
    return { error: e.message || 'AI analysis failed.' };
  }
}
