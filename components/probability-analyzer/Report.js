'use client';

import { useEffect, useState } from 'react';
import ShareCard from './ShareCard';

/* ── Report — single-page results ──────────────────────────── */

export default function Report({ report, onReset }) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Your Analysis</h2>
        <button
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50 hover:bg-white/[0.06] hover:text-white"
        >
          ← New Analysis
        </button>
      </div>

      {/* 1. Hero — Overall Probability */}
      <HeroCard report={report} />

      {/* 2. Best Challenge Recommendation */}
      <BestChallenge best={report.bestChallenge} />

      {/* 3. Expected Time to Pass */}
      <ExpectedDays days={report.expectedDays} />

      {/* 4. Challenge Suitability Table */}
      <SuitabilityTable data={report.challengeSuitability} bestId={report.bestChallenge.profileId} />

      {/* 5–6. Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ListCard title="Biggest Strengths" items={report.strengths} icon="✓" color="#34d399" />
        <ListCard title="Biggest Weaknesses" items={report.weaknesses} icon="✕" color="#f87171" />
      </div>

      {/* 7. Top 3 Improvements */}
      <Improvements items={report.improvements} />

      {/* 8. Failure Reasons */}
      <FailureReasons items={report.failureReasons} />

      {/* 9. Share Card */}
      <div className="flex items-center justify-center gap-4">
        <ShareCard report={report} />
      </div>

      {/* 10. CTA */}
      <CTA />
    </div>
  );
}

/* ── Section Components ────────────────────────────────────── */

function HeroCard({ report }) {
  const [prob, setProb] = useState(0);
  const target = report.overallProbability;

  useEffect(() => {
    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min((now - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProb(Math.round(eased * target * 10) / 10);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const color = target >= 65 ? '#34d399' : target >= 40 ? '#fbbf24' : '#f87171';
  const r = 70, circ = 2 * Math.PI * r;
  const offset = circ - (prob / 100) * circ;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-15 blur-3xl" style={{ background: color }} />

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg width="170" height="170" className="-rotate-90">
            <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="85" cy="85" r={r} fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{prob}%</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Pass Rate</span>
          </div>
        </div>

        {/* Meta */}
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-semibold text-white">Overall Pass Probability</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge label={`Confidence: ${report.confidence}`}
              color={report.confidence === 'High' ? '#34d399' : report.confidence === 'Medium' ? '#fbbf24' : '#f87171'} />
          </div>
          <p className="mt-3 text-sm text-white/45">
            Based on {report.statistics.totalTrades} trades over {report.statistics.tradingDays} trading days
          </p>
        </div>
      </div>
    </div>
  );
}

function BestChallenge({ best }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < best.rating ? '★' : '☆').join('');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
      <div className="font-mono text-xs uppercase tracking-wider text-white/40">Best Challenge Type</div>
      <div className="mt-2 text-2xl font-bold text-amber-400">{stars}</div>
      <div className="mt-1 text-xl font-bold text-white">{best.name}</div>
      <p className="mt-2 text-sm text-white/50">{best.reason}</p>
    </div>
  );
}

function ExpectedDays({ days }) {
  if (!days?.length) return null;
  return (
    <Card title="Expected Time to Pass">
      <div className="grid grid-cols-3 gap-3">
        {days.map((d) => (
          <div key={d.label} className="rounded-xl bg-white/[0.03] p-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">{d.label}</div>
            <div className="mt-1 text-2xl font-bold text-white">{d.days}</div>
            <div className="text-xs text-white/40">Trading Days</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SuitabilityTable({ data, bestId }) {
  return (
    <Card title="Challenge Suitability">
      <div className="space-y-2">
        {data.map((d) => {
          const isBest = d.profileId === bestId;
          const color = d.passRate >= 65 ? '#34d399' : d.passRate >= 40 ? '#fbbf24' : '#f87171';
          return (
            <div key={d.profileId}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${isBest ? 'border border-white/15 bg-white/[0.05]' : 'bg-white/[0.02]'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/80">{d.profileName}</span>
                {isBest && <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-400">Best</span>}
              </div>
              <span className="font-mono text-lg font-bold" style={{ color }}>{d.passRate}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ListCard({ title, items, icon, color }) {
  if (!items?.length) return null;
  return (
    <Card title={title}>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
            <span className="mt-0.5 shrink-0 text-xs font-bold" style={{ color }}>{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Improvements({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Top Improvements">
      <div className="space-y-3">
        {items.map((imp, i) => (
          <div key={i} className="rounded-xl bg-white/[0.02] p-4">
            <div className="text-sm font-medium text-white">{imp.title}</div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="rounded bg-white/5 px-2 py-1 font-mono text-white/50">{imp.current}</span>
              <span className="text-white/30">→</span>
              <span className="rounded bg-emerald-400/10 px-2 py-1 font-mono text-emerald-400">{imp.recommended}</span>
            </div>
            <div className="mt-2 text-xs text-white/40">
              Estimated impact: <span className="font-semibold text-emerald-400">{imp.estimatedImpact}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FailureReasons({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Failure Reasons">
      <div className="space-y-2">
        {items.map((f) => {
          const color = f.percentage >= 40 ? '#f87171' : f.percentage >= 20 ? '#fb923c' : '#fbbf24';
          return (
            <div key={f.reason} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-white/70">{f.reason}</span>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, f.percentage)}%`, background: color }} />
                </div>
                <span className="w-12 text-right font-mono text-sm font-semibold" style={{ color }}>{f.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CTA() {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-8 text-center">
      <p className="text-lg font-semibold text-white">
        Want this probability to update automatically after every trade?
      </p>
      <a href="/auth/signup"
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
        Track Every Trade with PropLogAI →
      </a>
    </div>
  );
}

/* ── Shared ────────────────────────────────────────────────── */

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-white/40">{title}</h3>
      {children}
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium"
      style={{ color, borderColor: color + '33', background: color + '10' }}>
      {label}
    </span>
  );
}
