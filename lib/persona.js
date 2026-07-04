/**
 * Persona Engine + Streaks for PropLogAI Phase 2.
 *
 * computePersona(trades, journals) — derives trader profile from data
 * computeStreaks(trades) — calculates logging/profit/discipline streaks
 *
 * All data-driven, no AI calls. Recomputed on every page load.
 */

import { getTradingDate } from '@/lib/stats';

/* ─── Persona ──────────────────────────────────────────────── */

/**
 * Build a trader persona from trade + journal data.
 *
 * @param {Array} trades - trades sorted by trade_date desc
 * @param {Object} journalMap - { trade_id: { emotions[], confidence, note, lesson, tags[] } }
 * @returns {Object} persona profile
 */
export function computePersona(trades, journalMap) {
  if (!trades || trades.length === 0) return null;

  const jmap = journalMap || {};

  // ── Emotion frequency ──
  const emotionCounts = {};
  let emotionTotal = 0;
  trades.forEach((t) => {
    const j = jmap[t.id];
    const emo = j && Array.isArray(j.emotions) ? j.emotions : [];
    emo.forEach((e) => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
      emotionTotal++;
    });
  });
  const emotionsSorted = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1]);
  const mainEmotion = emotionsSorted[0] ? emotionsSorted[0][0] : null;
  const emotionDistribution = emotionsSorted.slice(0, 5).map(([e, c]) => ({
    emotion: e,
    count: c,
    pct: emotionTotal > 0 ? Math.round((c / emotionTotal) * 100) : 0,
  }));

  // ── Common mistakes (from setup adherence) ──
  const noSetupCount = trades.filter((t) => t.setup === 'No Setup' || t.no_setup_reason).length;
  const partialCount = trades.filter((t) => t.setup_followed === 'partial').length;
  const notFollowed = trades.filter((t) => t.setup_followed === 'no').length;
  let commonMistake = null;
  if (noSetupCount > partialCount && noSetupCount > notFollowed) commonMistake = 'Trading without a setup';
  else if (partialCount > 0) commonMistake = 'Partial setup execution';
  else if (notFollowed > 0) commonMistake = 'Ignoring setup rules';

  // ── Session performance ──
  const sessionStats = {};
  trades.forEach((t) => {
    if (!t.session) return;
    if (!sessionStats[t.session]) sessionStats[t.session] = { wins: 0, total: 0, pnl: 0 };
    sessionStats[t.session].total++;
    if (Number(t.pnl) > 0) sessionStats[t.session].wins++;
    sessionStats[t.session].pnl += Number(t.pnl) || 0;
  });
  const sessions = Object.entries(sessionStats).map(([s, d]) => ({
    session: s,
    winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
    pnl: d.pnl,
    total: d.total,
  }));
  sessions.sort((a, b) => b.pnl - a.pnl);
  const bestSession = sessions[0] || null;
  const worstSession = sessions[sessions.length - 1] || null;

  // ── Confidence ──
  const confidences = trades
    .map((t) => jmap[t.id]?.confidence)
    .filter((c) => c != null);
  const avgConfidence = confidences.length > 0
    ? Math.round((confidences.reduce((a, b) => a + b, 0) / confidences.length) * 10) / 10
    : null;
  const confidenceLevel = avgConfidence == null ? null
    : avgConfidence >= 4 ? 'High'
    : avgConfidence >= 2.5 ? 'Medium'
    : 'Low';

  // ── Revenge trading (consecutive losses followed by another trade same day) ──
  const dayTrades = {};
  trades.forEach((t) => {
    const d = t.trade_date || getTradingDate(t.created_at);
    if (!dayTrades[d]) dayTrades[d] = [];
    dayTrades[d].push(t);
  });
  let revengeDays = 0;
  const totalDays = Object.keys(dayTrades).length;
  Object.values(dayTrades).forEach((dt) => {
    // Sort by created_at within day
    dt.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    let consLosses = 0;
    let revengeFound = false;
    dt.forEach((t) => {
      if (Number(t.pnl) < 0) {
        consLosses++;
      } else {
        if (consLosses >= 2) revengeFound = true;
        consLosses = 0;
      }
    });
    if (revengeFound) revengeDays++;
  });
  const revengeFrequency = totalDays > 0
    ? Math.round((revengeDays / totalDays) * 100) / 100
    : 0;

  // ── Setup adherence ──
  const withFollowData = trades.filter((t) => t.setup_followed);
  const followedCount = withFollowData.filter((t) => t.setup_followed === 'yes').length;
  const adherencePct = withFollowData.length > 0
    ? Math.round((followedCount / withFollowData.length) * 100)
    : null;

  return {
    mainEmotion,
    emotionDistribution,
    commonMistake,
    bestSession: bestSession ? { name: bestSession.session, winRate: bestSession.winRate, pnl: bestSession.pnl } : null,
    worstSession: worstSession && sessions.length > 1 ? { name: worstSession.session, winRate: worstSession.winRate, pnl: worstSession.pnl } : null,
    confidenceLevel,
    avgConfidence,
    revengeFrequency,
    revengeDays,
    totalDays,
    adherencePct,
    tradeCount: trades.length,
  };
}

