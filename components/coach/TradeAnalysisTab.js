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
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between p-3.5 text-left hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-3">
          {score != null && (
            <div className={'flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-bold ' + scoreColor(score)} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              {score}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/80 line-clamp-1">{analysis.summary || 'Trade Analysis'}</span>
              <span className={'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ' + scoreColor(score || 0)}>{grade}</span>
            </div>
            <div className="font-mono text-[10px] text-white/40">
              {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
        <span className={'text-white/35 text-xs transition-transform ' + (expanded ? 'rotate-180' : '')}>▾</span>
      </button>

      {expanded && (
        <div className="border-t border-white/5 p-3.5 space-y-3">
          {/* Good + Warnings in compact grid */}
          <div className="grid gap-2 sm:grid-cols-2">
            {good.length > 0 && (
              <div className="space-y-1">
                {good.map((g, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                    <span className="text-emerald-400">✔</span><span>{g}</span>
                  </div>
                ))}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                    <span className="text-amber-400">⚠</span><span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4-module coaching — compact pills */}
          {Object.keys(coaching).length > 0 && (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {[
                { k: 'discipline', icon: '🎯', color: 'text-violet-300' },
                { k: 'psychology', icon: '🧠', color: 'text-cyan-300' },
                { k: 'performance', icon: '⚡', color: 'text-emerald-300' },
                { k: 'reflection', icon: '💭', color: 'text-amber-300' },
              ].filter(({ k }) => coaching[k]).map(({ k, icon, color }) => (
                <div key={k} className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                  <span className={`font-mono text-xs uppercase ${color}`}>{icon} {k}</span>
                  <p className="mt-0.5 text-xs text-white/50 line-clamp-2">{coaching[k]}</p>
                </div>
              ))}
            </div>
          )}

          {/* Lesson — single line */}
          {(data.lesson || data.fix) && (
            <div className="rounded-lg bg-gradient-to-r from-violet-500/5 to-cyan-500/5 px-3 py-2">
              <p className="text-xs text-white/70">{data.lesson || data.fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LimitUpgrade({ feature }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)} className="text-[10px] text-violet-400 hover:text-violet-300 font-medium">
        Upgrade for more
      </button>
      {show && <UpgradeModal onClose={() => setShow(false)} feature={feature} />}
    </>
  );
}

export default function TradeAnalysisTab({ analyses, usedThisMonth, limit, planAccess }) {
  if (!analyses || analyses.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="text-3xl mb-2">✦</div>
        <p className="text-xs text-white/35">Open any trade and click &quot;Analyze&quot; to get Propol&apos;s feedback</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="font-mono text-[10px] text-white/40">{analyses.length} analyses</span>
        {limit > 0 && (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-white/40">{usedThisMonth}/{limit} this month</span>
            {usedThisMonth >= limit && planAccess && !planAccess.isAdmin && !planAccess.isBeta && planAccess.effectivePlan !== 'elite' && (
              <LimitUpgrade feature="ai_analysis" />
            )}
          </span>
        )}
      </div>
      {analyses.map((a) => <TradeAnalysisCard key={a.id} analysis={a} />)}
    </div>
  );
}
