'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { runSimulation } from '@/lib/probability-analyzer/monteCarlo';
import { computeScore, GRADE_COLORS } from '@/lib/probability-analyzer/scoring';

export default function ImprovementSimulator({ baseParams, baseResult, metrics }) {
  const [sliders, setSliders] = useState({
    winRate: Math.round(baseParams.winRate * 100),
    avgRR: metrics.avgLoss > 0 ? +(metrics.avgProfit / metrics.avgLoss).toFixed(1) : 1.5,
    riskPercent: 1.0,
    tradesPerDay: Math.round(metrics.tradesPerDay * 10) / 10,
    maxDailyLoss: baseParams.dailyDrawdown,
  });

  const [newResult, setNewResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const debounceRef = useRef(null);

  const baseProb = baseResult.probability;

  const recompute = useCallback(
    (vals) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setComputing(true);
        // Run in a microtask to avoid blocking slider movement
        Promise.resolve().then(() => {
          const newParams = {
            ...baseParams,
            winRate: vals.winRate / 100,
            avgWin: metrics.avgProfit * (vals.avgRR / (metrics.avgLoss > 0 ? metrics.avgProfit / metrics.avgLoss : 1.5)),
            tradesPerDay: vals.tradesPerDay,
            dailyDrawdown: vals.maxDailyLoss,
            simulations: 5000, // fewer for snappiness
          };
          const result = runSimulation(newParams);
          const score = computeScore(result.probability, metrics, result);
          setNewResult({ ...result, score });
          setComputing(false);
        });
      }, 200);
    },
    [baseParams, metrics],
  );

  const updateSlider = (key, value) => {
    const next = { ...sliders, [key]: value };
    setSliders(next);
    recompute(next);
  };

  const newProb = newResult?.probability ?? baseProb;
  const diff = +(newProb - baseProb).toFixed(1);
  const newGrade = newResult?.score?.grade || '';
  const gradeColor = GRADE_COLORS[newGrade] || GRADE_COLORS.C;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-wider text-white/55">
          Improvement Simulator
        </h3>
        {newResult && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">
              {baseProb}%
            </span>
            <span className="text-white/30">→</span>
            <span
              className="text-sm font-bold"
              style={{ color: diff >= 0 ? '#34d399' : '#f87171' }}
            >
              {newProb}%
            </span>
            <span
              className="rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold"
              style={{ color: diff >= 0 ? '#34d399' : '#f87171', background: diff >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}
            >
              {diff >= 0 ? '+' : ''}{diff}%
            </span>
            {computing && (
              <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-cyan-400" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <Slider
          label="Win Rate"
          value={sliders.winRate}
          min={20} max={90} step={1}
          format={(v) => `${v}%`}
          onChange={(v) => updateSlider('winRate', v)}
        />
        <Slider
          label="Risk:Reward"
          value={sliders.avgRR}
          min={0.5} max={5} step={0.1}
          format={(v) => `${v}:1`}
          onChange={(v) => updateSlider('avgRR', v)}
        />
        <Slider
          label="Trades Per Day"
          value={sliders.tradesPerDay}
          min={1} max={20} step={0.5}
          format={(v) => v.toFixed(1)}
          onChange={(v) => updateSlider('tradesPerDay', v)}
        />
        <Slider
          label="Max Daily Loss %"
          value={sliders.maxDailyLoss}
          min={1} max={10} step={0.5}
          format={(v) => `${v}%`}
          onChange={(v) => updateSlider('maxDailyLoss', v)}
        />
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, format, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span className="font-mono text-sm font-medium text-white">{format(value)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sim-slider w-full"
        />
        {/* Track fill */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #a78bfa, #22d3ee)',
          }}
        />
      </div>
    </div>
  );
}
