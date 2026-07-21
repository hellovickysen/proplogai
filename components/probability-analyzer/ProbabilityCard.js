'use client';

import { useEffect, useState } from 'react';
import { GRADE_COLORS, RISK_COLORS, CONFIDENCE_COLORS } from '@/lib/probability-analyzer/scoring';

export default function ProbabilityCard({ score, simResult }) {
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    const target = score.probability;
    const duration = 1500;
    const start = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedProb(Math.round(eased * target * 10) / 10);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score.probability]);

  const gradeColor = GRADE_COLORS[score.grade] || GRADE_COLORS.C;
  const riskColor = RISK_COLORS[score.riskLevel] || RISK_COLORS.Medium;
  const confidenceColor = CONFIDENCE_COLORS[score.confidence] || CONFIDENCE_COLORS.Medium;

  // SVG circle progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProb / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      {/* Gradient glow behind */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-20 blur-3xl"
        style={{ background: gradeColor.text }}
      />

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Circular probability gauge */}
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width="170" height="170" className="-rotate-90">
            {/* Background circle */}
            <circle
              cx="85" cy="85" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="85" cy="85" r={radius}
              fill="none"
              stroke={gradeColor.text}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">{animatedProb}%</span>
            <span className="mt-0.5 font-mono text-xs uppercase tracking-wider text-white/45">
              Pass Rate
            </span>
          </div>
        </div>

        {/* Right side info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {/* Grade badge */}
            <span
              className="inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold"
              style={{ background: gradeColor.bg, color: gradeColor.text, border: `1px solid ${gradeColor.border}` }}
            >
              Grade: {score.grade}
            </span>
            {/* Risk badge */}
            <span
              className="inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium"
              style={{ color: riskColor, borderColor: riskColor + '33', background: riskColor + '10' }}
            >
              Risk: {score.riskLevel}
            </span>
            {/* Confidence badge */}
            <span
              className="inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium"
              style={{ color: confidenceColor, borderColor: confidenceColor + '33', background: confidenceColor + '10' }}
            >
              Confidence: {score.confidence}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-white/60">{score.summary}</p>

          {/* Sim stats */}
          <div className="mt-4 flex flex-wrap gap-4">
            <MiniStat label="Simulations" value={simResult.simulations.toLocaleString()} />
            <MiniStat label="Passes" value={simResult.passes.toLocaleString()} />
            {simResult.medianPassDay && (
              <MiniStat label="Median Pass Day" value={`Day ${simResult.medianPassDay}`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
