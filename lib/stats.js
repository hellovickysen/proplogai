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

export function fmtR(v) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '—';
  const n = Number(v);
  return (n >= 0 ? '+' : '-') + Math.abs(n).toFixed(2) + 'R';
}

/* ─── Phase 6: Discipline stats ───────────────────────────────── */

/**
 * Compute playbook discipline statistics.
 * @param {Array} trades — trades with setup_followed, no_setup_reason, setup (name)
 * @param {Array} journals — journal entries with trade_id
 * @returns {{ journalStreak, setupDiscipline, noRevengeStreak, noSetupCount, totalTrades }}
 */
export function computeDisciplineStats(trades, journals) {
  const totalTrades = trades.length;
  if (totalTrades === 0) {
    return { journalStreak: 0, setupDiscipline: 0, noRevengeStreak: 0, noSetupCount: 0, totalTrades: 0 };
  }

  // Build set of trade IDs that have journal entries
  const journaledTradeIds = new Set((journals || []).map((j) => j.trade_id));

  // Sort trades by trade_date ascending for streak calculation
  const sorted = [...trades].sort(
    (a, b) => new Date(a.trade_date || a.created_at) - new Date(b.trade_date || b.created_at)
  );

  // --- Journal streak: consecutive trading days with at least one journal entry ---
  const tradingDays = {};
  sorted.forEach((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    if (!d) return;
    if (!tradingDays[d]) tradingDays[d] = { traded: true, journaled: false };
    if (journaledTradeIds.has(t.id)) tradingDays[d].journaled = true;
  });

  const dayKeys = Object.keys(tradingDays).sort().reverse(); // most recent first
  let journalStreak = 0;
  for (const dk of dayKeys) {
    if (tradingDays[dk].journaled) {
      journalStreak++;
    } else {
      break;
    }
  }

  // --- Setup discipline: % of trades where setup_followed === 'yes' ---
  const tradesWithFollowed = trades.filter((t) => t.setup_followed);
  const followedYes = tradesWithFollowed.filter((t) => t.setup_followed === 'yes').length;
  const setupDiscipline = tradesWithFollowed.length > 0
    ? Math.round((followedYes / tradesWithFollowed.length) * 100)
    : 0;

  // --- No revenge streak: consecutive trading days without a "No Setup" trade ---
  let noRevengeStreak = 0;
  const noSetupName = 'No Setup';
  for (const dk of dayKeys) {
    const dayTrades = sorted.filter((t) => (t.trade_date || (t.created_at || '').slice(0, 10)) === dk);
    const hasNoSetup = dayTrades.some((t) => t.setup === noSetupName || t.no_setup_reason);
    if (!hasNoSetup) {
      noRevengeStreak++;
    } else {
      break;
    }
  }

  // --- No setup trades this week ---
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().slice(0, 10);
  const noSetupCount = trades.filter((t) => {
    const d = t.trade_date || (t.created_at || '').slice(0, 10);
    return d >= weekStr && (t.setup === noSetupName || t.no_setup_reason);
  }).length;

  return { journalStreak, setupDiscipline, noRevengeStreak, noSetupCount, totalTrades };
}
