"use client";

import { useState } from 'react';
import CoachReport from './CoachReport';

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function ReviewCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const data = report.mistakes || {};
  const scores = data.scores || {};
  const avgScore = Object.values(scores).length
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length)
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {avgScore != null && (
            <div className={'flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold ' + scoreColor(avgScore)}
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              {avgScore}
            </div>
          )}
          <div>
            <div className="font-display text-sm font-semibold">{data.headline || 'Propol Review'}</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[10px] text-white/30">
                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <span className="font-mono text-[10px] text-white/20">·</span>
              <span className="font-mono text-[10px] text-white/30">{report.severity || '?'} trades analyzed</span>
            </div>
          </div>
        </div>
        <span className={'text-white/30 transition-transform ' + (expanded ? 'rotate-180' : '')}>▾</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4">
          {/* Scores overview */}
          {Object.keys(scores).length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {Object.entries(scores).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-white/5 bg-black/20 p-2 text-center">
                  <div className={'font-display text-lg font-bold ' + scoreColor(val)}>{val}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                    {key.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full report using existing CoachReport component */}
          <CoachReport report={data} updatedAt={report.created_at} />
        </div>
      )}
    </div>
  );
}

export default function MonthlyReviewTab({ reports, usedThisMonth, limit, onGenerate, generating, hasEnough, tradeCount, access }) {
  const canGenerate = hasEnough && access?.canUse?.('coach_report') !== false;

  return (
    <div className="space-y-4">
      {/* Generate button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {reports?.length || 0} review{(reports?.length || 0) !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-3">
          {limit > 0 && (
            <span className="font-mono text-[10px] text-white/30">{usedThisMonth}/{limit} this month</span>
          )}
          {canGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f] disabled:opacity-60"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {generating ? 'Generating…' : reports?.length ? '↻ New Review' : '✦ Generate Review'}
            </button>
          )}
        </div>
      </div>

      {!hasEnough && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-white/45">
            Log at least 5 trades so Propol has enough data to detect patterns. You have {tradeCount || 0} trade{tradeCount !== 1 ? 's' : ''} so far.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reports && reports.length > 0 ? (
        reports.map((r) => <ReviewCard key={r.id} report={r} />)
      ) : hasEnough ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}>
            📊
          </div>
          <h3 className="font-display text-lg font-bold">No reviews yet</h3>
          <p className="mt-2 text-sm text-white/45">Generate your first Propol review to see your performance scores, patterns, and action plan.</p>
        </div>
      ) : null}
    </div>
  );
}
