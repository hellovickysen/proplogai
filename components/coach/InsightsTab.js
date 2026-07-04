"use client";

/* ── Playbook Tab (formerly Insights) ─────────────────────── */

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function impactStars(n) {
  const count = Math.min(5, Math.max(1, n || 3));
  return '★'.repeat(count) + '☆'.repeat(5 - count);
}

/* ── One Habit card (killer feature) ──────────────────────── */
function OneHabitCard({ report }) {
  const oneHabit = report?.mistakes?.one_habit;
  if (!oneHabit) return null;

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.06] to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg text-xs" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400/60">If you fix one thing</span>
      </div>
      <div className="text-base font-semibold text-white/90 mb-3">{oneHabit.habit}</div>
      <div className="flex flex-wrap gap-4">
        {oneHabit.estimated_pnl_impact != null && (
          <div>
            <div className="font-display text-lg font-bold text-emerald-400">
              {oneHabit.estimated_pnl_impact >= 0 ? '+' : ''}${Math.abs(oneHabit.estimated_pnl_impact).toLocaleString()}
            </div>
            <div className="font-mono text-[9px] text-white/25">estimated impact</div>
          </div>
        )}
        {oneHabit.confidence_pct != null && (
          <div>
            <div className="font-display text-lg font-bold text-cyan-400">{oneHabit.confidence_pct}%</div>
            <div className="font-mono text-[9px] text-white/25">confidence</div>
          </div>
        )}
        {oneHabit.trade_count != null && (
          <div>
            <div className="font-display text-lg font-bold text-white/50">{oneHabit.trade_count}</div>
            <div className="font-mono text-[9px] text-white/25">trades analyzed</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── AI Insight card with confidence ──────────────────────── */
function InsightCard({ icon, title, value, detail, confidence, tradeCount }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">{title}</span>
        </div>
        {confidence != null && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-cyan-400">{confidence}% conf</span>
        )}
      </div>
      {value && <div className="text-sm font-medium text-white/80 mb-1">{value}</div>}
      {detail && <div className="text-xs text-white/45">{detail}</div>}
      {tradeCount != null && <div className="mt-1 font-mono text-[9px] text-white/20">Based on {tradeCount} trades</div>}
    </div>
  );
}

/* ── Action Plan with priority + impact ───────────────────── */
function ActionPlanCard({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Action Plan</div>
      <div className="space-y-2.5">
        {items.map((item, i) => {
          const action = typeof item === 'string' ? item : item.action || item;
          const impact = typeof item === 'object' ? item.impact : null;
          const priority = typeof item === 'object' ? item.priority : i + 1;
          return (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-mono text-xs text-white/40">{priority || i + 1}</span>
              <div className="flex-1">
                <div className="text-sm text-white/70">{action}</div>
                {impact != null && (
                  <div className="mt-0.5 text-xs tracking-wider" style={{ color: 'rgba(251,191,36,0.6)' }}>
                    Impact {impactStars(impact)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Mistakes with PnL impact ─────────────────────────────── */
function MistakesCard({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Recurring Mistakes</div>
      <div className="space-y-2">
        {items.map((m, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border-l-[3px] bg-white/[0.02] px-3 py-2" style={{ borderColor: m.severity === 'critical' ? '#f87171' : m.severity === 'high' ? '#fb923c' : '#fbbf24' }}>
            <div className="flex-1">
              <span className="text-sm font-medium text-white/70">{m.pattern}</span>
              {m.frequency && <span className="ml-2 font-mono text-[10px] text-white/30">{m.frequency}</span>}
            </div>
            {m.impact_pnl != null && (
              <span className="shrink-0 font-mono text-xs text-red-400">-${Math.abs(m.impact_pnl)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Emotion heatmap ──────────────────────────────────────── */
function EmotionHeatmap({ items }) {
  if (!items || items.length === 0) return null;
  const maxCount = Math.max(...items.map((e) => e.count || e.trade_count || 1), 1);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Emotion Heatmap</div>
      <div className="space-y-2">
        {items.map((e, i) => {
          const count = e.count || e.trade_count || 1;
          const pct = (count / maxCount) * 100;
          const colors = ['bg-violet-400', 'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400', 'bg-red-400'];
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-white/55">{e.emotion || e.label}</span>
              <div className="h-3 flex-1 rounded-full bg-white/[0.06]">
                <div className={'h-full rounded-full ' + colors[i % colors.length]} style={{ width: Math.max(8, pct) + '%' }} />
              </div>
              {e.win_rate != null && <span className="w-12 shrink-0 text-right font-mono text-[10px] text-white/40">{e.win_rate}% WR</span>}
              {e.win_rate == null && <span className="w-12 shrink-0 text-right font-mono text-[10px] text-white/30">{count} trades</span>}
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
        <p className="text-xs text-white/35">Your Playbook appears after the first review</p>
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
      {/* One Habit — killer feature */}
      <OneHabitCard report={latestReport} />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* AI Insights with confidence */}
        {emotions.slice(0, 3).map((e, i) => (
          <InsightCard key={i} icon="💡" title="Insight"
            value={e.observation || `${e.emotion}: ${e.stat || ''}`}
            detail={e.observation ? `Emotion: ${e.emotion}` : null}
            confidence={e.confidence_pct || null}
            tradeCount={e.trade_count || null} />
        ))}

        {/* Your Rules with Propol prefix */}
        {guardrails.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Propol&apos;s Rules for You</div>
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

      {/* Mistakes with PnL */}
      <MistakesCard items={mistakes} />

      {/* Emotion Heatmap */}
      <EmotionHeatmap items={emotions} />

      {/* Action Plan with impact stars */}
      <ActionPlanCard items={actionPlan} />

      {/* Improvements */}
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
