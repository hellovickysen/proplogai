"use client";

import { useState } from 'react';
import CoachReport from './CoachReport';

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function ReviewCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const data = report.mistakes || {};
  const scores = data.scores || {};
  const scoreVals = Object.values(scores);
  const avgScore = scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between p-3.5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          {avgScore != null && (
            <div className={'flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-bold ' + scoreColor(avgScore)} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              {avgScore}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-white/80 line-clamp-1">{data.headline || 'Propol Review'}</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/25">
              <span>{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              <span>·</span>
              <span>{report.severity || '?'} trades</span>
            </div>
          </div>
        </div>
        <span className={'text-white/20 text-xs transition-transform ' + (expanded ? 'rotate-180' : '')}>▾</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-3.5">
          {/* Compact score row */}
          {scoreVals.length > 0 && (
            <div className="mb-3 flex gap-1.5">
              {Object.entries(scores).map(([key, val]) => (
                <div key={key} className="flex-1 rounded-lg border border-white/5 bg-black/20 py-1.5 text-center">
                  <div className={'font-display text-base font-bold ' + scoreColor(val)}>{val}</div>
                  <div className="font-mono text-[7px] uppercase tracking-wider text-white/25">{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          )}
          <CoachReport report={data} updatedAt={report.created_at} />
        </div>
      )}
    </div>
  );
}

export default function MonthlyReviewTab({ reports, usedThisMonth, limit, onGenerate, generating, hasEnough, tradeCount, access }) {
  const canGenerate = hasEnough && access?.canUse?.('coach_report') !== false;

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/25">{reports?.length || 0} review{(reports?.length || 0) !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-3">
          {limit > 0 && <span className="font-mono text-[10px] text-white/25">{usedThisMonth}/{limit}/mo</span>}
          {canGenerate && (
            <button onClick={onGenerate} disabled={generating} className="rounded-xl px-4 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              {generating ? 'Generating…' : '✦ New Review'}
            </button>
          )}
        </div>
      </div>

      {!hasEnough && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-xs text-white/35">Need {5 - (tradeCount || 0)} more trade{5 - (tradeCount || 0) !== 1 ? 's' : ''} for Propol to detect patterns</p>
        </div>
      )}

      {reports && reports.length > 0 ? (
        reports.map((r) => <ReviewCard key={r.id} report={r} />)
      ) : hasEnough ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-xs text-white/35">Click &quot;New Review&quot; to generate your first report</p>
        </div>
      ) : null}
    </div>
  );
}
