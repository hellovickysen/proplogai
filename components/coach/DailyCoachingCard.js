import Link from 'next/link';

/**
 * DailyCoachingCard — shows a single personalized Propol insight.
 * Computed server-side from persona data, no AI call needed.
 * Rotates daily using day-of-year as seed.
 *
 * Props:
 *   persona: { mainEmotion, bestSession, worstSession, commonMistake, adherencePct, revengeDays, tradeCount }
 *   report: latest coach report (for one_habit / today_focus)
 */
export default function DailyCoachingCard({ persona, report }) {
  const data = report?.mistakes || {};
  const todayFocus = data.today_focus || null;

  // Compute a daily insight from persona data
  const dailyInsight = (() => {
    if (!persona || !persona.tradeCount) return null;
    const day = new Date().getDate();
    const insights = [];
    if (persona.mainEmotion) insights.push(`Trades tagged "${persona.mainEmotion}" appear most frequently in your journal. Review how this emotion affects your outcomes.`);
    if (persona.bestSession) insights.push(`Your ${persona.bestSession.name} session has a ${persona.bestSession.winRate}% win rate — your strongest session.`);
    if (persona.worstSession && persona.worstSession.name !== persona.bestSession?.name) insights.push(`Your ${persona.worstSession.name} session has been your most challenging. Consider reviewing those journal entries.`);
    if (persona.commonMistake) insights.push(`"${persona.commonMistake}" is your most recurring pattern. Focusing here could have the biggest impact.`);
    if (persona.adherencePct != null) insights.push(`Your setup adherence is at ${persona.adherencePct}%. Trades where you fully followed your plan historically performed better.`);
    if (persona.revengeDays > 0) insights.push(`Your records show ${persona.revengeDays} trading days with potential revenge patterns. A short break after losses has historically helped.`);
    if (insights.length === 0) return null;
    return insights[day % insights.length];
  })();

  // Use today_focus from latest report if available, otherwise daily insight
  const message = todayFocus || dailyInsight;
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/[0.06] to-cyan-500/[0.03] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">Today&apos;s Coaching</span>
        </div>
        <Link href="/dashboard/coach" className="font-mono text-[10px] text-cyan-400/60 hover:text-cyan-400">
          Open Coach →
        </Link>
      </div>
      <p className="text-sm text-white/60 leading-relaxed">{message}</p>
    </div>
  );
}
