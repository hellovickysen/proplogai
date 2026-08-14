"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchAnalyticsOverviewV2,
  fetchSetupAnalytics,
  fetchRuleBreachAnalytics,
  fetchDayPatternAnalytics,
  fetchLossAttribution,
  fetchAIExplanation,
  runBackfill,
} from './actions';

/* ─── Config ──── */

const PRESETS = [
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'setups', label: 'My Setups', icon: '🎯' },
  { key: 'breaches', label: 'My Mistakes', icon: '🚨' },
  { key: 'patterns', label: 'Trading Patterns', icon: '📅' },
  { key: 'attribution', label: 'Where I Lose', icon: '💸' },
  { key: 'ai', label: 'AI Coach', icon: '✦' },
];

const CHART_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a78bfa', '#22d3ee', '#34d399'];

/* ─── Helpers ──── */

function money(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? '-' : '';
  return sign + '$' + Math.abs(v).toFixed(2);
}
function moneyShort(n) {
  const v = Math.abs(Number(n) || 0);
  if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'k';
  return '$' + Math.round(v);
}

/* ─── Shared UI ──── */

function Card({ children, className = '' }) {
  return <div className={'rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 ' + className}>{children}</div>;
}

function SectionTitle({ emoji, children, right }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="text-[17px]">{emoji}</span>
      <h2 className="text-sm font-semibold text-white">{children}</h2>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-4xl opacity-40">📭</div>
      <div className="max-w-xs text-sm text-white/40">{message}</div>
    </div>
  );
}

function ErrorCard({ error }) {
  return (
    <Card className="border-red-500/20">
      <div className="text-sm text-red-400">Error: {error}</div>
      <div className="mt-2 text-xs text-white/40">Try “Re-evaluate All Trades” above, or refresh.</div>
    </Card>
  );
}

function SampleBadge({ n }) {
  const level = n >= 30
    ? { t: 'High confidence', c: 'bg-emerald-500/10 text-emerald-400' }
    : n >= 10
      ? { t: 'Medium confidence', c: 'bg-amber-500/10 text-amber-400' }
      : { t: 'Early signal', c: 'bg-white/[0.06] text-white/50' };
  return <span className={'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ' + level.c}>{level.t} · {n}</span>;
}

function Meter({ label, value, hasData = true }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <span className="font-mono text-xs text-white/45">{hasData ? pct + '%' : 'Needs data'}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {hasData && <div className="h-full rounded-full" style={{ width: pct + '%', background: color }} />}
      </div>
    </div>
  );
}

