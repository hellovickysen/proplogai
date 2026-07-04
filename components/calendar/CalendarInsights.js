'use client';

import { useState, useMemo } from 'react';
import { num } from '@/lib/stats';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── Tooltip ──────────────────────────────────────────────── */

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative ml-1 inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((s) => !s)}
        className="grid h-4 w-4 place-items-center rounded-full border border-white/15 text-[11px] text-white/30 hover:text-white/50"
        aria-label="Info"
      >
        i
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs leading-relaxed text-white/60 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

/* ─── Trade Win Gauge (SVG semi-circle) ────────────────────── */

function TradeWinGauge({ wins, losses, breakeven, total, winPct }) {
  const R = 60;
  const STROKE = 10;
  const cx = 75;
  const cy = 75;
  // Semi-circle: 180 degrees from left to right (π radians)
  const halfCirc = Math.PI * R;

  const winFrac = total > 0 ? wins / total : 0;
  const beFrac = total > 0 ? breakeven / total : 0;
  const lossFrac = total > 0 ? losses / total : 0;

  // Arc lengths
  const winLen = winFrac * halfCirc;
  const beLen = beFrac * halfCirc;
  const lossLen = lossFrac * halfCirc;

  // Each arc: dasharray = segment + gap, dashoffset to position
  // Draw order: wins (green) from left, then breakeven (grey), then losses (red)
  const winOffset = 0;
  const beOffset = -(winLen);
  const lossOffset = -(winLen + beLen);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="150" height="85" viewBox="0 0 150 85">
          {/* Background arc (dark) */}
          <path
            d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {/* Loss arc (red) — drawn first (bottom layer) */}
          {losses > 0 && (
            <path
              d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
              fill="none"
              stroke="#f87171"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${halfCirc} ${halfCirc}`}
              strokeDashoffset={lossOffset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          )}
          {/* Breakeven arc (grey) */}
          {breakeven > 0 && (
            <path
              d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${winLen + beLen} ${halfCirc}`}
              strokeDashoffset={0}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )}
          {/* Win arc (green) — on top */}
          {wins > 0 && (
            <path
              d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
              fill="none"
              stroke="#34d399"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${winLen} ${halfCirc}`}
              strokeDashoffset={0}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          )}
        </svg>
        {/* Percentage in center */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="font-display text-2xl font-bold text-white">{winPct}%</span>
        </div>
      </div>
      {/* Count badges */}
      <div className="mt-4 flex items-center gap-8">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/20 font-mono text-sm font-bold text-emerald-400">{wins}</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 font-mono text-sm font-bold text-white/50">{breakeven}</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-red-500/20 font-mono text-sm font-bold text-red-400">{losses}</span>
      </div>
    </div>
  );
}

/* ─── Formatting helpers ───────────────────────────────────── */

function fmtPnl(v) {
  const n = num(v);
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(v) {
  const n = num(v);
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + abs.toFixed(2);
}

/* ─── Compute insights ─────────────────────────────────────── */

function computeInsights(trades, mode) {
  if (!trades || trades.length === 0) return null;
  const isAllTime = mode === 'all';

  const byDay = {};
  const bySession = {};
  const byPair = {};
  let longs = 0, shorts = 0, wins = 0, losses = 0, breakeven = 0;
  let grossWin = 0, grossLoss = 0;
  const tradeDates = new Set();
  const dailyPnl = {}; // date → total pnl (for day streak)

  for (const t of trades) {
    const pnl = num(t.pnl);
    const raw = t.trade_date || t.closed_at || t.created_at;

    // Day of week
    if (raw) {
      const d = new Date(raw);
      const dow = d.getUTCDay();
      if (!byDay[dow]) byDay[dow] = { count: 0, pnl: 0 };
      byDay[dow].count += 1;
      byDay[dow].pnl += pnl;
      const dateKey = raw.slice(0, 10);
      tradeDates.add(dateKey);
      dailyPnl[dateKey] = (dailyPnl[dateKey] || 0) + pnl;
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

    // Win/loss/breakeven
    if (pnl > 0) { wins++; grossWin += pnl; }
    else if (pnl < 0) { losses++; grossLoss += Math.abs(pnl); }
    else breakeven++;
  }

  const total = trades.length;

  // Day-based metrics: sort by appropriate value
  const dayEntries = Object.entries(byDay);

  // For all-time: use average (pnl / count of that day of week)
  const dayValue = (entry) => isAllTime ? entry[1].pnl / entry[1].count : entry[1].pnl;
  const dayCount = (entry) => isAllTime ? (entry[1].count) : entry[1].count;

  const mostActive = dayEntries.length > 0
    ? [...dayEntries].sort((a, b) => b[1].count - a[1].count)[0]
    : null;

  const mostProfitable = dayEntries.length > 0
    ? [...dayEntries].sort((a, b) => dayValue(b) - dayValue(a))[0]
    : null;

  const leastProfitable = dayEntries.length > 0
    ? [...dayEntries].sort((a, b) => dayValue(a) - dayValue(b))[0]
    : null;

  // Session/pair: same average logic for all-time
  const sessionEntries = Object.entries(bySession);
  const sessionValue = (e) => isAllTime ? e[1].pnl / e[1].count : e[1].pnl;
  const bestSession = sessionEntries.length > 0
    ? [...sessionEntries].sort((a, b) => sessionValue(b) - sessionValue(a))[0]
    : null;

  const pairEntries = Object.entries(byPair);
  const pairValue = (e) => isAllTime ? e[1].pnl / e[1].count : e[1].pnl;
  const bestPair = pairEntries.length > 0
    ? [...pairEntries].sort((a, b) => pairValue(b) - pairValue(a))[0]
    : null;

  // Day streak — consecutive winning/losing days
  const sortedDates = Object.keys(dailyPnl).sort();
  let currentStreak = 0;
  let streakType = null; // 'win' or 'loss'
  let maxWinStreak = 0, maxLossStreak = 0;
  let curWin = 0, curLoss = 0;

  for (const date of sortedDates) {
    if (dailyPnl[date] > 0) {
      curWin++;
      curLoss = 0;
      if (curWin > maxWinStreak) maxWinStreak = curWin;
    } else if (dailyPnl[date] < 0) {
      curLoss++;
      curWin = 0;
      if (curLoss > maxLossStreak) maxLossStreak = curLoss;
    } else {
      curWin = 0;
      curLoss = 0;
    }
  }
  // Current streak (from the end)
  if (sortedDates.length > 0) {
    const lastPnl = dailyPnl[sortedDates[sortedDates.length - 1]];
    if (lastPnl > 0) {
      streakType = 'win';
      currentStreak = 0;
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        if (dailyPnl[sortedDates[i]] > 0) currentStreak++;
        else break;
      }
    } else if (lastPnl < 0) {
      streakType = 'loss';
      currentStreak = 0;
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        if (dailyPnl[sortedDates[i]] < 0) currentStreak++;
        else break;
      }
    }
  }

  // Performance metrics
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : grossWin > 0 ? Infinity : 0;
  const expectancy = total > 0 ? (grossWin - grossLoss) / total : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;

  return {
    // Trade Win gauge
    wins, losses, breakeven, total, winPct,
    // Day patterns
    mostActive: mostActive ? {
      day: DAYS[mostActive[0]],
      shortDay: SHORT_DAYS[mostActive[0]],
      count: mostActive[1].count,
      avgCount: isAllTime ? (mostActive[1].count / Math.max(1, Math.ceil(tradeDates.size / 7))).toFixed(1) : null,
    } : null,
    mostProfitable: mostProfitable ? {
      day: DAYS[mostProfitable[0]],
      shortDay: SHORT_DAYS[mostProfitable[0]],
      pnl: dayValue(mostProfitable),
    } : null,
    leastProfitable: leastProfitable ? {
      day: DAYS[leastProfitable[0]],
      shortDay: SHORT_DAYS[leastProfitable[0]],
      pnl: dayValue(leastProfitable),
    } : null,
    // Direction
    direction: longs + shorts > 0 ? (longs >= shorts ? 'Long' : 'Short') : null,
    directionPct: longs + shorts > 0 ? Math.round((Math.max(longs, shorts) / (longs + shorts)) * 100) : 0,
    // Session/pair
    bestSession: bestSession ? { name: bestSession[0], pnl: sessionValue(bestSession) } : null,
    bestPair: bestPair ? { name: bestPair[0], pnl: pairValue(bestPair) } : null,
    // Performance
    profitFactor: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2),
    expectancy,
    avgWin,
    avgLoss,
    // Streak
    currentStreak,
    streakType,
    maxWinStreak,
    maxLossStreak,
    // Meta
    tradingDays: tradeDates.size,
    isAllTime,
  };
}

/* ─── Main Component ───────────────────────────────────────── */

export default function CalendarInsights({ monthTrades, allTrades }) {
  const [view, setView] = useState('month');
  const trades = view === 'month' ? monthTrades : allTrades;
  const data = useMemo(() => computeInsights(trades, view), [trades, view]);
  if (!data) return null;

  const pnlColor = (v) => num(v) >= 0 ? 'text-emerald-400' : 'text-red-400';
  const avgLabel = data.isAllTime ? 'avg' : '';

  const cards = [
    {
      label: 'Most Active',
      tooltip: 'The day of the week you traded most often',
      value: data.mostActive?.day || '—',
      sub: data.mostActive
        ? data.isAllTime ? `${data.mostActive.avgCount} avg trades` : `${data.mostActive.count} trades`
        : null,
    },
    {
      label: 'Most Profitable',
      tooltip: data.isAllTime ? 'Day with highest average P&L per occurrence' : 'Day with highest total P&L this month',
      value: data.mostProfitable?.day || '—',
      sub: data.mostProfitable ? fmtPnl(data.mostProfitable.pnl) : null,
      subColor: data.mostProfitable ? pnlColor(data.mostProfitable.pnl) : null,
      subSuffix: data.isAllTime && data.mostProfitable ? ` avg per ${data.mostProfitable.shortDay}` : null,
    },
    {
      label: 'Least Profitable',
      tooltip: data.isAllTime ? 'Day with lowest average P&L per occurrence' : 'Day with lowest total P&L this month',
      value: data.leastProfitable?.day || '—',
      sub: data.leastProfitable ? fmtPnl(data.leastProfitable.pnl) : null,
      subColor: data.leastProfitable ? pnlColor(data.leastProfitable.pnl) : null,
      subSuffix: data.isAllTime && data.leastProfitable ? ` avg per ${data.leastProfitable.shortDay}` : null,
    },
    {
      label: 'Trade Direction',
      tooltip: 'Whether you take more long or short positions',
      value: data.direction || '—',
      sub: data.direction ? `${data.directionPct}% of trades` : null,
    },
    {
      label: 'Best Session',
      tooltip: data.isAllTime ? 'Session with highest average P&L' : 'Session with highest P&L this month',
      value: data.bestSession?.name || '—',
      sub: data.bestSession ? fmtPnl(data.bestSession.pnl) : null,
      subColor: data.bestSession ? pnlColor(data.bestSession.pnl) : null,
      subSuffix: data.isAllTime ? ' avg' : null,
    },
    {
      label: 'Best Pair',
      tooltip: data.isAllTime ? 'Pair with highest average P&L' : 'Pair with highest P&L this month',
      value: data.bestPair?.name || '—',
      sub: data.bestPair ? fmtPnl(data.bestPair.pnl) : null,
      subColor: data.bestPair ? pnlColor(data.bestPair.pnl) : null,
      subSuffix: data.isAllTime ? ' avg' : null,
    },
  ];

  const bottomCards = [
    {
      label: 'Profit Factor',
      tooltip: 'Gross profits divided by gross losses. Above 1.0 means profitable overall.',
      value: data.profitFactor,
      valueColor: Number(data.profitFactor) >= 1 ? 'text-emerald-400' : Number(data.profitFactor) > 0 ? 'text-red-400' : 'text-white',
    },
    {
      label: 'Trade Expectancy',
      tooltip: 'Average expected profit/loss per trade. Positive means your system is profitable.',
      value: fmtCompact(data.expectancy),
      valueColor: pnlColor(data.expectancy),
      sub: 'per trade',
    },
    {
      label: 'Avg Win / Loss',
      tooltip: 'Average winning trade amount vs average losing trade amount.',
      customRender: true,
    },
    {
      label: 'Day Streak',
      tooltip: data.isAllTime ? 'Best ever consecutive winning days and worst losing streak across all time.' : 'Current consecutive winning or losing trading days this month.',
      customRender: true,
    },
  ];

  return (
    <div className="mb-6">
      {/* Toggle */}
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

      {/* Row 1-2: Trade Win gauge + 6 cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {/* Trade Win gauge — spans 2 rows on desktop */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:row-span-2 flex flex-col items-center justify-center">
          <div className="flex w-full items-center">
            <span className="font-mono text-xs uppercase tracking-wider text-white/55">Trade Win</span>
            <Tooltip text="Win rate breakdown: wins, breakeven (P&L = 0), and losses" />
          </div>
          <div className="mt-3">
            <TradeWinGauge
              wins={data.wins}
              losses={data.losses}
              breakeven={data.breakeven}
              total={data.total}
              winPct={data.winPct}
            />
          </div>
        </div>

        {/* 6 regular cards filling columns 2-4, rows 1-2 */}
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center">
              <span className="font-mono text-xs uppercase tracking-wider text-white/55">{card.label}</span>
              <Tooltip text={card.tooltip} />
            </div>
            <div className={`mt-2 font-display text-2xl font-bold ${card.valueColor || 'text-white'}`}>
              {card.value}
            </div>
            {card.sub && (
              <div className={`mt-1 font-mono text-sm ${card.subColor || 'text-white/45'}`}>
                {card.sub}{card.subSuffix && <span className="text-white/30">{card.subSuffix}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 3: Performance metrics */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {bottomCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center">
              <span className="font-mono text-xs uppercase tracking-wider text-white/55">{card.label}</span>
              <Tooltip text={card.tooltip} />
            </div>

            {card.label === 'Avg Win / Loss' ? (
              <div className="mt-2 space-y-1">
                <div className="font-display text-lg font-bold text-emerald-400">{fmtCompact(data.avgWin)}</div>
                <div className="font-display text-lg font-bold text-red-400">{fmtCompact(-data.avgLoss)}</div>
              </div>
            ) : card.label === 'Day Streak' ? (
              <div className="mt-2">
                {data.isAllTime ? (
                  <>
                    {/* All-Time: show best ever streaks as main values */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-emerald-400">{data.maxWinStreak}</span>
                      <span className="text-sm text-white/40">best win streak</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-display text-2xl font-bold text-red-400">{data.maxLossStreak}</span>
                      <span className="text-sm text-white/40">worst loss streak</span>
                    </div>
                    {data.currentStreak > 0 && (
                      <div className="mt-2 font-mono text-xs text-white/45">
                        Current: {data.currentStreak} day{data.currentStreak !== 1 ? 's' : ''} {data.streakType === 'win' ? '🟢' : '🔴'} {data.streakType}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Month: show current streak as main value */}
                    <div className="font-display text-2xl font-bold text-white">
                      {data.currentStreak} day{data.currentStreak !== 1 ? 's' : ''}{' '}
                      {data.currentStreak > 0 && '🔥'}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400">
                        {data.maxWinStreak}W
                      </span>
                      <span className="rounded-md bg-red-500/20 px-2 py-0.5 font-mono text-xs font-bold text-red-400">
                        {data.maxLossStreak}L
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className={`mt-2 font-display text-2xl font-bold ${card.valueColor || 'text-white'}`}>
                  {card.value}
                </div>
                {card.sub && (
                  <div className="mt-1 font-mono text-sm text-white/45">{card.sub}</div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
