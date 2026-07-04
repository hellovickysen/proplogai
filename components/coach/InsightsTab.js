"use client";

/* ── Growth Plan Tab (formerly Playbook/Insights) ─────────── */

function impactStars(n) { const c = Math.min(5, Math.max(1, n || 3)); return '★'.repeat(c) + '☆'.repeat(5 - c); }

const FREQ_BADGE = {
  high: 'bg-red-500/15 text-red-300',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-white/10 text-white/50',
};

/* ── One Habit card ───────────────────────────────────────── */
function OneHabitCard({ report }) {
  const oneHabit = report?.mistakes?.one_habit;
  if (!oneHabit) return null;
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400/60">If you fix one thing</span>
      </div>
      <div className="text-base font-semibold text-white/90">{oneHabit.habit}</div>
      {oneHabit.reason && <p className="mt-1 mb-3 text-sm text-white/50">{oneHabit.reason}</p>}
      {!oneHabit.reason && <div className="mb-3" />}
      <div className="flex flex-wrap gap-4">
        {oneHabit.improvement && (
          <div>
            <div className="text-sm font-semibold text-emerald-400">{oneHabit.improvement}</div>
            <div className="font-mono text-[11px] text-white/40">historical opportunity</div>
          </div>
        )}
        {(oneHabit.evidence_strength ?? oneHabit.confidence_pct) != null && (
          <div>
            <div className="font-display text-lg font-bold text-cyan-400">{oneHabit.evidence_strength ?? oneHabit.confidence_pct}%</div>
            <div className="font-mono text-[11px] text-white/40">evidence strength</div>
          </div>
        )}
        {oneHabit.trade_count != null && (
          <div>
            <div className="font-display text-lg font-bold text-white/50">{oneHabit.trade_count}</div>
            <div className="font-mono text-[11px] text-white/40">similar trades</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Best Habit card (positive reinforcement) ─────────────── */
function BestHabitCard({ report }) {
  const bestHabit = report?.mistakes?.best_habit;
  if (!bestHabit) return null;
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⭐</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/60">Your best habit</span>
      </div>
      <div className="text-base font-semibold text-white/90">{bestHabit.habit}</div>
      {bestHabit.message && <p className="mt-1 text-sm text-emerald-300/60">{bestHabit.message}</p>}
      <div className="mt-3 flex flex-wrap gap-4">
        {bestHabit.win_rate != null && (
          <div>
            <div className="font-display text-lg font-bold text-emerald-400">{bestHabit.win_rate}%</div>
            <div className="font-mono text-[11px] text-white/40">win rate</div>
          </div>
        )}
        {bestHabit.trade_count != null && (
          <div>
            <div className="font-display text-lg font-bold text-white/50">{bestHabit.trade_count}</div>
            <div className="font-mono text-[11px] text-white/40">trades</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Mistakes with frequency badges ───────────────────────── */
function MistakesCard({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Recurring Mistakes</div>
      <div className="space-y-2">
        {items.map((m, i) => {
          const freq = (m.frequency || 'medium').toLowerCase();
          return (
            <div key={i} className="flex items-center gap-2.5 rounded-lg border-l-[3px] bg-white/[0.02] px-3 py-2" style={{ borderColor: freq === 'high' ? '#f87171' : freq === 'medium' ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>
              <span className="flex-1 text-sm font-medium text-white/70 line-clamp-1">{m.pattern}</span>
              <span className={'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ' + (FREQ_BADGE[freq] || FREQ_BADGE.medium)}>{freq}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Emotion Heatmap with win rates ───────────────────────── */
function EmotionHeatmap({ items }) {
  if (!items || items.length === 0) return null;
  const maxCount = Math.max(...items.map((e) => e.count || e.trade_count || 1), 1);
  const colors = ['bg-violet-400', 'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400', 'bg-red-400'];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Emotion Heatmap</div>
      <div className="space-y-3">
        {items.map((e, i) => {
          const count = e.count || e.trade_count || 1;
          const pct = (count / maxCount) * 100;
          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-white/55">{e.emotion || e.label}</span>
                <div className="flex items-center gap-3">
                  {e.win_rate != null && <span className="font-mono text-[10px] text-white/40">{e.win_rate}% WR</span>}
                  <span className="font-mono text-[10px] text-white/40">{count} trades</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.06]">
                <div className={'h-full rounded-full ' + colors[i % colors.length]} style={{ width: Math.max(8, pct) + '%' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Action Plan with impact + difficulty ─────────────────── */
function ActionPlanCard({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Action Plan</div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const action = typeof item === 'string' ? item : item.action || item;
          const impact = typeof item === 'object' ? item.impact : null;
          const difficulty = typeof item === 'object' ? item.difficulty : null;
          const priority = typeof item === 'object' ? item.priority : i + 1;
          return (
            <div key={i} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-mono text-xs text-white/40">{priority || i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm text-white/70">{action}</div>
                  <div className="mt-1 flex items-center gap-3">
                    {impact != null && <span className="text-[10px] text-white/30">Impact <span style={{ color: 'rgba(251,191,36,0.6)' }}>{impactStars(impact)}</span></span>}
                    {difficulty != null && <span className="text-[10px] text-white/30">Difficulty <span className="text-white/40">{impactStars(difficulty)}</span></span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InsightsTab({ reports, analyses }) {
  const latestReport = reports?.[0];
  const data = latestReport?.mistakes || {};

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-xs text-white/35">Your Growth Plan appears after the first review</p>
      </div>
    );
  }

  const mistakes = data.recurring_mistakes || [];
  const emotions = data.psychology?.insights || [];
  const guardrails = (data.psychology?.guardrails || []).slice(0, 4);
  const actionPlan = data.action_plan || [];
  const improvements = (data.improvements || []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* One Habit + Best Habit side by side */}
      <div className="grid gap-3 sm:grid-cols-2">
        <OneHabitCard report={latestReport} />
        <BestHabitCard report={latestReport} />
      </div>

      {/* 2x2 Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <MistakesCard items={mistakes} />
        <EmotionHeatmap items={emotions} />
        <ActionPlanCard items={actionPlan} />

        {guardrails.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Propol&apos;s Notes</div>
            <div className="space-y-2">
              {guardrails.map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-white/55">
                  <span className="text-cyan-400 mt-0.5">→</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {improvements.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-emerald-400/50">Progress</div>
          <div className="space-y-1.5">
            {improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-emerald-300/60">
                <span className="text-emerald-400">✔</span><span className="line-clamp-1">{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
