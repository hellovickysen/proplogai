'use client';

export default function MetricsGrid({ metrics }) {
  if (!metrics) return null;

  const cards = [
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      sub: `${metrics.wins}W / ${metrics.losses}L`,
      color: metrics.winRate >= 50 ? '#34d399' : '#f87171',
    },
    {
      title: 'Avg R:R',
      value: metrics.avgRR >= 999 ? '∞' : metrics.avgRR.toFixed(2),
      sub: `Win $${metrics.avgProfit.toFixed(0)} / Loss $${metrics.avgLoss.toFixed(0)}`,
      color: metrics.avgRR >= 1.5 ? '#34d399' : metrics.avgRR >= 1 ? '#fbbf24' : '#f87171',
    },
    {
      title: 'Expectancy',
      value: `$${metrics.expectancy.toFixed(2)}`,
      sub: 'Per trade',
      color: metrics.expectancy > 0 ? '#34d399' : '#f87171',
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor >= 999 ? '∞' : metrics.profitFactor.toFixed(2),
      sub: `Gross +$${metrics.grossProfit.toFixed(0)} / -$${metrics.grossLoss.toFixed(0)}`,
      color: metrics.profitFactor >= 1.5 ? '#34d399' : metrics.profitFactor >= 1 ? '#fbbf24' : '#f87171',
    },
    {
      title: 'Max Drawdown',
      value: `${metrics.maxDrawdown.toFixed(1)}%`,
      sub: `Recovery: ${metrics.recoveryFactor.toFixed(2)}`,
      color: metrics.maxDrawdown < 5 ? '#34d399' : metrics.maxDrawdown < 8 ? '#fbbf24' : '#f87171',
    },
    {
      title: 'Consistency',
      value: `${metrics.consistencyScore}/100`,
      sub: scoreLabel(metrics.consistencyScore),
      color: metrics.consistencyScore >= 60 ? '#34d399' : metrics.consistencyScore >= 40 ? '#fbbf24' : '#f87171',
    },
    {
      title: 'Discipline',
      value: `${metrics.disciplineScore}/100`,
      sub: scoreLabel(metrics.disciplineScore),
      color: metrics.disciplineScore >= 60 ? '#34d399' : metrics.disciplineScore >= 40 ? '#fbbf24' : '#f87171',
    },
    {
      title: 'Trading Days',
      value: metrics.tradingDays,
      sub: `${metrics.tradesPerDay.toFixed(1)} trades/day`,
      color: '#60a5fa',
    },
    {
      title: 'Total P&L',
      value: `$${metrics.totalProfit.toFixed(2)}`,
      sub: `${metrics.totalTrades} trades`,
      color: metrics.totalProfit >= 0 ? '#34d399' : '#f87171',
    },
    {
      title: 'Avg Holding',
      value: formatDuration(metrics.avgHoldingTime),
      sub: 'Per trade',
      color: '#a78bfa',
    },
    {
      title: 'Max Streak',
      value: `${metrics.maxConsWins}W / ${metrics.maxConsLosses}L`,
      sub: 'Consecutive',
      color: '#22d3ee',
    },
    {
      title: 'Best Symbol',
      value: metrics.bestSymbol?.symbol || '-',
      sub: metrics.bestSymbol ? `$${metrics.bestSymbol.pnl.toFixed(0)}` : '',
      color: '#34d399',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
        >
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
            {c.title}
          </div>
          <div className="text-xl font-bold" style={{ color: c.color }}>
            {c.value}
          </div>
          {c.sub && (
            <div className="mt-1 text-xs text-white/40">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below average';
  return 'Poor';
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '-';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
