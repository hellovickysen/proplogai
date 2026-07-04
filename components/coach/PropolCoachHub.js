"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CoachTabs from './CoachTabs';
import OverviewTab from './OverviewTab';
import TradeAnalysisTab from './TradeAnalysisTab';
import MonthlyReviewTab from './MonthlyReviewTab';
import InsightsTab from './InsightsTab';
import { generateCoachReport } from '@/app/dashboard/coach/actions';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export default function PropolCoachHub({
  reports,
  tradeAnalyses,
  tradeCount,
  access,
  coachUsed,
  coachLimit,
  analysisUsed,
  analysisLimit,
  emailEnabled,
}) {
  const [tab, setTab] = useState('overview');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const hasEnough = (tradeCount || 0) >= 5;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await generateCoachReport();
    if (res && res.error) {
      setError(res.error);
      setGenerating(false);
    } else {
      router.refresh();
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold" style={gradientText}>Propol</h1>
            <span className="font-display text-2xl font-bold text-white">AI Coach</span>
          </div>
          <p className="mt-1 text-sm text-white/45">
            Your AI Trading Performance Coach — analyzing your journal, behavior, and discipline.
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-white/25">
            Propol does not provide financial, investment, or trading advice.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <CoachTabs active={tab} onChange={setTab} />

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/[0.05] px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab reports={reports} tradeAnalyses={tradeAnalyses} />
      )}

      {tab === 'analysis' && (
        <TradeAnalysisTab
          analyses={tradeAnalyses}
          usedThisMonth={analysisUsed}
          limit={analysisLimit}
        />
      )}

      {tab === 'review' && (
        <MonthlyReviewTab
          reports={reports}
          usedThisMonth={coachUsed}
          limit={coachLimit}
          onGenerate={handleGenerate}
          generating={generating}
          hasEnough={hasEnough}
          tradeCount={tradeCount}
          access={access}
        />
      )}

      {tab === 'insights' && (
        <InsightsTab reports={reports} analyses={tradeAnalyses} />
      )}
    </div>
  );
}
