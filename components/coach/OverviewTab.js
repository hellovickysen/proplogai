"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleHabitLog, createHabit, deleteHabit } from '@/app/dashboard/coach/habit-actions';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

const SCORE_KEYS = [
  { key: 'discipline', label: 'Discipline', icon: '🎯' },
  { key: 'psychology', label: 'Psychology', icon: '🧠' },
  { key: 'consistency', label: 'Consistency', icon: '📈' },
  { key: 'risk_management', label: 'Risk Mgmt', icon: '🛡️' },
  { key: 'execution', label: 'Execution', icon: '⚡' },
];

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function scoreBg(val) {
  if (val >= 80) return 'border-emerald-400/20 bg-emerald-500/[0.06]';
  if (val >= 60) return 'border-amber-400/20 bg-amber-500/[0.06]';
  if (val >= 40) return 'border-orange-400/20 bg-orange-500/[0.06]';
  return 'border-red-400/20 bg-red-500/[0.06]';
}

function TrendArrow({ current, previous }) {
  if (previous == null || current == null) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  return (
    <span className={'font-mono text-[10px] ' + (diff > 0 ? 'text-emerald-400' : 'text-red-400')}>
      {diff > 0 ? '▲' : '▼'}{Math.abs(diff)}
    </span>
  );
}

function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="url(#sg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
    </svg>
  );
}

/* ── Streak badge ─────────────────────────────────────────── */
function StreakBadge({ icon, label, current, best }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-white/50">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className={'font-display text-lg font-bold ' + (current > 0 ? 'text-amber-400' : 'text-white/30')}>{current}d</span>
          <span className="font-mono text-[10px] text-white/25">best {best}d</span>
        </div>
      </div>
    </div>
  );
}

/* ── Persona metric ───────────────────────────────────────── */
function PersonaMetric({ label, value, sub, color }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">{label}</div>
      <div className={'mt-0.5 text-sm font-semibold ' + (color || 'text-white/70')}>{value || '—'}</div>
      {sub && <div className="font-mono text-[10px] text-white/25">{sub}</div>}
    </div>
  );
}

/* ── Habit row ────────────────────────────────────────────── */
function HabitRow({ habit, completed, autoCompleted, todayDate, onToggle }) {
  const isAuto = !habit.is_custom;
  const done = isAuto ? autoCompleted : completed;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <button
        onClick={() => !isAuto && onToggle(habit.id, !done)}
        disabled={isAuto}
        className={'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ' +
          (done
            ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-400'
            : 'border-white/15 bg-white/[0.03] text-transparent hover:border-white/25')
        }
      >
        {done && <span className="text-xs">✓</span>}
      </button>
      <span className={'flex-1 text-sm ' + (done ? 'text-white/50 line-through' : 'text-white/70')}>{habit.name}</span>
      {isAuto && <span className="font-mono text-[9px] text-white/20">auto</span>}
    </div>
  );
}

