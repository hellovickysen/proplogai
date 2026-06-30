import { num } from './stats';

export function computeDisciplineStats(trades, journals) {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return { journalStreak: 0, setupDiscipline: 0, noRevengeStreak: 0, noSetupCount: 0, totalTrades: 0 };
  }

  const journaledTradeIds = new Set((journals || []).map((j) => j.trade_id));

  const sorted = [...trades].sort(
    (a, b) => new Date(a.trade_date || a.created_at) - new Date(b.trade_date || b.created_at)
  );

  // Journal streak: consecutive trading days with at least one journal entry
  const tradingDays = {};
  sorted.forEach((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    if (!d) return;
    if (!tradingDays[d]) tradingDays[d] = { traded: true, journaled: false };
    if (journaledTradeIds.has(t.id)) tradingDays[d].journaled = true;
  });

  const dayKeys = Object.keys(tradingDays).sort().reverse();
  let journalStreak = 0;
  for (const dk of dayKeys) {
    if (tradingDays[dk].journaled) journalStreak++;
    else break;
  }

  // Setup discipline: % of trades where setup_followed === 'yes'
  const tradesWithFollowed = trades.filter((t) => t.setup_followed);
  const followedYes = tradesWithFollowed.filter((t) => t.setup_followed === 'yes').length;
  const setupDiscipline = tradesWithFollowed.length > 0
    ? Math.round((followedYes / tradesWithFollowed.length) * 100)
    : 0;

  // No revenge streak: consecutive trading days without No Setup trades
  let noRevengeStreak = 0;
  for (const dk of dayKeys) {
    const dayTrades = sorted.filter((t) => (t.trade_date || (t.created_at || '').slice(0, 10)) === dk);
    const hasNoSetup = dayTrades.some((t) => t.setup === 'No Setup' || t.no_setup_reason);
    if (!hasNoSetup) noRevengeStreak++;
    else break;
  }

  // No setup trades this week
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const noSetupCount = trades.filter((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    return d >= weekStr && (t.setup === 'No Setup' || t.no_setup_reason);
  }).length;

  return { journalStreak, setupDiscipline, noRevengeStreak, noSetupCount, totalTrades };
}

/* ─── Gamification: Weekly score + achievements ───────────────── */

/**
 * Shared pure function: compute the numeric score (0-100) for a set of
 * trades within a single week window, given the set of journaled trade IDs.
 *
 * Weights:
 *   Journal consistency: 25 pts (% of trading days with journal)
 *   Setup discipline:    30 pts (% of trades that followed setup)
 *   No revenge:          25 pts (% of trading days without No Setup)
 *   Trade volume:        20 pts (5+ trades = full marks)
 */
function calculateWeekScore(weekTrades, journaledIds) {
  if (weekTrades.length === 0) return 0;

  const dayMap = {};
  weekTrades.forEach((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    if (!d) return;
    if (!dayMap[d]) dayMap[d] = { journaled: false, hasNoSetup: false };
    if (journaledIds.has(t.id)) dayMap[d].journaled = true;
    if (t.setup === 'No Setup' || t.no_setup_reason) dayMap[d].hasNoSetup = true;
  });

  const tradeDays = Object.keys(dayMap).length;
  const journaledDays = Object.values(dayMap).filter((d) => d.journaled).length;
  const cleanDays = Object.values(dayMap).filter((d) => !d.hasNoSetup).length;

  const journalPct = tradeDays > 0 ? journaledDays / tradeDays : 0;

  const withFollowed = weekTrades.filter((t) => t.setup_followed);
  const followedYes = withFollowed.filter((t) => t.setup_followed === 'yes').length;
  const disciplinePct = withFollowed.length > 0 ? followedYes / withFollowed.length : 0;

  const revengePct = tradeDays > 0 ? cleanDays / tradeDays : 0;
  const volumePct = Math.min(weekTrades.length / 5, 1);

  return Math.round(journalPct * 25) + Math.round(disciplinePct * 30) + Math.round(revengePct * 25) + Math.round(volumePct * 20);
}

/**
 * Compute weekly discipline score (0-100).
 * Based on last 7 days of trading activity.
 *
 * Breakdown:
 *   Journal consistency: 25 pts (% of trading days with journal)
 *   Setup discipline:    30 pts (% of trades that followed setup)
 *   No revenge:          25 pts (% of trading days without No Setup)
 *   Trade volume:        20 pts (5+ trades = full marks)
 */

export function computeWeeklyScore(trades, journals) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);

  // Filter to this week's trades
  const weekTrades = trades.filter((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    return d >= weekStr;
  });

  if (weekTrades.length === 0) return { score: 0, journal: 0, discipline: 0, revenge: 0, volume: 0, tradeDays: 0 };

  const journaledIds = new Set((journals || []).map((j) => j.trade_id));

  // Trading days this week
  const dayMap = {};
  weekTrades.forEach((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    if (!d) return;
    if (!dayMap[d]) dayMap[d] = { journaled: false, hasNoSetup: false };
    if (journaledIds.has(t.id)) dayMap[d].journaled = true;
    if (t.setup === 'No Setup' || t.no_setup_reason) dayMap[d].hasNoSetup = true;
  });

  const tradeDays = Object.keys(dayMap).length;
  const journaledDays = Object.values(dayMap).filter((d) => d.journaled).length;
  const cleanDays = Object.values(dayMap).filter((d) => !d.hasNoSetup).length;

  // Journal score (25 pts)
  const journalPct = tradeDays > 0 ? journaledDays / tradeDays : 0;
  const journal = Math.round(journalPct * 25);

  // Setup discipline score (30 pts)
  const withFollowed = weekTrades.filter((t) => t.setup_followed);
  const followedYes = withFollowed.filter((t) => t.setup_followed === 'yes').length;
  const disciplinePct = withFollowed.length > 0 ? followedYes / withFollowed.length : 0;
  const discipline = Math.round(disciplinePct * 30);

  // No revenge score (25 pts)
  const revengePct = tradeDays > 0 ? cleanDays / tradeDays : 0;
  const revenge = Math.round(revengePct * 25);

  // Volume score (20 pts) — 5+ trades = full
  const volumePct = Math.min(weekTrades.length / 5, 1);
  const volume = Math.round(volumePct * 20);

  const score = calculateWeekScore(weekTrades, journaledIds);

  return { score, journal, discipline, revenge, volume, tradeDays };
}

/**
 * Compute consecutive weeks with weekly score >= 90.
 * Walks backward from the current week, computing weekly scores.
 * Stops at the first week below 90 or with no trades.
 * Skips the current week if it has no trades yet (grace period).
 */
export function computeEliteWeekStreak(trades, journals) {
  if (!trades || trades.length === 0) return 0;

  const journaledIds = new Set((journals || []).map((j) => j.trade_id));
  const now = new Date();
  let streak = 0;
  let started = false;

  // Check up to 52 weeks back
  for (let week = 0; week < 52; week++) {
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - week * 7);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    const weekTrades = trades.filter((t) => {
      const d = t.trade_date || (t.created_at || '').slice(0, 10);
      return d >= startStr && d < endStr;
    });

    // Skip current week if no trades yet (don't break streak for today)
    if (weekTrades.length === 0) {
      if (!started) continue;
      break;
    }
    started = true;

    const score = calculateWeekScore(weekTrades, journaledIds);

    if (score >= 90) streak++;
    else break;
  }

  return streak;
}

/**
 * Achievement definitions and computation.
 * All computed dynamically from current data — no DB table needed.
 */
