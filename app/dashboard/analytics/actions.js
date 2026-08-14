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
    .select('id, pnl, trade_date, pair, direction, lot_size')
    .eq('user_id', user.id);

  if (accountId) query = query.eq('account_id', accountId);
  if (from) query = query.gte('trade_date', from);
  if (to) query = query.lte('trade_date', to);
  query = query.order('trade_date', { ascending: true });

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

  return { categories: result };
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
