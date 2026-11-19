import { performanceWeeks } from "./analytics-performance.mjs";

export function summarizePerformance(trades = []) {
  const days = new Map();
  let pnlCents = 0, wins = 0, losses = 0, breakEven = 0, grossProfitCents = 0, grossLossCents = 0;
  for (const trade of trades) {
    const cents = Math.round(Number(trade.pnl) * 100);
    pnlCents += cents;
    if (cents > 0) { wins += 1; grossProfitCents += cents; }
    else if (cents < 0) { losses += 1; grossLossCents -= cents; }
    else breakEven += 1;
    days.set(trade.trade_date, (days.get(trade.trade_date) || 0) + cents);
  }
  const dayResults = [...days.values()];
  const winDays = dayResults.filter(value => value > 0).length;
  return {
    trades: trades.length, wins, losses, breakEven, pnlCents,
    grossProfitCents, grossLossCents,
    averageWinCents: wins ? grossProfitCents / wins : null,
    averageLossCents: losses ? -grossLossCents / losses : null,
    profitFactor: grossLossCents ? grossProfitCents / grossLossCents : null,
    tradedDays: days.size, winDays,
    losingDays: dayResults.filter(value => value < 0).length,
    flatDays: dayResults.filter(value => value === 0).length,
    winRate: trades.length ? wins / trades.length * 100 : null,
    winDayRate: days.size ? winDays / days.size * 100 : null,
  };
}

// Input comes from buildPerformanceHistory, which validates dates and completed P&L.
export function buildPerformanceTable(history, { mode = "Monthly", year, month } = {}) {
  const periods = mode === "Weekly"
    ? performanceWeeks(history, month)
    : history.months.filter(row => row.key.startsWith(`${year}-`));
  const selected = history.trades.filter(trade => mode === "Weekly"
    ? trade.trade_date.startsWith(`${month}-`)
    : trade.trade_date.startsWith(`${year}-`));
  return {
    rows: periods.map(row => ({
      ...row,
      ...summarizePerformance(selected.filter(trade => mode === "Weekly"
        ? trade.trade_date >= row.from && trade.trade_date <= row.to
        : trade.trade_date.startsWith(`${row.key}-`))),
    })),
    total: summarizePerformance(selected),
  };
}
