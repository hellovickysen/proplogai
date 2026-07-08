"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'pl_checklist_dismissed';
const COMPLETED_KEY = 'pl_checklist_completed';
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };
const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

const AI_PREVIEW = [
  'Your biggest recurring mistake',
  'Best and worst trading sessions',
  'Emotional patterns that cost you money',
  'Discipline score across all trades',
  'One habit to improve this week',
];

const UNLOCKED_FEATURES = [
  { icon: '🤖', label: 'AI Coach' },
  { icon: '📊', label: 'Monthly Review' },
  { icon: '🎯', label: 'Trader Score' },
  { icon: '🏆', label: 'First Achievement' },
];

export default function OnboardingChecklist({ milestones, completed, total, userName }) {
  const [dismissed, setDismissed] = useState(true);
  const [prevCompleted, setPrevCompleted] = useState(null);
  const [celebrating, setCelebrating] = useState(null);
  const [showFinal, setShowFinal] = useState(false);
  const celebrationTimer = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === '1');
      const prev = localStorage.getItem(COMPLETED_KEY);
      setPrevCompleted(prev ? Number(prev) : null);
    } catch {
      setDismissed(false);
    }
  }, []);

  // Detect newly completed step
  useEffect(() => {
    if (prevCompleted === null) {
      // First load — store current state
      try { localStorage.setItem(COMPLETED_KEY, String(completed)); } catch {}
      setPrevCompleted(completed);
      return;
    }
    if (completed > prevCompleted && completed < total) {
      // A new step was completed — find which one
      const justDone = milestones.find((m, i) => m.done && i === completed - 1);
      if (justDone) {
        setCelebrating(justDone);
        celebrationTimer.current = setTimeout(() => setCelebrating(null), 5000);
      }
      try { localStorage.setItem(COMPLETED_KEY, String(completed)); } catch {}
      setPrevCompleted(completed);
    } else if (completed === total && prevCompleted < total) {
      // All complete!
      setShowFinal(true);
      try { localStorage.setItem(COMPLETED_KEY, String(completed)); } catch {}
      setPrevCompleted(completed);
    }
  }, [completed, prevCompleted, total, milestones]);

  useEffect(() => {
    return () => { if (celebrationTimer.current) clearTimeout(celebrationTimer.current); };
  }, []);

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }

  if (dismissed) return null;

  const pct = Math.round((completed / total) * 100);
  const displayName = userName || 'there';
  const nextStep = milestones.find((m) => !m.done);

  // ─── Final Celebration ───
  if (showFinal || completed === total) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-500/[0.08] to-transparent p-5 sm:p-7">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 text-4xl">🎉</div>
          <h3 className="mb-1 font-display text-xl font-bold text-white">
            Congratulations, {displayName}!
          </h3>
          <p className="mb-5 max-w-md text-sm leading-relaxed text-white/55">
            Your AI coach is fully trained. It&apos;s now learning from every trade you log.
            Here&apos;s what you&apos;ve unlocked:
          </p>
          <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {UNLOCKED_FEATURES.map((f) => (
              <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                <div className="text-xl">{f.icon}</div>
                <div className="mt-1 text-xs font-medium text-white/70">{f.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={dismiss}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]"
            style={gradientBtn}
          >
            Start trading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      {/* ─── Welcome Header ─── */}
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Welcome, {displayName} <span className="inline-block">👋</span>
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-white/50">
          Complete {total} quick steps so your AI coach can begin learning your trading
          habits and deliver personalized coaching.
        </p>
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold" style={gradientText}>
            {pct}% complete
          </span>
          <span className="font-mono text-xs text-white/30">{completed}/{total} steps</span>
        </div>
        <div className="flex gap-1">
          {milestones.map((m, i) => (
            <div
              key={m.id}
              className="h-2 flex-1 rounded-full transition-all duration-500"
              style={i < completed ? gradientBtn : { background: 'rgba(255,255,255,0.06)' }}
            />
          ))}
        </div>
      </div>

      {/* ─── Step Celebration Toast ─── */}
      {celebrating && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3 animate-in fade-in">
          <span className="text-lg">🎉</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-300">
              {celebrating.title} — done!
            </div>
            {nextStep && (
              <div className="mt-0.5 text-xs text-white/45">
                Next: {nextStep.title} · {nextStep.time}
              </div>
            )}
          </div>
          <button onClick={() => setCelebrating(null)} className="text-xs text-white/30 hover:text-white/50">✕</button>
        </div>
      )}

      {/* ─── AI Preview (show before AI step is done) ─── */}
      {!milestones.find(m => m.id === 'analysis')?.done && completed >= 1 && (
        <div className="mb-4 rounded-xl border border-violet-400/15 bg-violet-500/[0.04] p-3.5">
          <div className="mb-2 text-xs font-semibold" style={gradientText}>
            🤖 What your AI coach will tell you
          </div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {AI_PREVIEW.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-white/50">
                <span className="text-emerald-400">&#10003;</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Task Cards ─── */}
      <div className="space-y-2">
        {milestones.map((m, i) => {
          const isNext = !m.done && (i === 0 || milestones[i - 1].done);
          return (
            <Link
              key={m.id}
              href={m.href}
              className={`group flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                m.done
                  ? 'border-white/[0.05] bg-white/[0.01] opacity-50'
                  : isNext
                  ? 'border-violet-400/20 bg-violet-500/[0.04] hover:bg-violet-500/[0.07]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              {/* Icon / Check */}
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg ${
                m.done
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : isNext
                  ? 'bg-violet-500/15'
                  : 'bg-white/[0.04]'
              }`}>
                {m.done ? '✓' : m.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${m.done ? 'text-white/40 line-through' : 'text-white'}`}>
                    {m.title}
                  </span>
                  {!m.done && (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/35">
                      {m.time}
                    </span>
                  )}
                </div>
                {!m.done && (
                  <>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/40">{m.desc}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px]" style={gradientText}>&#9733;</span>
                      <span className="font-mono text-[10px] text-white/35">{m.reward}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Arrow for next step */}
              {isNext && !m.done && (
                <svg className="mt-2 h-4 w-4 flex-shrink-0 text-violet-400/50 group-hover:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>

      {/* ─── Dismiss ─── */}
      <div className="mt-4 text-center">
        <button
          onClick={dismiss}
          className="text-xs text-white/25 hover:text-white/40 transition-colors"
        >
          Dismiss checklist
        </button>
      </div>
    </div>
  );
}
