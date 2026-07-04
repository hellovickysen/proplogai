"use client";

import { useState } from 'react';

const SEV = {
  critical: 'bg-red-500/15 text-red-300',
  high: 'bg-orange-500/15 text-orange-300',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-white/10 text-white/50',
};

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function TradeAnalysisCard({ analysis }) {
  const [expanded, setExpanded] = useState(false);
  const data = analysis.mistakes || {};
  const score = data.trade_score ?? data.execution_score ?? null;
  const grade = data.grade || '?';
  const good = Array.isArray(data.good) ? data.good : Array.isArray(data.went_well) ? data.went_well : [];
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];
  const mistakes = Array.isArray(data.mistakes) ? data.mistakes : [];
  const coaching = data.coaching || {};

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {score != null && (
            <div className={'flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold ' + scoreColor(score)}
              style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              {score}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold">{analysis.summary || 'Trade Analysis'}</span>
              <span className={'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ' + scoreColor(score || 0)}>{grade}</span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-white/30">
              {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
        <span className={'text-white/30 transition-transform ' + (expanded ? 'rotate-180' : '')}>▾</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Good items */}
          {good.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">What went well</div>
              {good.map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white/70 mb-1">
                  <span className="text-emerald-400 mt-0.5">✔</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">Needs attention</div>
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-white/70 mb-1">
                  <span className="text-amber-400 mt-0.5">⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mistakes */}
          {mistakes.length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">Mistakes</div>
              {mistakes.map((m, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-black/20 p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold">{m.title || m.pattern}</span>
                    {m.severity && <span className={'rounded px-1.5 py-0.5 font-mono text-[10px] ' + (SEV[m.severity] || SEV.low)}>{m.severity}</span>}
                  </div>
                  {m.detail && <p className="mt-1 text-xs text-white/50">{m.detail}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Coaching insights */}
          {Object.keys(coaching).length > 0 && (
            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">Propol coaching</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {coaching.discipline && (
                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="mb-1 font-mono text-[10px] text-violet-300">🎯 Discipline</div>
                    <p className="text-xs text-white/60">{coaching.discipline}</p>
                  </div>
                )}
                {coaching.psychology && (
                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="mb-1 font-mono text-[10px] text-cyan-300">🧠 Psychology</div>
                    <p className="text-xs text-white/60">{coaching.psychology}</p>
                  </div>
                )}
                {coaching.performance && (
                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="mb-1 font-mono text-[10px] text-emerald-300">⚡ Performance</div>
                    <p className="text-xs text-white/60">{coaching.performance}</p>
                  </div>
                )}
                {coaching.reflection && (
                  <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="mb-1 font-mono text-[10px] text-amber-300">💭 Reflection</div>
                    <p className="text-xs text-white/60">{coaching.reflection}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lesson */}
          {(data.lesson || data.fix) && (
            <div className="rounded-lg border border-white/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-white/40">Key lesson</div>
              <p className="text-sm text-white/80">{data.lesson || data.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TradeAnalysisTab({ analyses, usedThisMonth, limit, onAnalyze, analyzing }) {
  if (!analyses || analyses.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
          style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}>
          ✦
        </div>
        <h3 className="font-display text-lg font-bold">No trade analyses yet</h3>
        <p className="mt-2 text-sm text-white/45">Open any trade and click "Analyze Trade" to get Propol&apos;s coaching feedback.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {analyses.length} analyses
        </div>
        {limit > 0 && (
          <div className="font-mono text-[10px] text-white/30">
            {usedThisMonth}/{limit} this month
          </div>
        )}
      </div>
      {analyses.map((a) => (
        <TradeAnalysisCard key={a.id} analysis={a} />
      ))}
    </div>
  );
}
