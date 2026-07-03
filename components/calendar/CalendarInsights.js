'use client';

import { useState } from 'react';
import { num } from '@/lib/stats';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative ml-1 inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        className="grid h-4 w-4 place-items-center rounded-full border border-white/15 text-[9px] text-white/30 hover:text-white/50"
        aria-label="Info"
      >
        i
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white/60 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

function fmtPnl(v) {
  const n = num(v);
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeInsights(trades) {
  if (!trades || trades.length === 0) return null;

  // Group by day of week
  const byDay = {};
  const bySession = {};
  const byPair = {};
  let longs = 0;
  let shorts = 0;
  let wins = 0;
  const tradeDates = new Set();

  for (const t of trades) {
    const pnl = num(t.pnl);

    // Day of week
    const raw = t.trade_date || t.closed_at || t.created_at;
    if (raw) {
      const d = new Date(raw);
      const dow = d.getUTCDay();
      if (!byDay[dow]) byDay[dow] = { count: 0, pnl: 0 };
      byDay[dow].count += 1;
      byDay[dow].pnl += pnl;
      tradeDates.add(raw.slice(0, 10));
    }

    // Session
    if (t.session) {
      if (!bySession[t.session]) bySession[t.session] = { count: 0, pnl: 0 };
      bySession[t.session].count += 1;
      bySession[t.session].pnl += pnl;
    }

    // Pair
    if (t.pair) {
      if (!byPair[t.pair]) byPair[t.pair] = { count: 0, pnl: 0 };
      byPair[t.pair].count += 1;
      byPair[t.pair].pnl += pnl;
    }

    // Direction
    if (t.direction === 'long') longs++;
    else if (t.direction === 'short') shorts++;

    // Win rate
    if (pnl > 0) wins++;
  }

  // Most Active day
  const dayEntries = Object.entries(byDay);
  const mostActive = dayEntries.length > 0
    ? dayEntries.sort((a, b) => b[1].count - a[1].count)[0]
    : null;

  // Most Profitable day
  const mostProfitable = dayEntries.length > 0
    ? [...dayEntries].sort((a, b) => b[1].pnl - a[1].pnl)[0]
    : null;

  // Least Profitable day
  const leastProfitable = dayEntries.length > 0
    ? [...dayEntries].sort((a, b) => a[1].pnl - b[1].pnl)[0]
    : null;

  // Best Session
  const sessionEntries = Object.entries(bySession);
  const bestSession = sessionEntries.length > 0
    ? sessionEntries.sort((a, b) => b[1].pnl - a[1].pnl)[0]
    : null;

  // Best Pair
  const pairEntries = Object.entries(byPair);
  const bestPair = pairEntries.length > 0
    ? pairEntries.sort((a, b) => b[1].pnl - a[1].pnl)[0]
    : null;

  return {
    mostActive: mostActive ? { day: DAYS[mostActive[0]], count: mostActive[1].count, avg: (mostActive[1].count).toFixed(0) } : null,
    mostProfitable: mostProfitable ? { day: DAYS[mostProfitable[0]], pnl: mostProfitable[1].pnl } : null,
    leastProfitable: leastProfitable ? { day: DAYS[leastProfitable[0]], pnl: leastProfitable[1].pnl } : null,
    direction: longs + shorts > 0 ? (longs >= shorts ? 'Long' : 'Short') : null,
    directionPct: longs + shorts > 0 ? Math.round((Math.max(longs, shorts) / (longs + shorts)) * 100) : 0,
    bestSession: bestSession ? { name: bestSession[0], pnl: bestSession[1].pnl } : null,
    bestPair: bestPair ? { name: bestPair[0], pnl: bestPair[1].pnl } : null,
    winRate: trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0,
    tradingDays: tradeDates.size,
    totalTrades: trades.length,
  };
}

export default function CalendarInsights({ monthTrades, allTrades }) {
  const [view, setView] = useState('month');
  const trades = view === 'month' ? monthTrades : allTrades;
  const data = computeInsights(trades);
  if (!data) return null;

  const pnlColor = (v) => v >= 0 ? 'text-emerald-400' : 'text-red-400';

  const cards = [
    {
      label: 'Most Active',
      tooltip: 'The day of the week you traded most often this month',
      value: data.mostActive?.day || '—',
      sub: data.mostActive ? `${data.mostActive.count} trades` : null,
    },
    {
      label: 'Most Profitable',
      tooltip: 'The day of the week with the highest total P&L this month',
      value: data.mostProfitable?.day || '—',
      sub: data.mostProfitable ? fmtPnl(data.mostProfitable.pnl) : null,
      subColor: data.mostProfitable ? pnlColor(data.mostProfitable.pnl) : null,
    },
    {
      label: 'Least Profitable',
      tooltip: 'The day of the week with the lowest total P&L this month',
      value: data.leastProfitable?.day || '—',
      sub: data.leastProfitable ? fmtPnl(data.leastProfitable.pnl) : null,
      subColor: data.leastProfitable ? pnlColor(data.leastProfitable.pnl) : null,
    },
    {
      label: 'Trade Direction',
      tooltip: 'Whether you take more long or short positions this month',
      value: data.direction || '—',
      sub: data.direction ? `${data.directionPct}% of trades` : null,
    },
    {
      label: 'Best Session',
      tooltip: 'The trading session (Asian/London/New York) with the highest P&L this month',
      value: data.bestSession?.name || '—',
      sub: data.bestSession ? fmtPnl(data.bestSession.pnl) : null,
      subColor: data.bestSession ? pnlColor(data.bestSession.pnl) : null,
    },
    {
      label: 'Best Pair',
      tooltip: 'The trading pair with the highest total P&L this month',
      value: data.bestPair?.name || '—',
      sub: data.bestPair ? fmtPnl(data.bestPair.pnl) : null,
      subColor: data.bestPair ? pnlColor(data.bestPair.pnl) : null,
    },
    {
      label: 'Win Rate',
      tooltip: 'Percentage of trades with positive P&L this month',
      value: `${data.winRate}%`,
      sub: `${data.totalTrades} trades`,
      valueColor: data.winRate >= 50 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Trading Days',
      tooltip: 'Number of unique days you placed at least one trade this month',
      value: `${data.tradingDays}`,
      sub: `day${data.tradingDays !== 1 ? 's' : ''} active`,
    },
  ];

  return (
    <div className="mb-6">
      {/* Month / All-Time toggle */}
      <div className="mb-3 flex items-center justify-end gap-1">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/35">View</span>
        {[{ key: 'month', label: 'Month' }, { key: 'all', label: 'All-Time' }].map((s) => (
          <button
            key={s.key}
            onClick={() => setView(s.key)}
            className={'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ' + (view === s.key ? 'bg-white/[0.08] text-white' : 'text-white/35 hover:text-white/60')}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center">
            <span className="font-mono text-xs uppercase tracking-wider text-white/55">
              {card.label}
            </span>
            <Tooltip text={card.tooltip} />
          </div>
          <div className={`mt-2 font-display text-2xl font-bold ${card.valueColor || 'text-white'}`}>
            {card.value}
          </div>
          {card.sub && (
            <div className={`mt-1 font-mono text-sm ${card.subColor || 'text-white/45'}`}>
              {card.sub}
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
