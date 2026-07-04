"use client";

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtPnl(val) {
  if (val == null) return null;
  const n = Number(val);
  return (n >= 0 ? '+$' : '-$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function HeroCard({ report, persona, userName }) {
  const data = report?.mistakes || {};
  const oneHabit = data.one_habit || null;
  const keyInsight = data.key_insight || data.headline || null;
  const todayFocus = data.today_focus || null;
  const name = userName || 'Trader';
  const firstName = name.split(' ')[0];

  // Fallback: if no report yet, show a welcome
  if (!report) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04] p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
          <span className="text-xs text-white/40">Propol</span>
        </div>
        <p className="text-lg text-white/80">{getGreeting()}, {firstName} 👋</p>
        <p className="mt-2 text-sm text-white/45">Generate your first review to get personalized coaching insights.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.08] to-cyan-500/[0.04] p-5 sm:p-6">
      {/* Propol identity */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Propol says</span>
      </div>

      {/* Greeting + key insight */}
      <p className="text-lg font-medium text-white/90">{getGreeting()}, {firstName} 👋</p>
      {keyInsight && (
        <p className="mt-2 text-sm text-white/60">{keyInsight}</p>
      )}

      {/* One Habit — the killer feature */}
      {oneHabit && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400/70 mb-2">If you fix one thing</div>
          <div className="text-base font-semibold text-white/90">{oneHabit.habit}</div>
          {oneHabit.reason && <p className="mt-1 text-sm text-white/50">{oneHabit.reason}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4">
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
      )}

      {/* Today's focus */}
      {todayFocus && (
        <div className="mt-3 flex items-start gap-2">
          <span className="text-amber-400 mt-0.5">→</span>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Focus next session: </span>
            <span className="text-sm text-white/70">{todayFocus}</span>
          </div>
        </div>
      )}
    </div>
  );
}
