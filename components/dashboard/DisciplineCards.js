"use client";

import WeeklyScoreRing from '@/components/dashboard/WeeklyScoreRing';
import AchievementBadges from '@/components/dashboard/AchievementBadges';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function DisciplineStat({ label, value, sub, tone }) {
  const borderColor = tone === 'good' ? 'border-emerald-400/20' : tone === 'warn' ? 'border-amber-400/20' : 'border-white/10';
  const glowColor = tone === 'good' ? 'rgba(52,211,153,0.06)' : tone === 'warn' ? 'rgba(251,191,36,0.06)' : 'transparent';
  const textColor = tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-white';
  return (
    <div className={'rounded-xl border p-3 sm:p-4 ' + borderColor} style={{ background: glowColor }}>
      <div className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className={'mt-2 font-display text-2xl font-bold ' + textColor}>{value}</div>
      {sub && <p className="mt-1 font-mono text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}

export default function DisciplineCards({ stats, weeklyScore, achievements }) {
  if (!stats) return null;

  const { journalStreak, setupDiscipline, noRevengeStreak, noSetupCount, totalTrades } = stats;

  const journalTone = journalStreak >= 5 ? 'good' : journalStreak >= 2 ? '' : '';
  const disciplineTone = setupDiscipline >= 80 ? 'good' : setupDiscipline >= 50 ? '' : setupDiscipline > 0 ? 'warn' : '';
  const revengeTone = noRevengeStreak >= 5 ? 'good' : noRevengeStreak >= 2 ? '' : noRevengeStreak === 0 ? 'warn' : '';
  const noSetupTone = noSetupCount === 0 ? 'good' : noSetupCount <= 2 ? '' : 'warn';

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-base">&#128170;</span>
        <div className="font-display text-base font-semibold" style={gradientText}>Rulebook discipline</div>
      </div>

      {/* Top row: Weekly score ring + streak stats */}
      <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* Weekly score ring */}
        {weeklyScore && (
          <div className="flex-shrink-0">
            <WeeklyScoreRing
              score={weeklyScore.score}
              breakdown={{
                journal: weeklyScore.journal,
                discipline: weeklyScore.discipline,
                revenge: weeklyScore.revenge,
                volume: weeklyScore.volume,
              }}
            />
          </div>
        )}

        {/* Streak stat cards */}
        <div className="grid flex-1 grid-cols-2 gap-3">
          <DisciplineStat
            label="Journal streak"
            value={journalStreak + 'd'}
            sub={journalStreak > 0 ? 'days in a row' : 'Start journaling!'}
            tone={journalTone}
          />
          <DisciplineStat
            label="Setup discipline"
            value={setupDiscipline > 0 ? setupDiscipline + '%' : '—'}
            sub={totalTrades > 0 ? 'trades followed setup' : 'Log trades to track'}
            tone={disciplineTone}
          />
          <DisciplineStat
            label="No revenge streak"
            value={noRevengeStreak + 'd'}
            sub={noRevengeStreak > 0 ? 'days clean' : 'Stay disciplined'}
            tone={revengeTone}
          />
          <DisciplineStat
            label="No setup trades"
            value={String(noSetupCount)}
            sub={noSetupCount === 0 ? 'This week — great!' : 'this week'}
            tone={noSetupTone}
          />
        </div>
      </div>

      {/* Achievement badges */}
      {achievements && achievements.length > 0 && (
        <div className="border-t border-white/[0.06] pt-4">
          <AchievementBadges achievements={achievements} />
        </div>
      )}
    </div>
  );
}
