export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function computeStats(trades) {
  const n = trades.length;
  const wins = trades.filter((t) => num(t.pnl) > 0);
  const losses = trades.filter((t) => num(t.pnl) < 0);
  const net = trades.reduce((a, t) => a + num(t.pnl), 0);
  const grossWin = wins.reduce((a, t) => a + num(t.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + num(t.pnl), 0));
  const winRate = n ? (wins.length / n) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : null;
  const rVals = trades
    .map((t) => t.r_multiple)
    .filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v)))
    .map(Number);
  const avgR = rVals.length ? rVals.reduce((a, b) => a + b, 0) / rVals.length : null;
  return { n, net, winRate, profitFactor, avgR, wins: wins.length, losses: losses.length };
}

export function equitySeries(trades) {
  const sorted = [...trades].sort(
    (a, b) => new Date(a.trade_date || a.closed_at || a.created_at) - new Date(b.trade_date || b.closed_at || b.created_at)
  );
  let cum = 0;
  return sorted.map((t) => {
    cum += num(t.pnl);
    return cum;
  });
}

export function fmtMoney(v) {
  const n = num(v);
  const sign = n < 0 ? '-' : '+';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


export function fmtMoneyCompact(v) {
  const n = num(v);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '+';
  if (abs >= 1000000) return sign + '$' + (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 10000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtR(v) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  return (n >= 0 ? '+' : '-') + Math.abs(n).toFixed(2) + 'R';
}

/* ─── Phase 6: Discipline stats ───────────────────────────────── */

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

  const score = journal + discipline + revenge + volume;

  return { score, journal, discipline, revenge, volume, tradeDays };
}

/**
 * Achievement definitions and computation.
 * All computed dynamically from current data — no DB table needed.
 */
const ACHIEVEMENT_DEFS = [
  { key: 'first_trade', name: 'First Trade', icon: '\u{1F3AF}', desc: 'Log your first trade', threshold: 1, metric: 'totalTrades' },
  { key: 'ten_trades', name: 'Getting Started', icon: '\u{1F4CA}', desc: 'Log 10 trades', threshold: 10, metric: 'totalTrades' },
  { key: 'fifty_trades', name: 'Committed', icon: '\u{1F4AA}', desc: 'Log 50 trades', threshold: 50, metric: 'totalTrades' },
  { key: 'century', name: 'Century Club', icon: '\u{1F3C6}', desc: 'Log 100 trades', threshold: 100, metric: 'totalTrades' },
  { key: 'streak_5', name: 'On Fire', icon: '\u{1F525}', desc: '5-day journal streak', threshold: 5, metric: 'journalStreak' },
  { key: 'streak_10', name: 'Unstoppable', icon: '⚡', desc: '10-day journal streak', threshold: 10, metric: 'journalStreak' },
  { key: 'streak_30', name: 'Iron Will', icon: '\u{1F3C5}', desc: '30-day journal streak', threshold: 30, metric: 'journalStreak' },
  { key: 'clean_week', name: 'Clean Week', icon: '✨', desc: 'No revenge trades for 7 days', threshold: 7, metric: 'noRevengeStreak' },
  { key: 'discipline_100', name: 'Perfect Discipline', icon: '\u{1F48E}', desc: '100% setup discipline this week', threshold: 100, metric: 'setupDiscipline' },
  { key: 'score_90', name: 'Elite Trader', icon: '\u{1F451}', desc: 'Weekly score above 90', threshold: 90, metric: 'weeklyScore' },
];

export function computeAchievements(metrics) {
  return ACHIEVEMENT_DEFS.map((a) => {
    const value = metrics[a.metric] || 0;
    const progress = Math.min(value / a.threshold, 1);
    const earned = value >= a.threshold;
    return { ...a, value, progress, earned };
  });
}
