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
  fetchCoach,
  startChallenge,
  getChallenge,
  abandonChallenge,
  runBackfill,
} from './actions';

/* ─── Config ──── */

const PRESETS = [
  { key: 'this_week', label: 'Week' },
  { key: 'last_week', label: 'Last wk' },
  { key: 'this_month', label: 'Month' },
  { key: 'this_year', label: 'Year' },
  { key: 'all', label: 'All time' },
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'setups', label: 'My Setups' },
  { key: 'breaches', label: 'My Mistakes' },
  { key: 'patterns', label: 'Patterns' },
  { key: 'attribution', label: 'Where I Lose' },
  { key: 'ai', label: 'Coach' },
];

const DONUT_COLORS = ['#fb7185', '#f0abfc', '#a78bfa', '#22d3ee', '#fbbf24', '#34d399'];

const LEAK_HEADLINE = {
  not_following_setup: 'Stop trading without a setup.',
  fomo: 'Cut the FOMO entries.',
  over_sizing: 'Rein in your position size.',
  over_trading: 'Stop over-trading.',
  bad_sl: 'Respect your stop loss.',
  daily_loss_limit: 'Honour your daily loss limit.',
};

/* ─── Helpers ──── */

function money(n) {
  const v = Number(n) || 0;
  return (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2);
}
function moneyShort(n) {
  const v = Math.abs(Number(n) || 0);
  return v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'k' : '$' + Math.round(v);
}

/* ─── Primitives ──── */

function Card({ children, className = '' }) {
  return <div className={'rounded-3xl border border-white/[0.07] bg-white/[0.028] p-6 sm:p-7 ' + className}>{children}</div>;
}
function KLabel({ children }) {
  return <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">{children}</div>;
}
function Lead({ children }) {
  return <div className="text-xl font-bold leading-snug tracking-tight sm:text-[22px]">{children}</div>;
}
function HL({ children }) {
  return <span className="bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] bg-clip-text text-transparent">{children}</span>;
}
function LoadingState() {
  return <div className="flex items-center justify-center py-24"><div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-[#8b7cf6]" /></div>;
}
function EmptyState({ message }) {
  return <div className="py-20 text-center text-sm text-white/40">{message}</div>;
}
function ErrorCard({ error }) {
  return <Card className="border-red-500/20"><div className="text-sm text-red-400">Error: {error}</div><div className="mt-2 text-xs text-white/40">Try “Re-evaluate All Trades”, or refresh.</div></Card>;
}

function ScoreDial({ value, delta, provisional, size = 196 }) {
  const has = value != null;
  const v = has ? Math.max(0, Math.min(100, value)) : 0;
  const cx = size / 2;
  const r = cx - 16;
  const C = 2 * Math.PI * r;
  const off = C * (1 - v / 100);
  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size}>
        <defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b7cf6" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {has && <circle cx={cx} cy={cx} r={r} fill="none" stroke="url(#dg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform={'rotate(-90 ' + cx + ' ' + cx + ')'} />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-extrabold leading-none tracking-tight" style={{ fontSize: size * 0.27 }}>{has ? v : '—'}</span>
        <span className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-white/35">Discipline / 100</span>
        {provisional && <span className="mt-1.5 rounded-full bg-amber-500/12 px-2 py-0.5 text-[9.5px] font-semibold text-amber-300">Provisional</span>}
        {delta != null && delta !== 0 && <span className={'mt-1 text-xs font-semibold ' + (delta > 0 ? 'text-emerald-400' : 'text-red-400')}>{delta > 0 ? '▲ +' : '▼ '}{delta} this period</span>}
      </div>
    </div>
  );
}

function KpiRow({ items }) {
  return (
    <div className="mt-6 flex flex-wrap border-t border-white/[0.07] pt-5">
      {items.map((it, i) => (
        <div key={i} className={'min-w-[110px] flex-1 ' + (i > 0 ? 'border-l border-white/[0.07] pl-5' : '')}>
          <div className={'text-[22px] font-extrabold tracking-tight ' + (it.tone || 'text-white')}>{it.v}</div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.06em] text-white/35">{it.l}</div>
        </div>
      ))}
    </div>
  );
}