/* Collapsible drill-down (evidence tucked away, not shown by default) */
function TradeDrawer({ trades, label = 'Show the trades' }) {
  const [open, setOpen] = useState(false);
  if (!trades || trades.length === 0) return null;
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="text-xs font-medium text-violet-400 transition-colors hover:text-violet-300">
        {open ? 'Hide trades' : `${label} (${trades.length}) →`}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {trades.slice(0, 20).map((t) => {
            const pnl = Number(t.pnl);
            const win = pnl > 0;
            return (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                <span className="font-mono font-semibold text-white/80">{t.pair}</span>
                <div className="flex items-center gap-3">
                  {t.trade_date && <span className="text-white/30">{t.trade_date}</span>}
                  <span className={'font-mono font-semibold ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                    {Number.isFinite(pnl) ? (win ? '+' : '') + money(pnl).replace('-', '-') : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Graphical primitives ──── */

function ScoreDial({ value }) {
  const has = value != null;
  const v = has ? Math.max(0, Math.min(100, value)) : 0;
  const C = 439.82;
  const offset = C * (1 - v / 100);
  return (
    <div className="relative h-[168px] w-[168px] flex-none">
      <svg width="168" height="168" viewBox="0 0 172 172">
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="86" cy="86" r="70" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" />
        {has && (
          <circle cx="86" cy="86" r="70" fill="none" stroke="url(#dialGrad)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 86 86)" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-extrabold leading-none tracking-tight">{has ? v : '—'}</span>
        <span className="mt-1 text-xs text-white/30">/ 100</span>
      </div>
    </div>
  );
}

function Donut({ items, centerTop, centerSub }) {
  const C = 376.99;
  const sum = items.reduce((s, it) => s + Math.abs(it.value), 0) || 1;
  let acc = 0;
  const segs = items.map((it, i) => {
    const seg = (Math.abs(it.value) / sum) * C;
    const node = (
      <circle key={i} cx="75" cy="75" r="60" stroke={CHART_COLORS[i % CHART_COLORS.length]}
        strokeDasharray={`${seg} ${C - seg}`} strokeDashoffset={-acc} />
    );
    acc += seg;
    return node;
  });
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width="150" height="150" viewBox="0 0 150 150" className="flex-none">
        <circle cx="75" cy="75" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
        <g transform="rotate(-90 75 75)" fill="none" strokeWidth="20">{segs}</g>
        <text x="75" y="71" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="800" fontFamily="ui-monospace,monospace">{centerTop}</text>
        <text x="75" y="88" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" letterSpacing="1">{centerSub}</text>
      </svg>
      <div className="flex min-w-[150px] flex-1 flex-col gap-2.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="h-[11px] w-[11px] flex-none rounded" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-white/70">{it.label}</span>
            <span className="ml-auto font-mono text-white/50">-{moneyShort(it.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekdayBars({ weekdays }) {
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const short = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
  const list = order.map((d) => (weekdays || []).find((w) => w.day === d)).filter(Boolean);
  if (list.length === 0) return <EmptyState message="No day data yet." />;
  const max = Math.max(1, ...list.map((w) => Math.abs(w.pnl)));
  return (
    <div className="flex h-[150px] items-end gap-2.5 pt-2">
      {list.map((w) => {
        const h = Math.max(6, Math.round((Math.abs(w.pnl) / max) * 100));
        const pos = w.pnl >= 0;
        return (
          <div key={w.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center">
              <div className="w-2/3 rounded-t-lg" title={money(w.pnl)}
                style={{ height: h + '%', background: pos ? 'linear-gradient(#34d399,#059669)' : 'linear-gradient(#f87171,#b91c1c)' }} />
            </div>
            <span className="text-[11px] text-white/30">{short[w.day]}</span>
          </div>
        );
      })}
    </div>
  );
}

function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-white/70">{r.label}</span>
            <span className="font-mono text-white/45">{r.sub}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full" style={{ width: Math.max(4, Math.round((Math.abs(r.value) / max) * 100)) + '%', background: r.color || '#a78bfa' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Overview (graphical) ──── */

function ScoreCard({ score }) {
  if (!score) return null;
  const delta = score.delta;
  return (
    <Card>
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">🧘 Discipline Score</div>
      <div className="flex flex-wrap items-center gap-6">
        <ScoreDial value={score.score} />
        <div className="flex-1">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            {score.provisional && <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[10.5px] font-semibold text-amber-300">Provisional</span>}
            {delta != null && delta !== 0 && (
              <span className={'rounded-full px-2.5 py-1 text-[10.5px] font-semibold ' + (delta > 0 ? 'bg-emerald-500/12 text-emerald-300' : 'bg-red-500/12 text-red-300')}>
                {delta > 0 ? '▲ +' : '▼ '}{delta} pts
              </span>
            )}
          </div>
          <div className="max-w-[240px] text-[13px] text-white/55">
            You kept your rules on <b className="text-white">{score.cleanTrades} of {score.totalTrades}</b> trades. Process over profit — this is what you control.
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {score.dimensions.map((d) => (
          <Meter key={d.key} label={d.label} value={d.value} hasData={d.hasData} />
        ))}
      </div>
      {score.provisional && (
        <div className="mt-3 text-[11px] text-amber-400/70">Set your Rulebook guardrails to unlock the full guardrail-weighted score.</div>
      )}
    </Card>
  );
}

function FocusTiles({ problem, strength }) {
  return (
    <div className="flex flex-col gap-4">
      {problem ? (
        <div className="rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/[0.14] to-red-500/[0.03] p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">🚨 Your #1 Leak</div>
          <h3 className="mt-2 text-lg font-bold text-white">{problem.label}</h3>
          <div className="mt-1 font-mono text-2xl font-extrabold text-red-400">-{moneyShort(problem.attributableLoss)}</div>
          <div className="mt-1 text-xs text-white/55">{problem.violations} trades · {problem.pctOfAttributable}% of your attributable losses</div>
          <Link href="/dashboard/rulebook" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/25">
            Fix this rule →
          </Link>
        </div>
      ) : (
        <Card><div className="text-sm text-white/40">No leak detected in this period. 🎉</div></Card>
      )}
      {strength && (
        <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.13] to-emerald-500/[0.03] p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">💪 Your #1 Strength</div>
          <h3 className="mt-2 text-lg font-bold text-white">{strength.label}</h3>
          <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-400">{strength.rate}%</div>
          <div className="mt-1 text-xs text-white/55">your steadiest discipline habit — protect it</div>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, value, label, tone }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="text-base">{icon}</div>
      <div className={'mt-2 text-[22px] font-extrabold tracking-tight ' + (tone || 'text-white')}>{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-white/35">{label}</div>
    </div>
  );
}

function OverviewTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  const total = data.totalTrades || 0;
  if (total === 0) return <EmptyState message="No trades in this period. Log some trades to see your analytics." />;

  const breaches = data.totalBreaches || 0;
  const affected = data.uniqueBreachedTrades || 0;
  const loss = data.lossFromBreaches || 0;
  const rate = total > 0 ? Math.round((affected / total) * 100) : 0;

  const lossCats = (data.loss && Array.isArray(data.loss.categories)) ? data.loss.categories : [];
  const donutItems = lossCats.slice(0, 5).map((c) => ({ label: c.label, value: c.totalLoss }));
  const donutTotal = donutItems.reduce((s, it) => s + it.value, 0);
  const weekdays = (data.pattern && Array.isArray(data.pattern.weekdays)) ? data.pattern.weekdays : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <ScoreCard score={data.disciplineScore} />
        <FocusTiles problem={data.problem} strength={data.strength} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon="📈" value={total} label="Total Trades" />
        <StatChip icon="🚩" value={breaches} label="Rule Breaches" tone="text-red-400" />
        <StatChip icon="💸" value={'-' + moneyShort(loss)} label="Loss from Breaches" tone="text-red-400" />
        <StatChip icon="⚖️" value={rate + '%'} label="Breach Rate" tone={rate > 0 ? 'text-amber-400' : 'text-emerald-400'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {donutItems.length > 0 && (
          <Card>
            <SectionTitle emoji="💸">Where your losses come from</SectionTitle>
            <Donut items={donutItems} centerTop={moneyShort(donutTotal)} centerSub="RULE-BREAK COST" />
          </Card>
        )}
        {weekdays.length > 0 && (
          <Card>
            <SectionTitle emoji="📅">Best &amp; worst days</SectionTitle>
            <WeekdayBars weekdays={weekdays} />
            <div className="mt-3 text-[11px] text-white/35">Green = net profit day · red = net loss.</div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── My Setups ──── */

function SetupsTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (!data.setups || data.setups.length === 0) return <EmptyState message="No setup data in this period." />;

  const top = data.setups.slice(0, 6).map((s) => ({
    label: s.name, value: s.count, sub: `${s.count} trades`, color: '#a78bfa',
  }));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle emoji="🎯" right={<span className="text-[11px] text-white/35">{data.totalTrades} trades</span>}>Most-used setups</SectionTitle>
        <HBars rows={top} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.setups.map((s) => (
          <Card key={s.name}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{s.name}</div>
                <div className="mt-1 flex items-center gap-2.5 text-xs">
                  <span className="text-emerald-400">{s.wins}W</span>
                  <span className="text-red-400">{s.losses}L</span>
                  <span className={s.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{s.totalPnl >= 0 ? '+' : ''}{s.totalPnl.toFixed(0)}</span>
                </div>
              </div>
              {s.adherenceRate !== null && (
                <div className="text-right">
                  <div className={'text-xl font-extrabold ' + (s.adherenceRate >= 70 ? 'text-emerald-400' : s.adherenceRate >= 40 ? 'text-amber-400' : 'text-red-400')}>{s.adherenceRate}%</div>
                  <div className="text-[10px] uppercase text-white/30">adherence</div>
                </div>
              )}
            </div>
            {s.ruleBreakCost != null && (
              <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-[11px] leading-relaxed text-amber-200/80">
                ⚠️ Positive P&amp;L here isn&#39;t a discipline win — this behavior is responsible for <span className="font-mono font-semibold">-{moneyShort(s.ruleBreakCost)}</span> of attributable losses.
              </div>
            )}
            <TradeDrawer trades={s.trades} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── My Mistakes ──── */

function BreachesTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (!data.rules || data.rules.length === 0) return <EmptyState message="No rule breaches detected in this period. 🎉" />;

  const rows = data.rules.slice(0, 8).map((r) => ({
    label: r.label, value: r.broken, sub: `${r.broken} · -${moneyShort(r.lossAmount)}`, color: r.breachRate > 30 ? '#f87171' : '#fbbf24',
  }));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle emoji="🚨">Most broken rules</SectionTitle>
        <HBars rows={rows} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.rules.map((r) => (
          <Card key={r.key}>
            <div className="flex items-start justify-between">
              <div className="text-sm font-semibold text-white">{r.label}</div>
              <div className="text-right">
                <div className="font-mono text-lg font-extrabold text-red-400">-{moneyShort(r.lossAmount)}</div>
                <div className="text-[10px] uppercase text-white/30">{r.breachRate}% breach rate</div>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2.5 text-xs">
              <span className="text-red-400">{r.broken} breaches</span>
              <span className="text-emerald-400">{r.followed} followed</span>
            </div>
            <TradeDrawer trades={r.trades} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Trading Patterns ──── */

function GaugeTile({ title, winRate, avgPnl, n }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.1em] text-white/40">{title}</div>
      <div className="mt-2 flex items-end gap-2">
        <div className="text-2xl font-extrabold text-white">{winRate}%</div>
        <div className="mb-0.5 text-[11px] text-white/40">win rate</div>
      </div>
      <div className={'text-xs font-mono ' + (avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{avgPnl >= 0 ? '+' : ''}{money(avgPnl)} avg</div>
      <div className="mt-2"><SampleBadge n={n} /></div>
    </div>
  );
}

function PatternsTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (data.totalTrades === 0) return <EmptyState message="No trades in this period." />;

  const ae = data.afterEvents;
  const tn = data.tradeNumbers || [];
  const maxTn = Math.max(1, ...tn.map((b) => Math.abs(b.avgPnl)));

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle emoji="📅">Weekday performance</SectionTitle>
        <WeekdayBars weekdays={data.weekdays} />
      </Card>

      {ae && (ae.afterLoss.total >= 3 || ae.afterWin.total >= 3) && (
        <Card>
          <SectionTitle emoji="🧠">How you trade after a win vs a loss</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <GaugeTile title="After a loss" winRate={ae.afterLoss.winRate} avgPnl={ae.afterLoss.avgPnl} n={ae.afterLoss.total} />
            <GaugeTile title="After a win" winRate={ae.afterWin.winRate} avgPnl={ae.afterWin.avgPnl} n={ae.afterWin.total} />
          </div>
          {ae.afterLoss.avgRisk != null && ae.baselineAvgRisk != null && ae.afterLoss.avgRisk > ae.baselineAvgRisk && (
            <div className="mt-3 text-[11px] text-amber-400/80">⚠️ You tend to risk more right after a loss ({money(ae.afterLoss.avgRisk)} vs {money(ae.baselineAvgRisk)} average).</div>
          )}
        </Card>
      )}

      {tn.length > 0 && (
        <Card>
          <SectionTitle emoji="🔢">Performance by trade number (per day)</SectionTitle>
          <div className="flex items-end gap-4 pt-2" style={{ height: '150px' }}>
            {tn.map((b) => {
              const h = Math.max(8, Math.round((Math.abs(b.avgPnl) / maxTn) * 100));
              const pos = b.avgPnl >= 0;
              return (
                <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className={'font-mono text-[11px] ' + (pos ? 'text-emerald-400' : 'text-red-400')}>{pos ? '+' : ''}{b.avgPnl.toFixed(0)}</div>
                  <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                    <div className="w-3/5 rounded-t-lg" style={{ height: h + '%', background: pos ? 'linear-gradient(#34d399,#059669)' : 'linear-gradient(#f87171,#b91c1c)' }} />
                  </div>
                  <span className="text-[11px] text-white/50">{b.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-white/35">If later trades perform worse, try capping trades per day for your next 10 sessions.</div>
        </Card>
      )}
    </div>
  );
}

/* ─── Where I Lose ──── */

function AttributionTab({ data }) {
  const [whatIfSel, setWhatIfSel] = useState(null);
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (!data.categories || data.categories.length === 0) return <EmptyState message="No categorized losses in this period." />;

  const cats = data.categories;
  const donutItems = cats.slice(0, 6).map((c) => ({ label: c.label, value: c.totalLoss }));
  const total = donutItems.reduce((s, it) => s + it.value, 0);
  const whatIfList = Array.isArray(data.whatIf) ? data.whatIf : [];
  const sel = whatIfSel ? whatIfList.find((x) => x.key === whatIfSel) : null;
  const currentPnl = typeof data.currentPnl === 'number' ? data.currentPnl : 0;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle emoji="💸">Where your losses come from</SectionTitle>
        <Donut items={donutItems} centerTop={moneyShort(total)} centerSub="TOTAL COST" />
      </Card>

      {whatIfList.length > 0 && (
        <Card>
          <SectionTitle emoji="🧪">What if you avoided a behavior?</SectionTitle>
          <p className="-mt-2 mb-3 text-[11px] leading-relaxed text-white/40">A historical look across your logged trades — not a prediction, and not recoverable profit.</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {whatIfList.map((w) => (
              <button key={w.key} onClick={() => setWhatIfSel(w.key === whatIfSel ? null : w.key)}
                className={'rounded-lg px-3 py-1.5 text-xs font-medium transition-all ' + (whatIfSel === w.key ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70')}>
                {w.label}
              </button>
            ))}
          </div>
          {sel ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/[0.02] p-3">
                  <div className="mb-1 text-[10px] uppercase text-white/40">Actual result</div>
                  <div className={'font-mono text-base font-bold ' + (currentPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{currentPnl >= 0 ? '+' : ''}{money(currentPnl)}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.02] p-3">
                  <div className="mb-1 text-[10px] uppercase text-white/40">Without {sel.excludedCount} trades</div>
                  <div className={'font-mono text-base font-bold ' + (sel.withoutPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{sel.withoutPnl >= 0 ? '+' : ''}{money(sel.withoutPnl)}</div>
                </div>
                <div className="rounded-2xl bg-white/[0.02] p-3">
                  <div className="mb-1 text-[10px] uppercase text-white/40">Difference</div>
                  <div className={'font-mono text-base font-bold ' + (sel.difference >= 0 ? 'text-emerald-400' : 'text-red-400')}>{sel.difference >= 0 ? '+' : ''}{money(sel.difference)}</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-white/50">These {sel.excludedCount} “{sel.label}” trades contributed {sel.difference >= 0 ? 'a gain of' : 'a loss of'} <span className="font-mono text-white/70">{money(Math.abs(sel.difference))}</span> to your historical results.</div>
            </>
          ) : (
            <div className="text-xs text-white/40">Select a behavior to see how those trades contributed to your results.</div>
          )}
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {cats.map((c) => (
          <Card key={c.key}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">{c.label}</div>
              <div className="font-mono text-lg font-extrabold text-red-400">-{moneyShort(c.totalLoss)}</div>
            </div>
            <div className="mt-1 text-xs text-white/45">{c.count} instances · {c.trades.length} trades</div>
            <TradeDrawer trades={c.trades} />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── AI Coach ──── */

function AITab({ preset }) {
  const [analysisType, setAnalysisType] = useState('overview');
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const AI_TYPES = [
    { key: 'overview', label: 'Overall Patterns' },
    { key: 'weekday_patterns', label: 'Weekday Analysis' },
    { key: 'rule_breaches', label: 'Rule Breaches' },
    { key: 'loss_attribution', label: 'Loss Root Causes' },
    { key: 'setup_analysis', label: 'Setup Performance' },
  ];

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setExplanation(null);
    const result = await fetchAIExplanation(analysisType, preset);
    if (result.error) setError(result.error);
    else setExplanation(result.explanation);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle emoji="✦">Your AI Coach</SectionTitle>
        <p className="-mt-2 mb-4 text-xs text-white/50">Reads only your verified stats to explain patterns and suggest your next focus. It never creates violations or changes your data.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {AI_TYPES.map((t) => (
            <button key={t.key} onClick={() => { setAnalysisType(t.key); setExplanation(null); setError(null); }}
              className={'rounded-lg px-3 py-1.5 text-xs font-medium transition-all ' + (analysisType === t.key ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30' : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70')}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/20 disabled:opacity-50">
          {loading ? 'Analyzing…' : 'Analyze with AI'}
        </button>
      </Card>
      {error && <ErrorCard error={error} />}
      {explanation && (
        <Card>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">💡 Insights</div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{explanation}</div>
        </Card>
      )}
    </div>
  );
}

/* ─── Main ──── */

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview');
  const [preset, setPreset] = useState('all');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  const loadData = useCallback(async (t, p) => {
    setLoading(true);
    let result;
    if (t === 'overview') {
      const [v2, loss, pattern] = await Promise.all([
        fetchAnalyticsOverviewV2(p),
        fetchLossAttribution(p),
        fetchDayPatternAnalytics(p),
      ]);
      result = { ...(v2 || {}), loss, pattern };
    } else if (t === 'setups') {
      result = await fetchSetupAnalytics(p);
    } else if (t === 'breaches') {
      result = await fetchRuleBreachAnalytics(p);
    } else if (t === 'patterns') {
      result = await fetchDayPatternAnalytics(p);
    } else if (t === 'attribution') {
      result = await fetchLossAttribution(p);
    } else {
      result = null; // AI tab loads on demand
    }
    setData((prev) => ({ ...prev, [t + '_' + p]: result }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab !== 'ai') loadData(tab, preset);
  }, [tab, preset, loadData]);

  const cacheKey = tab + '_' + preset;
  const currentData = data[cacheKey] || null;

  async function handleBackfill() {
    setBackfilling(true);
    setBackfillResult(null);
    const result = await runBackfill();
    setBackfillResult(result);
    setBackfilling(false);
    setData({});
    loadData(tab, preset);
  }

  return (
    <div className="px-4 py-6 sm:px-6 pb-24 sm:pb-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">AI Analytics</h1>
          <p className="mt-1 text-sm text-white/45">Your discipline at a glance — less reading, more seeing.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={'rounded-full px-3 py-1.5 text-xs font-medium transition-all ' + (preset === p.key ? 'bg-white text-[#0a0a0f]' : 'border border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white/70')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Backfill banner (compact) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] px-4 py-3">
        <div className="text-xs text-white/55">
          <span className="font-medium text-violet-300">Auto-evaluation:</span> every trade is cross-checked against your Rulebook.
          {backfillResult && backfillResult.errors && backfillResult.errors.length > 0 && (
            <span className="ml-2 text-red-400">{backfillResult.errors.length} error(s): {backfillResult.errors[0]}</span>
          )}
          {backfillResult && backfillResult.error && <span className="ml-2 text-red-400">{backfillResult.error}</span>}
          {backfillResult && !backfillResult.error && (!backfillResult.errors || backfillResult.errors.length === 0) && (
            <span className="ml-2 text-emerald-400">Evaluated {backfillResult.total} trades ({backfillResult.evaluated} checks)</span>
          )}
        </div>
        <button onClick={handleBackfill} disabled={backfilling}
          className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-200 transition-all hover:bg-violet-500/30 disabled:opacity-50">
          {backfilling ? 'Evaluating…' : 'Re-evaluate All Trades'}
        </button>
      </div>

      {/* Tabs */}
      <div className="scrollbar-hide mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={'flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium transition-all ' + (tab === t.key ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70')}>
            <span className="grid h-[22px] w-[22px] place-items-center rounded-md bg-white/[0.06] text-[13px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[320px]">
        {loading && !currentData ? (
          <LoadingState />
        ) : (
          <>
            {tab === 'overview' && <OverviewTab data={currentData} />}
            {tab === 'setups' && <SetupsTab data={currentData} />}
            {tab === 'breaches' && <BreachesTab data={currentData} />}
            {tab === 'patterns' && <PatternsTab data={currentData} />}
            {tab === 'attribution' && <AttributionTab data={currentData} />}
            {tab === 'ai' && <AITab preset={preset} />}
          </>
        )}
      </div>
    </div>
  );
}