export default function OverviewTab({ reports, tradeAnalyses, persona, streaks, habits, habitLogs, autoHabitStatus, todayDate }) {
  const router = useRouter();
  const [newHabit, setNewHabit] = useState('');
  const [adding, setAdding] = useState(false);

  const latest = reports?.[0] || null;
  const previous = reports?.[1] || null;
  const latestScores = latest?.mistakes?.scores || {};
  const previousScores = previous?.mistakes?.scores || {};

  const scoreHistory = {};
  SCORE_KEYS.forEach(({ key }) => { scoreHistory[key] = []; });
  [...(reports || [])].reverse().forEach((r) => {
    const s = r?.mistakes?.scores;
    if (s) SCORE_KEYS.forEach(({ key }) => { if (s[key] != null) scoreHistory[key].push(s[key]); });
  });

  // Habit log lookup for today
  const todayLogs = {};
  (habitLogs || []).forEach((l) => { if (l.log_date === todayDate) todayLogs[l.habit_id] = l.completed; });

  async function handleToggle(habitId, completed) {
    await toggleHabitLog(habitId, todayDate, completed);
    router.refresh();
  }

  async function handleAddHabit() {
    if (!newHabit.trim()) return;
    setAdding(true);
    const res = await createHabit(newHabit.trim());
    if (res.ok) { setNewHabit(''); router.refresh(); }
    setAdding(false);
  }

  return (
    <div className="space-y-5">
      {/* Score Cards */}
      {latest ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {SCORE_KEYS.map(({ key, label, icon }) => {
            const val = latestScores[key] || 0;
            return (
              <div key={key} className={'rounded-2xl border p-3.5 ' + scoreBg(val)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs">{icon}</span>
                  <TrendArrow current={latestScores[key]} previous={previousScores[key]} />
                </div>
                <div className={'mt-1.5 font-display text-2xl font-bold ' + scoreColor(val)}>
                  {latestScores[key] != null ? latestScores[key] : '—'}
                </div>
                <div className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-white/35">{label}</div>
                {scoreHistory[key].length > 1 && <div className="mt-1.5"><Sparkline data={scoreHistory[key]} /></div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="text-3xl mb-2">◎</div>
          <p className="text-xs text-white/35">Generate a review to see scores</p>
        </div>
      )}

      {/* Streaks */}
      {streaks && (
        <div className="grid grid-cols-3 gap-2.5">
          <StreakBadge icon="🔥" label="Logging" current={streaks.logging?.current || 0} best={streaks.logging?.best || 0} />
          <StreakBadge icon="💰" label="Profit" current={streaks.profit?.current || 0} best={streaks.profit?.best || 0} />
          <StreakBadge icon="🎯" label="Discipline" current={streaks.discipline?.current || 0} best={streaks.discipline?.best || 0} />
        </div>
      )}

      {/* Persona Profile */}
      {persona && (
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/30">Trader Profile</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <PersonaMetric label="Main emotion" value={persona.mainEmotion} color="text-violet-300" />
            <PersonaMetric label="Common mistake" value={persona.commonMistake} color="text-red-300" />
            <PersonaMetric label="Best session" value={persona.bestSession?.name} sub={persona.bestSession ? `${persona.bestSession.winRate}% WR` : null} color="text-emerald-300" />
            <PersonaMetric label="Worst session" value={persona.worstSession?.name} sub={persona.worstSession ? `${persona.worstSession.winRate}% WR` : null} color="text-red-300" />
            <PersonaMetric label="Confidence" value={persona.confidenceLevel} sub={persona.avgConfidence ? `avg ${persona.avgConfidence}/5` : null} />
            <PersonaMetric label="Setup adherence" value={persona.adherencePct != null ? persona.adherencePct + '%' : '—'} color={persona.adherencePct >= 70 ? 'text-emerald-300' : 'text-amber-300'} />
            <PersonaMetric label="Revenge days" value={persona.revengeDays + ' of ' + persona.totalDays} color={persona.revengeDays > 0 ? 'text-red-300' : 'text-emerald-300'} />
            <PersonaMetric label="Trades" value={persona.tradeCount} />
          </div>
        </div>
      )}

      {/* Daily Habits */}
      {habits && habits.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">Today&apos;s Habits</div>
            <span className="font-mono text-[10px] text-white/20">{todayDate}</span>
          </div>
          <div className="space-y-0.5">
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                completed={!!todayLogs[h.id]}
                autoCompleted={!h.is_custom && autoHabitStatus ? autoHabitStatus[
                  h.name === 'Log trades daily' ? 'log_daily'
                  : h.name === 'Tag emotions' ? 'tag_emotions'
                  : h.name === 'Record lessons' ? 'record_lessons'
                  : h.name === 'Follow setups' ? 'follow_setups'
                  : ''
                ] : false}
                todayDate={todayDate}
                onToggle={handleToggle}
              />
            ))}
          </div>
          {/* Add custom habit */}
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              placeholder="Add a habit..."
              maxLength={60}
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none placeholder:text-white/20 focus:border-cyan-400/40"
            />
            <button
              onClick={handleAddHabit}
              disabled={adding || !newHabit.trim()}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white/80 disabled:opacity-30"
            >
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