function FocusStatement({ tag, tagTone = 'bad', title, detail, ctaLabel, ctaHref }) {
  return (
    <div>
      <div className={'text-[11px] font-semibold uppercase tracking-[0.08em] ' + (tagTone === 'bad' ? 'text-[#fb7185]' : 'text-emerald-400')}>{tag}</div>
      <div className="mt-2.5 text-2xl font-bold leading-[1.15] tracking-tight sm:text-[26px]">{title}</div>
      {detail && <p className="mt-2 text-sm leading-relaxed text-white/55">{detail}</p>}
      {ctaLabel && <Link href={ctaHref || '#'} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] px-4 py-2.5 text-[13px] font-bold text-[#0a0a12]">{ctaLabel}</Link>}
    </div>
  );
}

function Donut({ items, centerTop, centerSub }) {
  const C = 465;
  const R = 74;
  const sum = items.reduce((s, it) => s + Math.abs(it.value), 0) || 1;
  let acc = 0;
  const segs = items.map((it, i) => {
    const seg = (Math.abs(it.value) / sum) * C;
    const node = <circle key={i} cx="94" cy="94" r={R} stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeDasharray={seg + ' ' + (C - seg)} strokeDashoffset={-acc} />;
    acc += seg;
    return node;
  });
  return (
    <svg width="188" height="188" viewBox="0 0 188 188" className="flex-none">
      <circle cx="94" cy="94" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="17" />
      <g transform="rotate(-90 94 94)" fill="none" strokeWidth="17">{segs}</g>
      <text x="94" y="90" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800" fontFamily="ui-monospace,monospace">{centerTop}</text>
      <text x="94" y="110" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8.5" letterSpacing="1.5">{centerSub}</text>
    </svg>
  );
}

function DonutLegend({ items }) {
  return (
    <div className="mt-4 flex max-w-[340px] flex-col gap-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3 text-[13px] text-white/60">
          <span className="h-2.5 w-2.5 flex-none rounded" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
          <span>{it.label}</span>
          <span className="ml-auto font-mono text-white/40">-{moneyShort(it.value)}{it.pct != null ? ' · ' + it.pct + '%' : ''}</span>
        </div>
      ))}
    </div>
  );
}

