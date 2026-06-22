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
    (a, b) => new Date(a.closed_at || a.created_at) - new Date(b.closed_at || b.created_at)
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
