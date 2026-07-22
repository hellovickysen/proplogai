'use client';

import { useEffect, useState } from 'react';
import ShareCard from './ShareCard';
import EmailGate from './EmailGate';

/* ═══════════════════════════════════════════════════════════════
   Report — the full results experience
   ═══════════════════════════════════════════════════════════════ */

export default function Report({ report, onReset, firms }) {
  const [verified, setVerified] = useState(false);

  return (
    <div className="relative mx-auto max-w-3xl space-y-6">
      {/* Email gate overlay — blurs the report until verified */}
      {!verified && (
        <EmailGate onVerified={() => setVerified(true)} />
      )}

      {/* Blurred content wrapper — blur-2xl + low opacity so nothing is readable */}
      <div className={!verified ? 'pointer-events-none select-none blur-2xl opacity-40 transition-all duration-500' : 'transition-all duration-500'}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Your Analysis</h2>
        <button onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50 hover:bg-white/[0.06] hover:text-white">
          ← New Analysis
        </button>
      </div>

      {/* 1. Pass Meter + Level + Percentile */}
      <PassMeter report={report} />

      {/* 2. Probability Breakdown */}
      <BreakdownSection items={report.probabilityBreakdown} />

      {/* 3. Best Challenge + Challenge Suitability */}
      <BestChallenge best={report.bestChallenge} />
      <SuitabilityTable data={report.challengeSuitability} bestId={report.bestChallenge.profileId} />

      {/* 4. Expected Days */}
      <ExpectedDays days={report.expectedDays} />

      {/* 5. Trading Personality */}
      <PersonalityCard personality={report.personality} />

      {/* 6. Badges */}
      <BadgesSection badges={report.badges} />

      {/* 7. Industry Comparison */}
      <IndustrySection stats={report.statistics} percentile={report.percentile} />

      {/* 8. Biggest Mistake */}
      <BiggestMistakeCard mistake={report.biggestMistake} />

      {/* 9. Could Have Passed — Improvements */}
      <ImprovementsSection items={report.improvements} />

      {/* 10. Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ListCard title="Strengths" items={report.strengths} icon="✓" color="#34d399" />
        <ListCard title="Weaknesses" items={report.weaknesses} icon="✕" color="#f87171" />
      </div>

      {/* 11. Failure Reasons */}
      <FailureReasons items={report.failureReasons} />

      {/* 12. Confidence Meter */}
      <ConfidenceSection confidence={report.confidence} reasons={report.confidenceReasons} stats={report.statistics} />

      {/* 13. AI Verdict */}
      <VerdictCard verdict={report.verdict} probability={report.overallProbability} />

      {/* 14. Share + CTA */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <ShareCard report={report} />
      </div>
      <CTASection />

      </div>{/* end blur wrapper */}
    </div>
  );
}

/* ── 1. Pass Meter ─────────────────────────────────────────── */

function PassMeter({ report }) {
  const [prob, setProb] = useState(0);
  const target = report.overallProbability;
  const { traderLevel, percentile } = report;

  useEffect(() => {
    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min((now - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProb(Math.round(eased * target * 10) / 10);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const color = target >= 65 ? '#34d399' : target >= 40 ? '#fbbf24' : '#f87171';
  const levelColors = { Beginner: '#f87171', Intermediate: '#fb923c', Advanced: '#fbbf24', Professional: '#60a5fa', Elite: '#34d399' };
  const levelColor = levelColors[traderLevel.level] || '#fbbf24';

  // Gauge segments
  const segments = ['Unsafe', 'Fair', 'Good', 'Excellent', 'Elite'];
  const segIdx = target >= 80 ? 4 : target >= 65 ? 3 : target >= 50 ? 2 : target >= 30 ? 1 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10 blur-3xl" style={{ background: color }} />

      <div className="relative">
        {/* Label */}
        <div className="mb-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/35">Pass Readiness</div>
        </div>

        {/* Gauge bar */}
        <div className="mx-auto max-w-md mb-2">
          <div className="flex gap-1">
            {segments.map((seg, i) => (
              <div key={seg} className="flex-1">
                <div className={`h-2.5 rounded-full ${i <= segIdx ? '' : 'opacity-20'}`}
                  style={{ background: i <= segIdx ? color : 'rgba(255,255,255,0.1)' }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between">
            {segments.map((seg, i) => (
              <span key={seg} className={`text-[9px] ${i === segIdx ? 'text-white/70 font-semibold' : 'text-white/20'}`}>{seg}</span>
            ))}
          </div>
        </div>

        {/* Big number */}
        <div className="text-center mt-6">
          <div className="text-5xl font-bold md:text-6xl" style={{ color }}>{prob}%</div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ color: levelColor, background: levelColor + '15', border: `1px solid ${levelColor}33` }}>
              {traderLevel.level}
            </span>
            <span className="text-xs text-white/40">{traderLevel.score}/100</span>
          </div>
        </div>

        {/* Percentile */}
        <p className="mt-4 text-center text-sm text-white/45">
          You are more prepared than <span className="font-semibold text-white/70">{percentile}%</span> of traders who upload their history.
        </p>
      </div>
    </div>
  );
}

/* ── 2. Probability Breakdown ──────────────────────────────── */

function BreakdownSection({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Probability Breakdown">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.factor} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-white/70">{item.factor}</span>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.abs(item.impact) * 3)}%`, background: item.impact >= 0 ? '#34d399' : '#f87171' }} />
              </div>
              <span className="min-w-[3.5rem] text-right font-mono text-sm font-bold" style={{ color: item.impact >= 0 ? '#34d399' : '#f87171' }}>
                {item.impact >= 0 ? '+' : ''}{item.impact}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 3. Best Challenge ─────────────────────────────────────── */

function BestChallenge({ best }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < best.rating ? '★' : '☆').join('');
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/35">Best Match</div>
      <div className="mt-2 text-2xl text-amber-400">{stars}</div>
      <div className="mt-1 text-xl font-bold text-white">{best.name}</div>
      <p className="mt-2 text-sm text-white/45">{best.reason}</p>
    </div>
  );
}

function SuitabilityTable({ data, bestId }) {
  return (
    <Card title="Challenge Suitability">
      <div className="space-y-2">
        {data.map((d) => {
          const isBest = d.profileId === bestId;
          const color = d.passRate >= 65 ? '#34d399' : d.passRate >= 40 ? '#fbbf24' : '#f87171';
          const diffLabel = d.difficulty;
          const diffStars = d.passRate >= 75 ? 5 : d.passRate >= 55 ? 4 : d.passRate >= 40 ? 3 : d.passRate >= 25 ? 2 : 1;
          return (
            <div key={d.profileId}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${isBest ? 'border border-white/15 bg-white/[0.05]' : 'bg-white/[0.02]'}`}>
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">{d.profileName}</span>
                    {isBest && <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Best</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{diffLabel}</span>
                    <span className="text-[10px] text-amber-400/60">{'★'.repeat(diffStars)}{'☆'.repeat(5 - diffStars)}</span>
                  </div>
                </div>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color }}>{d.passRate}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── 4. Expected Days ──────────────────────────────────────── */

function ExpectedDays({ days }) {
  if (!days?.length) return null;
  return (
    <Card title="Expected Time to Pass">
      <div className="grid grid-cols-3 gap-3">
        {days.map((d) => (
          <div key={d.label} className="rounded-xl bg-white/[0.03] p-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">{d.label}</div>
            <div className="mt-1 text-2xl font-bold text-white">{d.days}</div>
            <div className="text-xs text-white/35">Trading Days</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 5. Trading Personality ────────────────────────────────── */

function PersonalityCard({ personality }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.06] to-cyan-500/[0.04] p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/35 mb-3">Trading Personality</div>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
          {personality.emoji}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{personality.title}</div>
          <p className="mt-1 text-sm text-white/45">{personality.description}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 6. Badges ─────────────────────────────────────────────── */

function BadgesSection({ badges }) {
  const unlocked = badges.filter(b => b.unlocked);
  const locked = badges.filter(b => !b.unlocked);
  if (unlocked.length === 0 && locked.length === 0) return null;

  return (
    <Card title={`Badges (${unlocked.length}/${badges.length} Unlocked)`}>
      <div className="flex flex-wrap gap-2">
        {unlocked.map(b => (
          <span key={b.id} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-xs font-semibold text-amber-300">
            {b.emoji} {b.title}
          </span>
        ))}
        {locked.map(b => (
          <span key={b.id} className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.01] px-3 py-1.5 text-xs text-white/20">
            🔒 {b.title}
          </span>
        ))}
      </div>
    </Card>
  );
}

/* ── 7. Industry Comparison ────────────────────────────────── */

function IndustrySection({ stats, percentile }) {
  const benchmarks = [
    { metric: 'Win Rate', yours: `${stats.winRate.toFixed(1)}%`, average: '48%', percentile: stats.winRate > 48 ? Math.min(92, Math.round(50 + (stats.winRate - 48) * 4)) : Math.max(8, Math.round(50 - (48 - stats.winRate) * 4)), verdict: stats.winRate > 50 ? 'above' : stats.winRate > 46 ? 'average' : 'below' },
    { metric: 'Risk Management', yours: `${stats.riskConsistency}/100`, average: '45/100', percentile: stats.riskConsistency > 45 ? Math.min(95, Math.round(50 + (stats.riskConsistency - 45) * 2)) : Math.max(8, Math.round(50 - (45 - stats.riskConsistency) * 2)), verdict: stats.riskConsistency > 60 ? 'above' : stats.riskConsistency > 40 ? 'average' : 'below' },
    { metric: 'Profit Factor', yours: stats.profitFactor >= 99 ? '99+' : stats.profitFactor.toFixed(2), average: '1.15', percentile: stats.profitFactor > 1.15 ? Math.min(95, Math.round(50 + (stats.profitFactor - 1.15) * 30)) : Math.max(5, Math.round(50 - (1.15 - stats.profitFactor) * 40)), verdict: stats.profitFactor > 1.5 ? 'above' : stats.profitFactor > 1 ? 'average' : 'below' },
    { metric: 'Consistency', yours: `${stats.positionSizeConsistency}/100`, average: '42/100', percentile: stats.positionSizeConsistency > 42 ? Math.min(92, Math.round(50 + (stats.positionSizeConsistency - 42) * 2)) : Math.max(10, Math.round(50 - (42 - stats.positionSizeConsistency) * 2)), verdict: stats.positionSizeConsistency > 60 ? 'above' : stats.positionSizeConsistency > 38 ? 'average' : 'below' },
  ];

  const verdictColors = { above: '#34d399', average: '#fbbf24', below: '#f87171' };
  const verdictLabels = { above: 'Above Avg', average: 'Average', below: 'Below Avg' };

  return (
    <Card title="Industry Comparison">
      <p className="mb-4 text-xs text-white/35">Compared with industry benchmarks from 12,000+ analyzed traders</p>
      <div className="space-y-3">
        {benchmarks.map(b => (
          <div key={b.metric} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
            <div>
              <div className="text-sm text-white/70">{b.metric}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs">
                <span className="text-white/50">You: <span className="font-semibold text-white/80">{b.yours}</span></span>
                <span className="text-white/25">|</span>
                <span className="text-white/30">Avg: {b.average}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold" style={{ color: verdictColors[b.verdict] }}>{verdictLabels[b.verdict]}</span>
              <div className="mt-0.5 font-mono text-[10px] text-white/30">Top {100 - b.percentile}%</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 8. Biggest Mistake ────────────────────────────────────── */

function BiggestMistakeCard({ mistake }) {
  if (mistake.title === 'No Major Issues') return null;
  return (
    <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.03] p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-red-400/50 mb-3">Your Biggest Weakness</div>
      <div className="text-lg font-bold text-white mb-2">{mistake.title}</div>
      <p className="text-sm text-white/50 leading-relaxed">{mistake.description}</p>
      <div className="mt-3 rounded-xl bg-white/[0.03] px-4 py-2.5 text-xs text-emerald-400/80">
        {mistake.impact}
      </div>
    </div>
  );
}

/* ── 9. Could Have Passed — Improvements ───────────────────── */

function ImprovementsSection({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Could Have Passed">
      <p className="mb-4 text-xs text-white/35">If you had made these changes:</p>
      <div className="space-y-3">
        {items.map((imp, i) => (
          <div key={i} className="rounded-xl bg-white/[0.02] p-4">
            <div className="text-sm font-medium text-white">{imp.title}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 rounded-lg bg-white/[0.03] px-3 py-2 text-center">
                <div className="font-mono text-[10px] uppercase text-white/30">Current</div>
                <div className="mt-0.5 font-mono text-sm text-white/60">{imp.current}</div>
              </div>
              <span className="text-lg text-white/20">→</span>
              <div className="flex-1 rounded-lg bg-emerald-400/5 border border-emerald-400/10 px-3 py-2 text-center">
                <div className="font-mono text-[10px] uppercase text-emerald-400/50">Target</div>
                <div className="mt-0.5 font-mono text-sm text-emerald-400">{imp.recommended}</div>
              </div>
            </div>
            <div className="mt-2 text-right text-xs text-white/40">
              Estimated: <span className="font-semibold text-emerald-400">{imp.estimatedImpact}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 10. Strengths & Weaknesses ────────────────────────────── */

function ListCard({ title, items, icon, color }) {
  if (!items?.length) return null;
  return (
    <Card title={title}>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/60">
            <span className="mt-0.5 shrink-0 text-xs font-bold" style={{ color }}>{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── 11. Failure Reasons ───────────────────────────────────── */

function FailureReasons({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Why Simulations Failed">
      <div className="space-y-2">
        {items.map((f) => {
          const color = f.percentage >= 40 ? '#f87171' : f.percentage >= 20 ? '#fb923c' : '#fbbf24';
          return (
            <div key={f.reason} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-white/60">{f.reason}</span>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, f.percentage)}%`, background: color }} />
                </div>
                <span className="w-12 text-right font-mono text-sm font-bold" style={{ color }}>{f.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── 12. Confidence Meter ──────────────────────────────────── */

function ConfidenceSection({ confidence, reasons, stats }) {
  const confColors = { High: '#34d399', Medium: '#fbbf24', Low: '#f87171' };
  const color = confColors[confidence];
  const pct = confidence === 'High' ? 85 : confidence === 'Medium' ? 55 : 25;

  return (
    <Card title="Confidence Level">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color }}>{pct}%</div>
          <div className="mt-0.5 text-xs font-semibold" style={{ color }}>{confidence}</div>
        </div>
        <div className="flex-1">
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/45">
                <span className="text-emerald-400/60">✓</span> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ── 13. AI Verdict ────────────────────────────────────────── */

function VerdictCard({ verdict, probability }) {
  const color = probability >= 65 ? '#34d399' : probability >= 40 ? '#fbbf24' : '#f87171';
  const label = probability >= 65 ? 'You are ready.' : probability >= 40 ? 'Almost there.' : 'Not yet ready.';

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.04] to-cyan-500/[0.03] p-6 md:p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-4">Final Verdict</div>
      <div className="text-2xl font-bold mb-3" style={{ color }}>{label}</div>
      <p className="text-sm text-white/55 leading-relaxed">{verdict}</p>
    </div>
  );
}

/* ── 14. CTA ───────────────────────────────────────────────── */

function CTASection() {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-8 text-center">
      <p className="text-lg font-semibold text-white">
        Want this probability to update automatically after every trade?
      </p>
      <p className="mt-2 text-sm text-white/40">
        Track your pass readiness in real-time with PropLogAI.
      </p>
      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a href="/auth/signup"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
          ⭐ Track My Probability Live
        </a>
      </div>
    </div>
  );
}

/* ── Shared ────────────────────────────────────────────────── */

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/35">{title}</h3>
      {children}
    </div>
  );
}