/* Highlight-only bars: color just the best (green) and worst (red); rest quiet grey. */
function HighlightBars({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState message="Not enough data yet." />;
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  const bestVal = Math.max(...rows.map((r) => r.value));
  const worstVal = Math.min(...rows.map((r) => r.value));
  return (
    <div className="flex items-end gap-3" style={{ height: '150px' }}>
      {rows.map((r, i) => {
        const h = Math.max(6, Math.round((Math.abs(r.value) / max) * 100));
        const isBest = r.value === bestVal && bestVal > 0;
        const isWorst = r.value === worstVal && worstVal < 0;
        const bg = isBest ? 'linear-gradient(#34d399,#059669)' : isWorst ? 'linear-gradient(#fb7185,#be123c)' : 'rgba(255,255,255,0.12)';
        return (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2.5">
            <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
              <div className="w-[46%] rounded-t-md" style={{ height: h + '%', background: bg }} title={money(r.value)} />
            </div>
            <span className={'text-[11px] ' + (isBest ? 'text-emerald-400' : isWorst ? 'text-red-400' : 'text-white/35')}>{r.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TradeDrawer({ trades }) {
  const [open, setOpen] = useState(false);
  if (!trades || trades.length === 0) return null;
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="text-xs font-medium text-[#a78bfa] hover:text-[#c4b5fd]">{open ? 'Hide trades' : 'Show the trades (' + trades.length + ') →'}</button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {trades.slice(0, 20).map((t) => {
            const pnl = Number(t.pnl); const win = pnl > 0;
            return (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                <span className="font-mono font-semibold text-white/80">{t.pair}</span>
                <div className="flex items-center gap-3">{t.trade_date && <span className="text-white/30">{t.trade_date}</span>}<span className={'font-mono font-semibold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{Number.isFinite(pnl) ? (win ? '+' : '') + money(pnl) : '—'}</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Radar({ points }) {
  const n = points.length;
  if (n < 3) return null;
  const cx = 88, cy = 92, R = 60;
  const ang = (i) => (-Math.PI / 2) + (i * 2 * Math.PI / n);
  const pt = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  const rings = [0.5, 1].map((f, k) => <polygon key={'r' + k} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" points={points.map((_, i) => pt(i, R * f).join(',')).join(' ')} />);
  const axes = points.map((_, i) => { const a = pt(i, R); return <line key={'a' + i} x1={cx} y1={cy} x2={a[0]} y2={a[1]} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; });
  const poly = points.map((p, i) => pt(i, R * (Math.max(0, Math.min(100, p.value)) / 100)).join(',')).join(' ');
  return (
    <svg width="176" height="184" viewBox="0 0 176 184" className="flex-none">
      <defs><linearGradient id="rf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8b7cf6" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
      {rings}{axes}
      <polygon points={poly} fill="url(#rf)" fillOpacity="0.38" stroke="#8b7cf6" strokeWidth="1.5" />
      {points.map((p, i) => { const a = pt(i, R + 14); return <text key={'l' + i} x={a[0]} y={a[1]} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="rgba(255,255,255,0.5)">{p.short}</text>; })}
    </svg>
  );
}

/* ─── Overview ──── */

function KpiCard({ value, label, tone }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
      <div className={'text-2xl font-extrabold tracking-tight ' + (tone || 'text-white')}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.07em] text-white/40">{label}</div>
    </div>
  );
}

function OverviewTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  const total = data.totalTrades || 0;
  if (total === 0) return <EmptyState message="No trades in this period yet. Log some trades to meet your analytics." />;
  const sc = data.disciplineScore || {};
  const pr = data.problem;
  const st = data.strength;
  const rate = Math.round(((data.uniqueBreachedTrades || 0) / total) * 100);
  const SHORT = { rule_adherence: 'Rules', setup_adherence: 'Setup', post_loss_discipline: 'Post-loss', risk_consistency: 'Risk' };
  const radarPoints = (sc.dimensions || []).filter((d) => d.hasData).map((d) => ({ short: SHORT[d.key] || d.label, value: d.value }));

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto]">
        {/* Left — big circle + #1 focus + fix */}
        <div className="flex flex-col items-start gap-4">
          <div className="mx-auto lg:mx-0"><ScoreDial value={sc.score} delta={sc.delta} provisional={sc.provisional} size={168} /></div>
          {pr ? (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#fb7185]">Your #1 focus</div>
              <div className="mt-1.5 text-xl font-bold leading-[1.15] tracking-tight sm:text-2xl">{LEAK_HEADLINE[pr.key] || pr.label}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">It&#39;s cost you <b className="font-mono text-white">-{moneyShort(pr.attributableLoss)}</b> across <b className="text-white">{pr.violations}</b> trades — {pr.pctOfAttributable}% of your rule-break losses.</p>
              <Link href="/dashboard/rulebook" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] px-4 py-2.5 text-[13px] font-bold text-[#0a0a12]">Fix this rule →</Link>
            </div>
          ) : (
            <div><KLabel>Nice</KLabel><Lead>No rule-break leak this period. Keep it clean. 🎯</Lead></div>
          )}
        </div>

        {/* Middle — 2x2 KPI cards */}
        <div className="grid grid-cols-2 content-center gap-3">
          <KpiCard value={total} label="Total Trades" />
          <KpiCard value={<>{sc.cleanTrades != null ? sc.cleanTrades : '—'}<span className="text-base text-white/30">/{total}</span></>} label="Rules Kept" />
          <KpiCard value={rate + '%'} label="Breach Rate" tone={rate > 0 ? 'text-red-400' : 'text-emerald-400'} />
          <KpiCard value={st ? st.rate + '%' : '—'} label="Best Habit" tone="text-emerald-400" />
        </div>

        {/* Right — discipline radar (cone) */}
        <div className="flex items-center justify-center">
          {radarPoints.length >= 3
            ? <Radar points={radarPoints} />
            : <div className="text-center text-[11px] leading-relaxed text-white/30">Discipline radar<br />unlocks with more<br />rule data</div>}
        </div>
      </div>
    </Card>
  );
}

/* ─── My Setups ──── */

function SetupsTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (!data.setups || data.setups.length === 0) return <EmptyState message="No setup data in this period." />;
  const top = data.setups[0];
  return (
    <Card>
      <KLabel>My Setups</KLabel>
      <Lead><HL>{top.name}</HL> is your go-to — {data.totalTrades} trades across {data.setups.length} setups.</Lead>
      <div className="mt-5 divide-y divide-white/[0.06]">
        {data.setups.map((s) => (
          <div key={s.name} className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-2.5 text-xs text-white/45">
                  <span className="text-emerald-400">{s.wins}W</span><span className="text-red-400">{s.losses}L</span>
                  <span className={s.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>{s.totalPnl >= 0 ? '+' : ''}{s.totalPnl.toFixed(0)}</span>
                  <span className="text-white/25">·</span><span>{s.count} trades</span>
                </div>
              </div>
              {s.adherenceRate !== null && (
                <div className="text-right">
                  <div className={'text-lg font-extrabold ' + (s.adherenceRate >= 70 ? 'text-emerald-400' : s.adherenceRate >= 40 ? 'text-amber-400' : 'text-red-400')}>{s.adherenceRate}%</div>
                  <div className="text-[9.5px] uppercase tracking-wide text-white/30">adherence</div>
                </div>
              )}
            </div>
            {s.ruleBreakCost != null && (
              <div className="mt-2 text-[11.5px] text-amber-200/70">⚠️ Positive P&amp;L, but this behavior cost you <span className="font-mono">-{moneyShort(s.ruleBreakCost)}</span> in attributable losses.</div>
            )}
            <TradeDrawer trades={s.trades} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── My Mistakes ──── */

function BreachesTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (!data.rules || data.rules.length === 0) return <EmptyState message="No rule breaches detected in this period. 🎯" />;
  const top = data.rules[0];
  const rest = data.rules.slice(1);
  return (
    <div className="space-y-4">
      <Card className="border-red-500/15">
        <FocusStatement
          tag="Your biggest mistake"
          title={top.label}
          detail={<><b className="font-mono text-white">-{moneyShort(top.lossAmount)}</b> lost across <b className="text-white">{top.broken}</b> breaks · {top.breachRate}% breach rate.</>}
        />
        <TradeDrawer trades={top.trades} />
      </Card>
      {rest.length > 0 && (
        <Card>
          <KLabel>Other mistakes</KLabel>
          <div className="mt-3 divide-y divide-white/[0.06]">
            {rest.map((r) => (
              <div key={r.key} className="flex items-center justify-between py-3 text-sm">
                <span className="text-white/75">{r.label}</span>
                <div className="flex items-center gap-4 text-xs"><span className="text-white/40">{r.breachRate}%</span><span className="font-mono font-semibold text-red-400">-{moneyShort(r.lossAmount)}</span></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Patterns ──── */

function PatternsTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (data.totalTrades === 0) return <EmptyState message="No trades in this period." />;
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const short = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
  const wk = order.map((d) => (data.weekdays || []).find((w) => w.day === d)).filter(Boolean);
  const wkRows = wk.map((w) => ({ label: short[w.day], value: w.pnl }));
  const best = wk.slice().sort((a, b) => b.pnl - a.pnl)[0];
  const worst = wk.slice().sort((a, b) => a.pnl - b.pnl)[0];
  const ae = data.afterEvents;
  const tn = (data.tradeNumbers || []).map((b) => ({ label: b.label, value: b.avgPnl }));
  return (
    <div className="space-y-4">
      <Card>
        <KLabel>When you trade well</KLabel>
        {best && worst && best.day !== worst.day
          ? <Lead>You&#39;re strongest on <HL>{best.day}s</HL> — and <span className="text-[#fb7185]">{worst.day}s</span> are where it slips.</Lead>
          : <Lead>Your day-by-day performance.</Lead>}
        <div className="mt-5"><HighlightBars rows={wkRows} /></div>
      </Card>

      {ae && (ae.afterLoss.total >= 3 || ae.afterWin.total >= 3) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <KLabel>After a win</KLabel>
            <div className="mt-2 text-3xl font-extrabold text-emerald-400">{ae.afterWin.winRate}%</div>
            <div className="mt-1 text-xs text-white/50">win rate · {ae.afterWin.avgPnl >= 0 ? '+' : ''}{money(ae.afterWin.avgPnl)} avg next trade</div>
          </Card>
          <Card>
            <KLabel>After a loss</KLabel>
            <div className="mt-2 text-3xl font-extrabold text-red-400">{ae.afterLoss.winRate}%</div>
            <div className="mt-1 text-xs text-white/50">win rate · {ae.afterLoss.avgPnl >= 0 ? '+' : ''}{money(ae.afterLoss.avgPnl)} avg{ae.afterLoss.avgRisk != null && ae.baselineAvgRisk != null && ae.afterLoss.avgRisk > ae.baselineAvgRisk ? ' · you risk more' : ''}</div>
          </Card>
        </div>
      )}

      {tn.length > 0 && (
        <Card>
          <KLabel>By trade number (per day)</KLabel>
          <Lead>Where in the day your edge lives.</Lead>
          <div className="mt-5"><HighlightBars rows={tn} /></div>
          <div className="mt-3 text-[11px] text-white/35">If later trades fade, cap your trades per day for the next 10 sessions.</div>
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
  const items = cats.slice(0, 6).map((c) => ({ label: c.label, value: c.totalLoss }));
  const totalLoss = items.reduce((s, it) => s + it.value, 0);
  const items2 = items.map((it) => ({ ...it, pct: totalLoss > 0 ? Math.round((it.value / totalLoss) * 100) : 0 }));
  const top = cats[0];
  const topPct = totalLoss > 0 ? Math.round((top.totalLoss / totalLoss) * 100) : 0;
  const whatIfList = Array.isArray(data.whatIf) ? data.whatIf : [];
  const sel = whatIfSel ? whatIfList.find((x) => x.key === whatIfSel) : null;
  const currentPnl = typeof data.currentPnl === 'number' ? data.currentPnl : 0;
  return (
    <div className="space-y-4">
      <Card>
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto sm:mx-0"><Donut items={items2} centerTop={moneyShort(totalLoss)} centerSub="LOST TO RULE-BREAKS" /></div>
          <div>
            <Lead><HL>{topPct}% of your losses</HL> come from one habit: {top.label.toLowerCase()}.</Lead>
            <DonutLegend items={items2} />
          </div>
        </div>
      </Card>

      {whatIfList.length > 0 && (
        <Card>
          <KLabel>What if you avoided a behavior?</KLabel>
          <p className="mt-2 text-[11.5px] leading-relaxed text-white/40">A historical look across your logged trades — not a prediction, and not recoverable profit.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {whatIfList.map((w) => (
              <button key={w.key} onClick={() => setWhatIfSel(w.key === whatIfSel ? null : w.key)}
                className={'rounded-lg px-3 py-1.5 text-xs font-medium transition-all ' + (whatIfSel === w.key ? 'bg-[#8b7cf6]/20 text-[#c4b5fd] ring-1 ring-[#8b7cf6]/30' : 'bg-white/[0.04] text-white/50 hover:text-white/70')}>
                {w.label}
              </button>
            ))}
          </div>
          {sel && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-6">
                <div><div className="text-[10px] uppercase text-white/35">Actual</div><div className={'font-mono text-lg font-bold ' + (currentPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{currentPnl >= 0 ? '+' : ''}{money(currentPnl)}</div></div>
                <div><div className="text-[10px] uppercase text-white/35">Without {sel.excludedCount}</div><div className={'font-mono text-lg font-bold ' + (sel.withoutPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{sel.withoutPnl >= 0 ? '+' : ''}{money(sel.withoutPnl)}</div></div>
                <div><div className="text-[10px] uppercase text-white/35">Difference</div><div className={'font-mono text-lg font-bold ' + (sel.difference >= 0 ? 'text-emerald-400' : 'text-red-400')}>{sel.difference >= 0 ? '+' : ''}{money(sel.difference)}</div></div>
              </div>
              <div className="mt-3 text-[11.5px] text-white/50">These {sel.excludedCount} “{sel.label}” trades contributed {sel.difference >= 0 ? 'a gain of' : 'a loss of'} <span className="font-mono text-white/70">{money(Math.abs(sel.difference))}</span> to your historical results.</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ─── Coach ──── */

function AITab({ data, preset }) {
  const [analysisType, setAnalysisType] = useState('overview');
  const [explanation, setExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [showAsk, setShowAsk] = useState(false);
  const [chOverride, setChOverride] = useState(null);
  const [chBusy, setChBusy] = useState(false);
  const [chErr, setChErr] = useState(null);
  useEffect(() => { setChOverride(null); setChErr(null); }, [data]);

  async function runAnalysis() {
    setAiLoading(true); setAiError(null); setExplanation(null);
    const result = await fetchAIExplanation(analysisType, preset);
    if (result.error) setAiError(result.error); else setExplanation(result.explanation);
    setAiLoading(false);
  }

  if (!data) return <LoadingState />;
  if (data.error) return <ErrorCard error={data.error} />;
  if (data.empty) return <EmptyState message="Log some trades and hit “Re-evaluate All Trades” to meet your coach." />;

  const p = data.profile || {};
  const findings = data.findings || [];
  const priority = data.priority;
  const sc = data.score || {};
  const SHORT = { rule_adherence: 'Rules', setup_adherence: 'Setup', post_loss_discipline: 'Post-loss', risk_consistency: 'Risk' };
  const radarPoints = (sc.dimensions || []).filter((d) => d.hasData).map((d) => ({ short: SHORT[d.key] || d.label, value: d.value }));
  const best = ((data.conditions && data.conditions.best) || []).slice().sort((a, b) => b.avgPnl - a.avgPnl)[0];
  const worst = ((data.conditions && data.conditions.worst) || []).slice().sort((a, b) => a.avgPnl - b.avgPnl)[0];
  const h = data.habits || {};
  const challenge = chOverride || data.challenge || null;

  async function startCh() {
    if (!priority || !priority.ruleKey) return;
    setChBusy(true); setChErr(null);
    const r = await startChallenge(priority.ruleKey, priority.label || priority.title);
    if (r && r.error) setChErr(r.error);
    else if (r && r.challenge) setChOverride(r.challenge);
    setChBusy(false);
  }
  async function refreshCh() { setChBusy(true); const r = await getChallenge(); setChOverride(r && r.challenge ? r.challenge : null); setChBusy(false); }
  async function abandonCh() { if (!challenge) return; setChBusy(true); await abandonChallenge(challenge.id); setChOverride(null); setChBusy(false); }

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Card>
        <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <KLabel>Your trader profile</KLabel>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-[30px]">{p.archetype}</h2>
            {p.score != null && <div className="mt-1 text-[11px] text-white/40">Discipline {p.score}/100{p.nextMilestone != null ? ' · next milestone ' + p.nextMilestone : ''}</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] p-4"><div className="text-[10px] uppercase tracking-wide text-emerald-400/70">Strength</div><div className="mt-1 text-sm text-white/85">{p.strength}</div></div>
              <div className="rounded-2xl border border-white/[0.07] p-4"><div className="text-[10px] uppercase tracking-wide text-red-400/70">Weakness</div><div className="mt-1 text-sm text-white/85">{p.weakness}</div></div>
            </div>
          </div>
          {radarPoints.length >= 3 && <div className="mx-auto sm:mx-0"><Radar points={radarPoints} /></div>}
        </div>
        {(best || worst) && (
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/[0.07] pt-4 text-[13px]">
            {best && <div className="text-white/60">Best when: <b className="text-white/90">{best.dim} {best.value}</b> <span className="font-mono text-emerald-400">+{money(best.avgPnl).replace('-', '')}</span></div>}
            {worst && <div className="text-white/60">Struggle with: <b className="text-white/90">{worst.dim} {worst.value}</b> <span className="font-mono text-red-400">{money(worst.avgPnl)}</span></div>}
          </div>
        )}
      </Card>

      {/* Focus this week */}
      {priority && (
        <div className="rounded-3xl border border-[#8b7cf6]/25 bg-[#8b7cf6]/[0.07] p-6 sm:p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c4b5fd]">Your focus this week</div>
          <div className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{challenge ? challenge.label : priority.action}</div>
          {challenge ? (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[12px]">
                <span className="text-white/55">{challenge.done ? 'Challenge complete 🎉' : 'Compliant trades'}</span>
                <span className="font-mono text-white/70">{challenge.compliant} / {challenge.target}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee]" style={{ width: Math.max(3, Math.round((challenge.compliant / challenge.target) * 100)) + '%' }} /></div>
              <div className="mt-2 text-[11px] text-white/40">{challenge.total} trades since you started{challenge.breaks > 0 ? ' · ' + challenge.breaks + ' slipped' : ''}. Log &amp; re-evaluate trades to update progress.</div>
              <div className="mt-3 flex gap-4 text-[12px]">
                <button onClick={refreshCh} disabled={chBusy} className="text-[#c4b5fd] hover:text-white disabled:opacity-50">Refresh</button>
                <button onClick={abandonCh} disabled={chBusy} className="text-white/40 hover:text-white/70 disabled:opacity-50">Give up</button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <button onClick={startCh} disabled={chBusy || !priority.ruleKey} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] px-4 py-2.5 text-[13px] font-bold text-[#0a0a12] disabled:opacity-50">{chBusy ? 'Starting…' : 'Start 10-Trade Challenge →'}</button>
              {chErr && <div className="mt-2 text-[11px] text-red-400">{chErr}</div>}
            </div>
          )}
        </div>
      )}

      {/* 3 things to work on */}
      {findings.length > 0 && (
        <Card>
          <KLabel>{findings.length} thing{findings.length > 1 ? 's' : ''} to work on</KLabel>
          <div className="mt-2 divide-y divide-white/[0.06]">
            {findings.map((f, i) => (
              <div key={i} className="flex gap-4 py-4">
                <div className="text-sm font-extrabold text-white/30">{i + 1}</div>
                <div><div className="text-[15px] font-semibold text-white">{f.title}</div><div className="mt-0.5 text-xs text-white/50">{f.detail}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Habits — quiet inline row */}
      <Card>
        <KLabel>Your habits</KLabel>
        <div className="mt-4 flex flex-wrap">
          {[
            { v: h.tradesPerDay != null ? h.tradesPerDay : '—', l: 'Trades / day' },
            { v: h.setupSelectionPct != null ? h.setupSelectionPct + '%' : '—', l: 'Setup selection' },
            { v: h.overtradingPct != null ? h.overtradingPct + '%' : '—', l: 'Overtrading' },
            { v: h.avgRisk != null ? money(h.avgRisk) : '—', l: 'Avg risk' },
          ].map((it, i) => (
            <div key={i} className={'min-w-[110px] flex-1 ' + (i > 0 ? 'border-l border-white/[0.07] pl-5' : '')}>
              <div className="text-xl font-extrabold tracking-tight">{it.v}</div>
              <div className="mt-1 text-[10.5px] uppercase tracking-[0.06em] text-white/35">{it.l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ask the AI — collapsed */}
      <Card>
        <button onClick={() => setShowAsk(!showAsk)} className="flex w-full items-center justify-between">
          <span className="text-[15px] font-semibold text-white">Ask the AI ✦</span>
          <span className="text-xs text-white/40">{showAsk ? 'Hide' : 'Open'}</span>
        </button>
        {showAsk && (
          <div className="mt-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {[{ key: 'overview', label: 'Overall' }, { key: 'weekday_patterns', label: 'Weekdays' }, { key: 'rule_breaches', label: 'Breaches' }, { key: 'loss_attribution', label: 'Losses' }, { key: 'setup_analysis', label: 'Setups' }].map((t) => (
                <button key={t.key} onClick={() => { setAnalysisType(t.key); setExplanation(null); setAiError(null); }}
                  className={'rounded-lg px-3 py-1.5 text-xs font-medium transition-all ' + (analysisType === t.key ? 'bg-[#8b7cf6]/20 text-[#c4b5fd] ring-1 ring-[#8b7cf6]/30' : 'bg-white/[0.04] text-white/50 hover:text-white/70')}>{t.label}</button>
              ))}
            </div>
            <button onClick={runAnalysis} disabled={aiLoading} className="rounded-xl bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] px-5 py-2.5 text-sm font-bold text-[#0a0a12] disabled:opacity-50">{aiLoading ? 'Analyzing…' : 'Analyze with AI'}</button>
            {aiError && <div className="mt-3 text-sm text-red-400">{aiError}</div>}
            {explanation && <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{explanation}</div>}
          </div>
        )}
      </Card>
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
      const [v2, loss, pattern] = await Promise.all([fetchAnalyticsOverviewV2(p), fetchLossAttribution(p), fetchDayPatternAnalytics(p)]);
      result = { ...(v2 || {}), loss, pattern };
    } else if (t === 'setups') { result = await fetchSetupAnalytics(p); }
    else if (t === 'breaches') { result = await fetchRuleBreachAnalytics(p); }
    else if (t === 'patterns') { result = await fetchDayPatternAnalytics(p); }
    else if (t === 'attribution') { result = await fetchLossAttribution(p); }
    else if (t === 'ai') { result = await fetchCoach(p); }
    else { result = null; }
    setData((prev) => ({ ...prev, [t + '_' + p]: result }));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(tab, preset); }, [tab, preset, loadData]);

  const cacheKey = tab + '_' + preset;
  const currentData = data[cacheKey] || null;

  async function handleBackfill() {
    setBackfilling(true); setBackfillResult(null);
    const result = await runBackfill();
    setBackfillResult(result); setBackfilling(false);
    setData({}); loadData(tab, preset);
  }

  return (
    <div className="px-4 py-6 sm:px-6 pb-24 sm:pb-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">AI Analytics</h1>
          <p className="mt-1 text-sm text-white/45">The one thing to fix — front and centre.</p>
        </div>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)}
              className={'rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-all ' + (preset === p.key ? 'bg-white text-[#0a0a12] font-semibold' : 'text-white/40 hover:text-white/70')}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="text-xs text-white/50">
          <span className="font-medium text-[#c4b5fd]">Auto-evaluation</span> · every trade cross-checked against your Rulebook.
          {backfillResult && backfillResult.errors && backfillResult.errors.length > 0 && <span className="ml-2 text-red-400">{backfillResult.errors.length} error(s): {backfillResult.errors[0]}</span>}
          {backfillResult && backfillResult.error && <span className="ml-2 text-red-400">{backfillResult.error}</span>}
          {backfillResult && !backfillResult.error && (!backfillResult.errors || backfillResult.errors.length === 0) && <span className="ml-2 text-emerald-400">Evaluated {backfillResult.total} trades ({backfillResult.evaluated} checks)</span>}
        </div>
        <button onClick={handleBackfill} disabled={backfilling} className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white disabled:opacity-50">{backfilling ? 'Evaluating…' : 'Re-evaluate'}</button>
      </div>

      <div className="mb-7 flex gap-6 overflow-x-auto border-b border-white/[0.07]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={'relative whitespace-nowrap pb-3 text-[13px] font-medium transition-colors ' + (tab === t.key ? 'text-white' : 'text-white/35 hover:text-white/60')}>
            {t.label}
            {tab === t.key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee]" />}
          </button>
        ))}
      </div>

      <div className="min-h-[340px]">
        {loading && !currentData ? <LoadingState /> : (
          <>
            {tab === 'overview' && <OverviewTab data={currentData} />}
            {tab === 'setups' && <SetupsTab data={currentData} />}
            {tab === 'breaches' && <BreachesTab data={currentData} />}
            {tab === 'patterns' && <PatternsTab data={currentData} />}
            {tab === 'attribution' && <AttributionTab data={currentData} />}
            {tab === 'ai' && <AITab data={currentData} preset={preset} />}
          </>
        )}
      </div>
    </div>
  );
}
