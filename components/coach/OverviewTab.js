"use client";

import HeroCard from './HeroCard';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function trendLabel(current, previous) {
  if (previous == null || current == null) return null;
  const diff = current - previous;
  if (diff === 0) return { text: 'Stable', color: 'text-white/30', arrow: '' };
  if (diff > 0) return { text: `↑${diff} this month`, color: 'text-emerald-400', arrow: '↑' };
  return { text: `↓${Math.abs(diff)} this month`, color: 'text-red-400', arrow: '↓' };
}

function stars(score) {
  const s = Math.round(score / 20);
  return '★'.repeat(s) + '☆'.repeat(5 - s);
}

/* ── Trader Score ──────────────────────────────────────────── */
function TraderScore({ reports }) {
  const latest = reports?.[0]?.mistakes;
  const previous = reports?.[1]?.mistakes;
  const overallScore = latest?.overall_score ?? (latest?.scores
    ? Math.round(Object.values(latest.scores).reduce((a, b) => a + b, 0) / Object.values(latest.scores).length)
    : null);
  const prevScore = previous?.overall_score ?? (previous?.scores
    ? Math.round(Object.values(previous.scores).reduce((a, b) => a + b, 0) / Object.values(previous.scores).length)
    : null);

  if (overallScore == null) return null;

  const trend = trendLabel(overallScore, prevScore);
  const trendWord = overallScore > (prevScore || 0) ? 'Improving' : overallScore === prevScore ? 'Stable' : 'Needs work';

  // Progress timeline from reports
  const timeline = [...(reports || [])].reverse()
    .map((r) => r?.mistakes?.overall_score ?? (r?.mistakes?.scores ? Math.round(Object.values(r.mistakes.scores).reduce((a, b) => a + b, 0) / Object.values(r.mistakes.scores).length) : null))
    .filter((v) => v != null);

  return (
    <div className="flex flex-col items-center text-center py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/30 mb-1">Trader Score</div>
      <div className={'font-display text-5xl font-bold ' + scoreColor(overallScore)}>{overallScore}</div>
      <div className="mt-1 text-lg tracking-wider" style={{ color: 'rgba(251,191,36,0.7)' }}>{stars(overallScore)}</div>
      <div className={'mt-1 text-xs font-medium ' + (trend ? trend.color : 'text-white/30')}>
        {trendWord} {trend && trend.text !== 'Stable' ? `· ${trend.text}` : ''}
      </div>
      <div className="mt-1 font-mono text-[11px] text-white/35">Based on Discipline · Execution · Psychology · Risk · Consistency</div>
      {/* Mini timeline */}
      {timeline.length > 1 && (
        <div className="mt-3 flex items-end gap-1">
          {timeline.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={'rounded-sm transition-all ' + scoreColor(v)} style={{ width: 12, height: Math.max(4, (v / 100) * 32), background: i === timeline.length - 1 ? 'linear-gradient(120deg,#a78bfa,#22d3ee)' : 'rgba(255,255,255,0.15)' }} />
              <span className="font-mono text-[7px] text-white/35">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Trader DNA ───────────────────────────────────────────── */
function TraderDNA({ persona, scores }) {
  const traits = [
    { label: 'Execution', value: scores?.execution || 0 },
    { label: 'Discipline', value: scores?.discipline || 0 },
    { label: 'Psychology', value: scores?.psychology || 0 },
    { label: 'Consistency', value: scores?.consistency || 0 },
    { label: 'Risk Mgmt', value: scores?.risk_management || 0 },
    { label: 'Patience', value: scores?.consistency ? Math.round((scores.consistency + (scores?.execution || 0)) / 2) : 0 },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/30">Trader DNA</div>
      <div className="space-y-2.5">
        {traits.map((t, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-white/50">{t.label}</span>
            <div className="h-2.5 flex-1 rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full transition-all" style={{ width: t.value + '%', background: t.value >= 70 ? 'rgba(52,211,153,0.45)' : t.value >= 40 ? 'rgba(251,191,36,0.35)' : 'rgba(248,113,113,0.4)' }} />
            </div>
            <span className={'w-8 text-right font-mono text-xs text-white/40'}>{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Score Detail Cards (collapsible) ─────────────────────── */
function ScoreDetails({ scores, previousScores }) {
  const [open, setOpen] = useState(false);
  if (!scores || Object.keys(scores).length === 0) return null;

  const KEYS = [
    { key: 'discipline', icon: '🎯' },
    { key: 'psychology', icon: '🧠' },
    { key: 'consistency', icon: '📈' },
    { key: 'risk_management', icon: '🛡️' },
    { key: 'execution', icon: '⚡' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-3.5 text-left hover:bg-white/[0.02]">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Detailed Scores</span>
        <span className={'text-white/35 text-xs transition-transform ' + (open ? 'rotate-180' : '')}>▾</span>
      </button>
      {open && (
        <div className="border-t border-white/5 p-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {KEYS.map(({ key, icon }) => {
            const val = scores[key] || 0;
            const prev = previousScores?.[key];
            const trend = trendLabel(val, prev);
            const needsAttention = val < 60;
            return (
              <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">{icon}</span>
                  <span className="font-mono text-[10px] uppercase text-white/35">{key.replace(/_/g, ' ')}</span>
                </div>
                <div className={'font-display text-xl font-bold ' + scoreColor(val)}>{val}</div>
                {trend && <div className={'font-mono text-[10px] ' + trend.color}>{trend.text}</div>}
                {needsAttention && <div className="mt-1 font-mono text-[11px] text-red-400/60">Needs attention</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Streak badge ─────────────────────────────────────────── */
function StreakBadge({ icon, label, current, best }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <div className="text-[10px] text-white/35">{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className={'font-display text-base font-bold ' + (current > 0 ? 'text-amber-400' : 'text-white/40')}>{current}d</span>
          <span className="font-mono text-[11px] text-white/35">best {best}d</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Overview ────────────────────────────────────────── */
export default function OverviewTab({ reports, tradeAnalyses, persona, streaks, userName }) {

  const latest = reports?.[0] || null;
  const previous = reports?.[1] || null;
  const latestScores = latest?.mistakes?.scores || {};
  const previousScores = previous?.mistakes?.scores || {};

  // Daily coaching card — compute a single insight from persona data
  const dailyInsight = (() => {
    if (!persona || !persona.tradeCount) return null;
    const day = new Date().getDate();
    const insights = [];
    if (persona.mainEmotion) insights.push(`Trades tagged "${persona.mainEmotion}" appear most frequently in your journal. Your records show how this emotion correlates with your outcomes.`);
    if (persona.bestSession) insights.push(`Your ${persona.bestSession.name} session trades show a ${persona.bestSession.winRate}% win rate — your strongest session historically.`);
    if (persona.worstSession && persona.worstSession.name !== persona.bestSession?.name) insights.push(`Your ${persona.worstSession.name} session has been your most challenging. Consider reviewing your journal entries from those trades.`);
    if (persona.commonMistake) insights.push(`"${persona.commonMistake}" has been your most recurring pattern. Your journal suggests focusing here could have the highest impact.`);
    if (persona.adherencePct != null) insights.push(`Your setup adherence is at ${persona.adherencePct}%. Historically, trades where you fully followed your plan performed better.`);
    if (persona.revengeDays > 0) insights.push(`Your records show ${persona.revengeDays} trading days with potential revenge patterns. Taking a short break after consecutive losses has historically helped.`);
    if (insights.length === 0) return null;
    return insights[day % insights.length];
  })();

  // Celebrations — compute milestones from streaks and persona
  const celebrations = [];
  if (streaks?.logging?.current >= 3) celebrations.push({ icon: '🔥', text: `${streaks.logging.current}-day logging streak!` });
  if (streaks?.discipline?.current >= 3) celebrations.push({ icon: '🎯', text: `${streaks.discipline.current} disciplined days in a row!` });
  if (streaks?.profit?.current >= 3) celebrations.push({ icon: '💰', text: `${streaks.profit.current}-day profit streak!` });
  if (persona?.adherencePct >= 80) celebrations.push({ icon: '⭐', text: `${persona.adherencePct}% setup adherence — excellent discipline` });

  return (
    <div className="space-y-4">
      {/* 1. Hero Card */}
      <HeroCard report={latest} persona={persona} userName={userName} />

      {/* Daily Coaching Card */}
      {dailyInsight && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>P</div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Today&apos;s Coaching</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{dailyInsight}</p>
        </div>
      )}

      {/* Celebrations */}
      {celebrations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {celebrations.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-500/[0.06] px-3 py-1.5 text-xs text-amber-300">
              <span>{c.icon}</span><span>{c.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 2. Trader Score + Timeline */}
      <TraderScore reports={reports} />

      {/* 3. Streaks */}
      {streaks && (
        <div className="grid grid-cols-3 gap-2">
          <StreakBadge icon="🔥" label="Logging" current={streaks.logging?.current || 0} best={streaks.logging?.best || 0} />
          <StreakBadge icon="💰" label="Profit" current={streaks.profit?.current || 0} best={streaks.profit?.best || 0} />
          <StreakBadge icon="🎯" label="Discipline" current={streaks.discipline?.current || 0} best={streaks.discipline?.best || 0} />
        </div>
      )}

      {/* 4. Trader DNA */}
      {(Object.keys(latestScores).length > 0 || persona) && (
        <TraderDNA persona={persona} scores={latestScores} />
      )}

      {/* 5. Detailed Scores (collapsible) */}
      <ScoreDetails scores={latestScores} previousScores={previousScores} />

    </div>
  );
}
