"use client";

import { useState } from 'react';

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

const SEV = {
  critical: 'bg-red-500/15 text-red-300',
  high: 'bg-orange-500/15 text-orange-300',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-white/10 text-white/50',
};

/* ── Collapsible Section ──────────────────────────────────── */
function Section({ title, icon, score, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-t border-white/5">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-3 px-1 text-left hover:bg-white/[0.01]">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-sm font-medium text-white/70">{title}</span>
          {score != null && <span className={'font-mono text-xs font-bold ' + scoreColor(score)}>{score}</span>}
        </div>
        <span className={'text-white/35 text-xs transition-transform ' + (open ? 'rotate-180' : '')}>▾</span>
      </button>
      {open && <div className="pb-3 px-1">{children}</div>}
    </div>
  );
}

/* ── Review Card with Collapsible Sections ────────────────── */
function ReviewCard({ report }) {
  const [expanded, setExpanded] = useState(false);
  const data = report.mistakes || {};
  const scores = data.scores || {};
  const overallScore = data.overall_score ?? (Object.values(scores).length
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length) : null);

  const mistakes = data.recurring_mistakes || [];
  const psy = data.psychology || {};
  const disc = data.rulebook_discipline || {};
  const actionPlan = data.action_plan || [];
  const improvements = data.improvements || [];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between p-3.5 text-left hover:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {overallScore != null && (
            <div className={'flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-bold ' + scoreColor(overallScore)} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              {overallScore}
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-white/80 line-clamp-1">{data.headline || 'Propol Review'}</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
              <span>{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              <span>·</span>
              <span>{report.severity || '?'} trades</span>
            </div>
          </div>
        </div>
        <span className={'text-white/35 text-xs transition-transform ' + (expanded ? 'rotate-180' : '')}>▾</span>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5">
          {/* AI Coach Summary — warm conversational paragraph */}
          {data.coach_summary && (
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/[0.05] to-cyan-500/[0.03] p-4 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Propol&apos;s Summary</span>
              </div>
              <p className="text-sm leading-relaxed text-white/60">{data.coach_summary}</p>
            </div>
          )}

          {/* Details — collapsible sections */}
          <Section title="Summary" icon="📝" defaultOpen>
            <p className="text-sm text-white/60">{data.headline}</p>
            {data.key_insight && <p className="mt-1 text-xs text-white/40">{data.key_insight}</p>}
            {data.today_focus && (
              <div className="mt-2 flex items-start gap-2 text-xs text-amber-400/70">
                <span>→</span><span>{data.today_focus}</span>
              </div>
            )}
          </Section>

          {/* Discipline */}
          <Section title="Discipline" icon="🎯" score={scores.discipline}>
            {disc.summary && <p className="text-xs text-white/50 mb-2">{disc.summary}</p>}
            <div className="flex gap-3">
              {disc.setup_adherence_pct != null && (
                <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-1.5">
                  <div className={'font-display text-base font-bold ' + scoreColor(disc.setup_adherence_pct)}>{disc.setup_adherence_pct}%</div>
                  <div className="font-mono text-[11px] text-white/40">adherence</div>
                </div>
              )}
              {disc.no_setup_count != null && (
                <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-1.5">
                  <div className="font-display text-base font-bold text-white/50">{disc.no_setup_count}</div>
                  <div className="font-mono text-[11px] text-white/40">no setup</div>
                </div>
              )}
            </div>
            {disc.worst_pattern && <p className="mt-2 text-xs text-red-300/60">{disc.worst_pattern}</p>}
          </Section>

          {/* Psychology */}
          <Section title="Psychology" icon="🧠" score={scores.psychology}>
            {psy.summary && <p className="text-xs text-white/50 mb-2">{psy.summary}</p>}
            {psy.insights && psy.insights.length > 0 && (
              <div className="space-y-1.5">
                {psy.insights.map((ins, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-white/55">{ins.emotion}</span>
                    <span className="font-mono text-white/30">{ins.win_rate != null ? `${ins.win_rate}% WR` : ins.stat || `${ins.trade_count} trades`}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Execution + Risk + Consistency */}
          <Section title="Execution" icon="⚡" score={scores.execution}>
            {mistakes.length > 0 && (
              <div className="space-y-1.5">
                {mistakes.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={'rounded px-1.5 py-0.5 font-mono text-[11px] ' + (SEV[m.severity] || SEV.medium)}>{m.severity}</span>
                    <span className="text-white/55">{m.pattern}</span>
                    <span className="ml-auto font-mono text-white/40">{m.frequency}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Action Plan */}
          <Section title="Action Plan" icon="🎯">
            {actionPlan.length > 0 ? (
              <div className="space-y-1.5">
                {actionPlan.map((item, i) => {
                  const action = typeof item === 'string' ? item : item.action;
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/55">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-mono text-[11px] text-white/35">{i + 1}</span>
                      <span>{action}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/30">No action plan generated</p>
            )}
          </Section>

          {/* Improvements */}
          {improvements.length > 0 && (
            <Section title="Progress" icon="📈">
              <div className="space-y-1">
                {improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-emerald-300/60">
                    <span className="text-emerald-400">✔</span><span>{imp}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

export default function MonthlyReviewTab({ reports, usedThisMonth, limit, onGenerate, generating, hasEnough, tradeCount, access }) {
  const canGenerate = hasEnough && access?.canUse?.('coach_report') !== false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/40">{reports?.length || 0} review{(reports?.length || 0) !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-3">
          {limit > 0 && <span className="font-mono text-[10px] text-white/40">{usedThisMonth}/{limit}/mo</span>}
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
          <p className="text-xs text-white/35">Need {5 - (tradeCount || 0)} more trade{5 - (tradeCount || 0) !== 1 ? 's' : ''} for Propol</p>
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
