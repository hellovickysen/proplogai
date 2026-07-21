'use client';

import { useState } from 'react';
import ProbabilityCard from './ProbabilityCard';
import MetricsGrid from './MetricsGrid';
import BreakdownTable from './BreakdownTable';
import ImprovementSimulator from './ImprovementSimulator';
import {
  EquityChart, DrawdownChart, WinLossChart,
  SessionChart, MonthlyChart, CalendarHeatmap, FailReasonsChart,
} from './Charts';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'charts', label: 'Charts' },
  { id: 'improve', label: 'Simulator' },
];

export default function Dashboard({ result, onReset }) {
  const [tab, setTab] = useState('overview');
  const { score, metrics, simResult, breakdown, simParams, broker, tradeCount, firm } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Analysis Results</h2>
          <p className="mt-1 text-sm text-white/45">
            {broker} · {tradeCount} trades · {firm.name}
          </p>
        </div>
        <button
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          ← New Analysis
        </button>
      </div>

      {/* Probability Card — always visible */}
      <ProbabilityCard score={score} simResult={simResult} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <BreakdownTable breakdown={breakdown} />
          <MetricsGrid metrics={metrics} />
          <FailReasonsChart failReasons={simResult.failReasons} />
        </div>
      )}

      {tab === 'charts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <EquityChart data={metrics.equityCurve} />
            <DrawdownChart data={metrics.drawdownCurve} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WinLossChart data={metrics.winLossDistribution} />
            <SessionChart data={metrics.sessionBreakdown} />
          </div>
          <MonthlyChart data={metrics.monthlyPerformance} />
          <CalendarHeatmap data={metrics.calendarData} />
        </div>
      )}

      {tab === 'improve' && (
        <ImprovementSimulator
          baseParams={simParams}
          baseResult={simResult}
          metrics={metrics}
        />
      )}

      {/* Guest CTA */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-6 text-center">
        <p className="text-lg font-semibold text-white">Want to track your progress?</p>
        <p className="mt-1 text-sm text-white/50">
          Create a free account to save analyses, compare over time, and get AI coaching.
        </p>
        <a
          href="/auth/signup"
          className="mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f] transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
        >
          Create Free Account →
        </a>
      </div>
    </div>
  );
}
