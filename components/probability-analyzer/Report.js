'use client';

import { useEffect, useState } from 'react';
import EmailGate from './EmailGate';
import ShareCard from './ShareCard';

/* ═══════════════════════════════════════════════════════════════
   Report — redesigned based on founder feedback
   ═══════════════════════════════════════════════════════════════ */

export default function Report({ report, onReset, isLoggedIn = false }) {
  const [verified, setVerified] = useState(isLoggedIn);

  return (
    <div className="relative mx-auto max-w-3xl space-y-6">
      {!verified && <EmailGate onVerified={() => setVerified(true)} />}

      <div className={!verified ? 'pointer-events-none select-none blur-2xl opacity-40 transition-all duration-500' : 'transition-all duration-500'}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Your Analysis</h2>
        <button onClick={onReset} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50 hover:bg-white/[0.06] hover:text-white">
          ← New Analysis
        </button>
      </div>

      {/* 1. Prop Pass Score — Hero */}
      <PropPassScore report={report} />

      {/* 2. Simulation Summary */}
      <SimSummary data={report.simulationSummary} />

      {/* 3. Probability Breakdown */}
      <BreakdownSection items={report.probabilityBreakdown} />

      {/* 4. Best Challenge For You */}
      <BestChallenge best={report.bestChallenge} />
      <SuitabilityTable data={report.challengeSuitability} bestId={report.bestChallenge.profileId} />

      {/* 5. Challenge Timeline */}
      <TimelineSection days={report.expectedDays} />

      {/* 6. Ready Today? */}
      <ReadyToday ready={report.readyToday} probability={report.overallProbability} />

      {/* 7. Risk Meter */}
      <RiskMeterCard data={report.riskMeter} />

      {/* 8. Biggest Probability Killer */}
      <ProbabilityKiller killer={report.biggestKiller} probability={report.overallProbability} />

      {/* 9. Could Have Passed */}
      <ImprovementsSection items={report.improvements} />

      {/* 10. Strengths & Weaknesses */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ListCard title="Biggest Strengths" items={report.strengths} icon="✓" color="#34d399" />
        <ListCard title="Biggest Weaknesses" items={report.weaknesses} icon="✕" color="#f87171" />
      </div>

      {/* 11. Trading Style */}
      <PersonalityCard personality={report.personality} />

      {/* 12. Industry Comparison */}
      <IndustrySection stats={report.statistics} />

      {/* 13. Failure Reasons */}
      <FailureReasons items={report.failureReasons} />

      {/* 14. What Happens Next */}
      <WeekProjection weeks={report.weekProjection} />

      {/* 15. Confidence */}
      <ConfidenceSection confidence={report.confidence} reasons={report.confidenceReasons} />

      {/* 16. Final Verdict */}
      <VerdictCard verdict={report.verdict} probability={report.overallProbability} />

      {/* 17. CTA */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <ShareCard report={report} />
        {!isLoggedIn && (
          <a href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] transition-transform hover:scale-105"
            style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
            ⭐ Track This Live
          </a>
        )}
      </div>
      <CTASection isLoggedIn={isLoggedIn} />

      </div>{/* end blur wrapper */}
    </div>
  );
}

/* ── 1. Prop Pass Score ────────────────────────────────────── */

function PropPassScore({ report }) {
  const [score, setScore] = useState(0);
  const target = report.propPassScore;
  const prob = report.overallProbability;

  useEffect(() => {
    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min((now - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setScore(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const color = target >= 70 ? '#34d399' : target >= 50 ? '#fbbf24' : '#f87171';
  const stars = report.bestChallenge.rating;
  const segments = ['Poor', 'Average', 'Good', 'Excellent', 'Ready'];
  const segIdx = target >= 80 ? 4 : target >= 65 ? 3 : target >= 45 ? 2 : target >= 25 ? 1 : 0;
  const readyLabel = segments[segIdx];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-10 blur-3xl" style={{ background: color }} />

      <div className="relative text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-6">Prop Pass Score</div>

        {/* Score */}
        <div className="text-6xl font-bold md:text-7xl" style={{ color }}>
          {score} <span className="text-2xl text-white/20">/ 100</span>
        </div>

        {/* Ready label */}
        <div className="mt-3 text-lg font-semibold" style={{ color }}>{readyLabel}</div>

        {/* Stars */}
        <div className="mt-2 text-xl text-amber-400">
          {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
        </div>

        {/* Gauge bar */}
        <div className="mx-auto mt-5 max-w-sm">
          <div className="flex gap-1">
            {segments.map((seg, i) => (
              <div key={seg} className="flex-1">
                <div className={`h-2 rounded-full ${i <= segIdx ? '' : 'opacity-15'}`}
                  style={{ background: i <= segIdx ? color : 'rgba(255,255,255,0.1)' }} />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex justify-between">
            {segments.map((seg, i) => (
              <span key={seg} className={`text-[9px] ${i === segIdx ? 'text-white/60 font-semibold' : 'text-white/15'}`}>{seg}</span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-white/35">
          <span>Probability: <span className="font-semibold text-white/60">{prob}%</span></span>
          <span className="text-white/10">|</span>
          <span>{report.statistics.totalTrades} trades</span>
          <span className="text-white/10">|</span>
          <span>{report.statistics.tradingDays} days</span>
          <span className="text-white/10">|</span>
          <span>10,000 simulations</span>
        </div>
      </div>
    </div>
  );
}

/* ── 2. Simulation Summary ─────────────────────────────────── */

function SimSummary({ data }) {
  if (!data) return null;
  return (
    <div className="flex items-center justify-center gap-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase text-white/25">Simulations</div>
        <div className="font-mono text-sm font-semibold text-white/60">{data.total.toLocaleString()}</div>
      </div>
      <div className="h-6 w-px bg-white/[0.06]" />
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase text-white/25">Passed</div>
        <div className="font-mono text-sm font-semibold text-emerald-400">{data.passed.toLocaleString()}</div>
      </div>
      <div className="h-6 w-px bg-white/[0.06]" />
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase text-white/25">Failed</div>
        <div className="font-mono text-sm font-semibold text-red-400">{data.failed.toLocaleString()}</div>
      </div>
    </div>
  );
}

/* ── 3. Probability Breakdown ──────────────────────────────── */

function BreakdownSection({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Probability Breakdown">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.factor} className="rounded-xl bg-white/[0.02] px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-white/70">{item.factor}</span>
              <span className="font-mono text-sm font-bold" style={{ color: item.impact >= 0 ? '#34d399' : '#f87171' }}>
                {item.impact >= 0 ? '+' : ''}{item.impact}%
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-white/35">Current: <span className="text-white/55">{item.current}</span></span>
              <span className="text-white/15">|</span>
              <span className="text-white/35">Ideal: <span className="text-emerald-400/60">{item.ideal}</span></span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 4. Best Challenge + Suitability ───────────────────────── */

function BestChallenge({ best }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < best.rating ? '★' : '☆').join('');
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/30">Best Challenge For You</div>
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
          const diffStars = d.passRate >= 75 ? 5 : d.passRate >= 55 ? 4 : d.passRate >= 40 ? 3 : d.passRate >= 25 ? 2 : 1;
          return (
            <div key={d.profileId}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${isBest ? 'border border-white/15 bg-white/[0.05]' : 'bg-white/[0.02]'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">{d.profileName}</span>
                  {isBest && <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Best</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-[10px] text-white/25">{d.difficulty}</span>
                  <span className="text-[10px] text-amber-400/50">{'★'.repeat(diffStars)}{'☆'.repeat(5 - diffStars)}</span>
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

/* ── 5. Challenge Timeline ─────────────────────────────────── */

function TimelineSection({ days }) {
  if (!days?.length) return null;
  return (
    <Card title="Challenge Timeline">
      <div className="grid grid-cols-3 gap-3">
        {days.map((d) => (
          <div key={d.label} className="rounded-xl bg-white/[0.03] p-4 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/25">{d.label}</div>
            <div className="mt-1 text-2xl font-bold text-white">{d.days}</div>
            <div className="text-xs text-white/30">Trading Days</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 6. Ready Today? ───────────────────────────────────────── */

function ReadyToday({ ready, probability }) {
  return (
    <div className={`rounded-2xl border p-6 text-center ${ready ? 'border-emerald-400/20 bg-emerald-500/[0.04]' : 'border-red-400/15 bg-red-500/[0.03]'}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-2">Would you pass if you started today?</div>
      <div className={`text-4xl font-bold ${ready ? 'text-emerald-400' : 'text-red-400'}`}>
        {ready ? 'YES' : 'NO'}
      </div>
      <p className="mt-2 text-xs text-white/35">
        {ready
          ? `At ${probability}%, your historical performance suggests you would likely pass.`
          : `At ${probability}%, you need to improve before attempting a challenge.`}
      </p>
    </div>
  );
}

/* ── 7. Risk Meter ─────────────────────────────────────────── */

function RiskMeterCard({ data }) {
  if (!data) return null;
  const levelColors = { Low: '#34d399', Medium: '#fbbf24', High: '#f87171' };
  const color = levelColors[data.level];
  const fillPct = Math.min(100, (data.currentRisk / 3) * 100);

  return (
    <Card title="Your Current Risk">
      <div className="flex items-center gap-5">
        <div>
          <div className="text-2xl font-bold" style={{ color }}>{data.level.toUpperCase()}</div>
          <div className="mt-2 h-2.5 w-32 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full" style={{ width: `${fillPct}%`, background: color }} />
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/35">Current</span>
            <span className="font-mono text-white/60">{data.currentRisk}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/35">Ideal</span>
            <span className="font-mono text-emerald-400/60">{data.idealRisk}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ── 8. Biggest Probability Killer ─────────────────────────── */

function ProbabilityKiller({ killer, probability }) {
  if (!killer || killer.title === 'No Major Issues') return null;
  return (
    <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.03] p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-red-400/40 mb-3">Biggest Probability Killer</div>
      <div className="text-xl font-bold text-white mb-3">{killer.title}</div>
      <p className="text-sm text-white/45 leading-relaxed">{killer.description}</p>
      <div className="mt-4 rounded-xl bg-white/[0.03] border border-emerald-400/10 px-4 py-3">
        <div className="text-xs text-emerald-400/70">{killer.impact}</div>
      </div>
    </div>
  );
}

/* ── 9. Could Have Passed ──────────────────────────────────── */

function ImprovementsSection({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Could Have Passed">
      <div className="space-y-3">
        {items.map((imp, i) => (
          <div key={i} className="rounded-xl bg-white/[0.02] p-4">
            <div className="text-sm font-medium text-white">{imp.title}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 rounded-lg bg-white/[0.03] px-3 py-2 text-center">
                <div className="font-mono text-[10px] uppercase text-white/25">Current</div>
                <div className="mt-0.5 font-mono text-sm text-white/50">{imp.current}</div>
              </div>
              <span className="text-lg text-white/15">→</span>
              <div className="flex-1 rounded-lg bg-emerald-400/5 border border-emerald-400/10 px-3 py-2 text-center">
                <div className="font-mono text-[10px] uppercase text-emerald-400/40">Target</div>
                <div className="mt-0.5 font-mono text-sm text-emerald-400">{imp.recommended}</div>
              </div>
            </div>
            <div className="mt-2 text-right text-xs text-white/35">
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
          <li key={i} className="flex items-start gap-2 text-sm text-white/55">
            <span className="mt-0.5 shrink-0 text-xs font-bold" style={{ color }}>{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── 11. Trading Style ─────────────────────────────────────── */

function PersonalityCard({ personality }) {
  return (
    <Card title="Trading Style">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
          {personality.emoji}
        </div>
        <div>
          <div className="text-base font-bold text-white">{personality.title}</div>
          <p className="mt-0.5 text-sm text-white/40">{personality.description}</p>
        </div>
      </div>
    </Card>
  );
}

/* ── 12. Industry Comparison ───────────────────────────────── */

function IndustrySection({ stats }) {
  const benchmarks = [
    { metric: 'Win Rate', yours: `${stats.winRate.toFixed(1)}%`, average: '48%', verdict: stats.winRate > 50 ? 'above' : stats.winRate > 46 ? 'average' : 'below' },
    { metric: 'Risk Management', yours: `${stats.riskConsistency}/100`, average: '45/100', verdict: stats.riskConsistency > 60 ? 'above' : stats.riskConsistency > 40 ? 'average' : 'below' },
    { metric: 'Profit Factor', yours: stats.profitFactor >= 99 ? '99+' : stats.profitFactor.toFixed(2), average: '1.15', verdict: stats.profitFactor > 1.5 ? 'above' : stats.profitFactor > 1 ? 'average' : 'below' },
    { metric: 'Consistency', yours: `${stats.positionSizeConsistency}/100`, average: '42/100', verdict: stats.positionSizeConsistency > 60 ? 'above' : stats.positionSizeConsistency > 38 ? 'average' : 'below' },
  ];

  const verdictColors = { above: '#34d399', average: '#fbbf24', below: '#f87171' };
  const verdictLabels = { above: '↑ Above', average: '~ Average', below: '↓ Below' };

  return (
    <Card title="Compared with Industry Benchmarks">
      <div className="space-y-2">
        {benchmarks.map(b => (
          <div key={b.metric} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
            <div>
              <div className="text-sm text-white/60">{b.metric}</div>
              <div className="mt-0.5 flex items-center gap-2 text-xs">
                <span className="text-white/40">You: <span className="font-semibold text-white/70">{b.yours}</span></span>
                <span className="text-white/15">|</span>
                <span className="text-white/25">Avg: {b.average}</span>
              </div>
            </div>
            <span className="text-xs font-semibold" style={{ color: verdictColors[b.verdict] }}>{verdictLabels[b.verdict]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 13. Failure Reasons ───────────────────────────────────── */

function FailureReasons({ items }) {
  if (!items?.length) return null;
  return (
    <Card title="Why Simulations Failed">
      <div className="space-y-2">
        {items.map((f) => {
          const color = f.percentage >= 40 ? '#f87171' : f.percentage >= 20 ? '#fb923c' : '#fbbf24';
          return (
            <div key={f.reason} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-white/55">{f.reason}</span>
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

/* ── 14. What Happens Next ─────────────────────────────────── */

function WeekProjection({ weeks }) {
  if (!weeks?.length) return null;
  return (
    <Card title="What Happens Next">
      <p className="mb-3 text-xs text-white/30">If you start tomorrow...</p>
      <div className="space-y-2">
        {weeks.map((w) => (
          <div key={w.week} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-4 py-3">
            <span className="w-16 font-mono text-xs text-white/35">{w.label}</span>
            <div className="h-px flex-1 bg-white/[0.04]" />
            <span className="text-sm text-white/60">{w.outcome}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 15. Confidence ────────────────────────────────────────── */

function ConfidenceSection({ confidence, reasons }) {
  const confColors = { High: '#34d399', Medium: '#fbbf24', Low: '#f87171' };
  const color = confColors[confidence];

  return (
    <Card title="Confidence">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold" style={{ color }}>{confidence}</div>
        <div className="flex-1">
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-white/40">
                <span style={{ color }}>✓</span> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ── 16. Final Verdict ─────────────────────────────────────── */

function VerdictCard({ verdict, probability }) {
  const color = probability >= 65 ? '#34d399' : probability >= 40 ? '#fbbf24' : '#f87171';
  const label = probability >= 65 ? 'You are ready.' : probability >= 40 ? 'Almost there.' : 'Not yet ready.';

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.04] to-cyan-500/[0.03] p-6 md:p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-white/25 mb-4">Final Verdict</div>
      <div className="text-2xl font-bold mb-3" style={{ color }}>{label}</div>
      <p className="text-sm text-white/50 leading-relaxed">{verdict}</p>
    </div>
  );
}

/* ── 17. CTA ───────────────────────────────────────────────── */

function CTASection({ isLoggedIn }) {
  if (isLoggedIn) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-8 text-center">
        <p className="text-lg font-semibold text-white">Track your probability after every trade</p>
        <p className="mt-2 text-sm text-white/35">Log your next trade and run this analysis again to see how your probability changes.</p>
        <a href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
          ← Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-8 text-center">
      <p className="text-lg font-semibold text-white">Want this probability to update automatically after every trade?</p>
      <p className="mt-2 text-sm text-white/35">Track your pass readiness in real-time with PropLogAI.</p>
      <a href="/auth/signup" className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-105"
        style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>
        ⭐ Track My Probability Live
      </a>
    </div>
  );
}

/* ── Shared ────────────────────────────────────────────────── */

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-white/30">{title}</h3>
      {children}
    </div>
  );
}