/* ─── Streaks ──────────────────────────────────────────────── */

/**
 * Compute logging, profit, and discipline streaks.
 *
 * @param {Array} trades - all trades sorted by trade_date desc
 * @returns {{ logging: { current, best }, profit: { current, best }, discipline: { current, best } }}
 */
export function computeStreaks(trades) {
  if (!trades || trades.length === 0) {
    return {
      logging: { current: 0, best: 0 },
      profit: { current: 0, best: 0 },
      discipline: { current: 0, best: 0 },
    };
  }

  // Group trades by trading date
  const dayMap = {};
  trades.forEach((t) => {
    const d = t.trade_date || getTradingDate(t.created_at);
    if (!dayMap[d]) dayMap[d] = { trades: [], pnl: 0, allFollowed: true };
    dayMap[d].trades.push(t);
    dayMap[d].pnl += Number(t.pnl) || 0;
    if (t.setup_followed && t.setup_followed !== 'yes') {
      dayMap[d].allFollowed = false;
    }
  });

  // Sort dates ascending
  const dates = Object.keys(dayMap).sort();
  if (dates.length === 0) {
    return {
      logging: { current: 0, best: 0 },
      profit: { current: 0, best: 0 },
      discipline: { current: 0, best: 0 },
    };
  }

  // Helper: check if two date strings are consecutive trading days
  function isConsecutive(d1, d2) {
    const a = new Date(d1);
    const b = new Date(d2);
    const diff = (b - a) / (1000 * 60 * 60 * 24);
    return diff === 1;
  }

  // Compute streaks
  let logCurrent = 1, logBest = 1;
  let profitCurrent = dayMap[dates[dates.length - 1]].pnl > 0 ? 1 : 0;
  let profitBest = profitCurrent;
  let profitRun = profitCurrent;
  let discCurrent = dayMap[dates[dates.length - 1]].allFollowed ? 1 : 0;
  let discBest = discCurrent;
  let discRun = discCurrent;

  // Walk backwards from most recent
  for (let i = dates.length - 2; i >= 0; i--) {
    const consecutive = isConsecutive(dates[i], dates[i + 1]);

    // Logging streak (consecutive days with ANY trades)
    if (i === dates.length - 2) {
      // Start from end
      logCurrent = consecutive ? 2 : 1;
      logBest = logCurrent;
    }
  }

  // Recompute properly walking forward
  let run = 1;
  let best = 1;
  for (let i = 1; i < dates.length; i++) {
    if (isConsecutive(dates[i - 1], dates[i])) { run++; }
    else { run = 1; }
    if (run > best) best = run;
  }
  // Current = streak ending at the most recent date
  let current = 1;
  for (let i = dates.length - 2; i >= 0; i--) {
    if (isConsecutive(dates[i], dates[i + 1])) { current++; }
    else break;
  }
  const logging = { current, best };

  // Profit streak
  run = 0; best = 0; current = 0;
  for (let i = 0; i < dates.length; i++) {
    if (dayMap[dates[i]].pnl > 0) { run++; if (run > best) best = run; }
    else { run = 0; }
  }
  current = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dayMap[dates[i]].pnl > 0) { current++; }
    else break;
  }
  const profit = { current, best };

  // Discipline streak
  run = 0; best = 0; current = 0;
  for (let i = 0; i < dates.length; i++) {
    if (dayMap[dates[i]].allFollowed) { run++; if (run > best) best = run; }
    else { run = 0; }
  }
  current = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dayMap[dates[i]].allFollowed) { current++; }
    else break;
  }
  const discipline = { current, best };

  return { logging, profit, discipline };
}

/* ─── Auto Habits ──────────────────────────────────────────── */

/**
 * Default auto-detected habits (seeded on first load).
 */
export const AUTO_HABITS = [
  { name: 'Log trades daily', key: 'log_daily' },
  { name: 'Tag emotions', key: 'tag_emotions' },
  { name: 'Record lessons', key: 'record_lessons' },
  { name: 'Follow setups', key: 'follow_setups' },
];

/**
 * Check which auto-habits are completed for today.
 *
 * @param {Array} todayTrades - trades for today
 * @param {Object} journalMap - journals for today's trades
 * @returns {Object} { log_daily: bool, tag_emotions: bool, record_lessons: bool, follow_setups: bool }
 */
export function checkAutoHabits(todayTrades, journalMap) {
  const jmap = journalMap || {};
  const hasTrades = todayTrades && todayTrades.length > 0;

  return {
    log_daily: hasTrades,
    tag_emotions: hasTrades && todayTrades.some((t) => {
      const j = jmap[t.id];
      return j && Array.isArray(j.emotions) && j.emotions.length > 0;
    }),
    record_lessons: hasTrades && todayTrades.some((t) => {
      const j = jmap[t.id];
      return j && j.lesson && j.lesson.trim();
    }),
    follow_setups: hasTrades && todayTrades.every((t) => {
      return !t.setup_followed || t.setup_followed === 'yes';
    }),
  };
}
