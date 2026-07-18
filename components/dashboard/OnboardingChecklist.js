"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'pl_checklist_dismissed';
const COMPLETED_KEY = 'pl_checklist_completed';
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

const shimmerStyle = `
@keyframes pl-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.pl-bar-shimmer {
  background: linear-gradient(90deg, #a78bfa 0%, #22d3ee 30%, #a78bfa 50%, #22d3ee 80%, #a78bfa 100%);
  background-size: 200% 100%;
  animation: pl-shimmer 2.5s ease-in-out infinite;
}
.pl-bar-shimmer-amber {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 30%, #f59e0b 50%, #fbbf24 80%, #f59e0b 100%);
  background-size: 200% 100%;
  animation: pl-shimmer 2.5s ease-in-out infinite;
}
`;
const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

const AI_PREVIEW = [
  'Your biggest recurring mistake',
  'Best and worst trading sessions',
  'Emotional patterns that cost you money',
  'Discipline score across all trades',
  'One habit to improve this week',
];

const AI_UNDERSTANDS = [
  { icon: '📖', label: 'Your trading rules' },
  { icon: '📊', label: 'Your first trade' },
  { icon: '📝', label: 'Your journal' },
  { icon: '🧠', label: 'Your psychology' },
  { icon: '🎯', label: 'Your trading style' },
];

function StepBadge({ step, done, locked }) {
  if (done) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-base font-bold text-emerald-400">
        ✓
      </div>
    );
  }
  if (locked) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-base text-white/30">
        🔒
      </div>
    );
  }
  // Active / next step — show number
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 font-display text-base font-bold text-violet-300">
      {step}
    </div>
  );
}

export default function OnboardingChecklist({ milestones: rawMilestones, completed: rawCompleted, total, coreCompleted, coreTotal, userName }) {
  const [dismissed, setDismissed] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(null);
  const [celebrating, setCelebrating] = useState(null);
  const [hasShared, setHasShared] = useState(false);
  const celebrationTimer = useRef(null);

  // Check localStorage for bonus step (PnL card share)
  const milestones = rawMilestones.map((m) =>
    m.bonus && hasShared ? { ...m, done: true, locked: false } : m
  );
  const completed = hasShared && !rawMilestones.find(m => m.bonus)?.done
    ? rawCompleted + 1 : rawCompleted;

  useEffect(() => {
    try {
      if (localStorage.getItem('pl_first_share') === '1') setHasShared(true);
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === '1');
      const prev = localStorage.getItem(COMPLETED_KEY);
      setPrevCompleted(prev ? Number(prev) : null);
    } catch {
      setDismissed(false);
    }
    // Poll localStorage for share flag (fires when share menu is used on same page)
    const shareCheck = setInterval(() => {
      try { if (localStorage.getItem('pl_first_share') === '1') setHasShared(true); } catch {}
    }, 2000);
    return () => clearInterval(shareCheck);
  }, []);

  useEffect(() => {
    if (prevCompleted === null) {
      try { localStorage.setItem(COMPLETED_KEY, String(completed)); } catch {}
      setPrevCompleted(completed);
      return;
    }
    if (completed > prevCompleted) {
      const justDone = milestones.find((m, i) => m.done && i === completed - 1);
      if (justDone) {
        setCelebrating(justDone);
        celebrationTimer.current = setTimeout(() => setCelebrating(null), 6000);
      }
      try { localStorage.setItem(COMPLETED_KEY, String(completed)); } catch {}
      setPrevCompleted(completed);
    }
  }, [completed, prevCompleted, milestones]);

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
  const nextStep = milestones.find((m) => !m.done && !m.locked);
  const coreComplete = coreCompleted >= coreTotal;
  const coreMilestones = milestones.filter((m) => !m.bonus);
  const bonusMilestones = milestones.filter((m) => m.bonus);

  // ─── AI Coach Activated (core 4 steps done) ───
  if (coreComplete) {
    return (
      <div className="mb-6 space-y-3">
        <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-500/[0.08] to-transparent p-5 sm:p-7">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 text-4xl">🎉</div>
            <h3 className="mb-1 font-display text-xl font-bold" style={gradientText}>
              Your AI Coach is Ready
            </h3>
            <p className="mb-2 text-sm font-medium text-white">
              Congratulations, {displayName}!
            </p>
            <p className="mb-4 max-w-md text-sm leading-relaxed text-white/50">
              Your AI now understands how you trade. The more you journal, the smarter it gets.
            </p>
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {AI_UNDERSTANDS.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-500/[0.05] px-3 py-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-medium text-emerald-300/80">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/coach"
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]"
                style={gradientBtn}
              >
                Open AI Coach &rarr;
              </Link>
              <button
                onClick={dismiss}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/50 hover:text-white/70"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {bonusMilestones.map((m) => !m.done && (
          <Link
            key={m.id}
            href={m.href}
            className="flex items-center gap-3.5 rounded-xl border border-amber-400/15 bg-amber-500/[0.03] p-3.5 hover:bg-amber-500/[0.06] transition-all"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 font-display text-base font-bold text-amber-300">
              {m.step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">BONUS</span>
                <span className="text-sm font-semibold text-white">{m.title}</span>
              </div>
              <p className="mt-0.5 text-xs text-white/40">{m.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-amber-400/60">🏆</span>
              <span className="font-mono text-[10px] text-amber-400/50">{m.reward}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />
      {/* ─── Welcome Header ─── */}
      <div className="mb-5">
        <h2 className="font-display text-lg font-bold text-white sm:text-xl">
          Welcome, {displayName} <span className="inline-block">👋</span>
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          You&apos;re not setting up an app &mdash; you&apos;re training your personal AI trading
          coach. The more honestly you journal, the more personalized your coaching becomes.
        </p>
      </div>

      {/* ─── AI Learning Progress Bar ─── */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold" style={gradientText}>
            AI Learning Progress &middot; {pct}%
          </span>
          <span className="font-mono text-xs text-white/30">Step {Math.min(completed + 1, total)} of {total}</span>
        </div>
        <div className="flex gap-1">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={'h-2 flex-1 rounded-full transition-all duration-500 ' + (m.done ? (m.bonus ? 'pl-bar-shimmer-amber' : 'pl-bar-shimmer') : '')}
              style={m.done ? undefined : { background: 'rgba(255,255,255,0.06)' }}
            />
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-white/30">
          Your AI becomes smarter after every completed step.
        </p>
      </div>

      {/* ─── Step Celebration Toast ─── */}
      {celebrating && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-3.5">
          <span className="text-xl">🎉</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-emerald-300">
              Nice! {celebrating.celebration}
            </div>
            {nextStep && (
              <div className="mt-0.5 text-xs text-white/45">
                Next: {nextStep.title} &middot; {nextStep.time}
              </div>
            )}
          </div>
          <button onClick={() => setCelebrating(null)} className="text-xs text-white/30 hover:text-white/50">&#10005;</button>
        </div>
      )}

      {/* ─── Core Task Cards ─── */}
      <div className="space-y-2">
        {coreMilestones.map((m) => {
          const isNext = !m.done && !m.locked;
          const showAiPreview = m.id === 'trade' && m.done && !milestones.find(x => x.id === 'analysis')?.done;

          // Locked card
          if (m.locked) {
            return (
              <div key={m.id}>
                <div className="flex items-start gap-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 opacity-40">
                  <StepBadge step={m.step} done={false} locked={true} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/40">{m.title}</span>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 font-mono text-[10px] text-white/20">
                        {m.time}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-white/20">&#9733;</span>
                      <span className="font-mono text-[10px] text-white/20">{m.reward}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Active or completed card
          return (
            <div key={m.id}>
              <Link
                href={m.href}
                className={`group flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                  m.done
                    ? 'border-white/[0.05] bg-white/[0.01] opacity-50'
                    : 'border-violet-400/20 bg-violet-500/[0.04] hover:bg-violet-500/[0.07]'
                }`}
              >
                <StepBadge step={m.step} done={m.done} locked={false} />

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

                {!m.done && (
                  <svg className="mt-2 h-4 w-4 flex-shrink-0 text-violet-400/50 group-hover:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {showAiPreview && (
                <div className="mt-2 mb-1 rounded-xl border border-violet-400/15 bg-violet-500/[0.04] p-3.5">
                  <div className="mb-2 text-xs font-semibold" style={gradientText}>
                    After learning your trading habits, your AI coach will help you discover:
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
            </div>
          );
        })}

        {/* ─── Bonus Step ─── */}
        {bonusMilestones.map((m) => {
          if (m.locked) {
            return (
              <div key={m.id} className="flex items-start gap-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 opacity-40">
                <StepBadge step={m.step} done={false} locked={true} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400/40">BONUS</span>
                    <span className="text-sm font-semibold text-white/40">{m.title}</span>
                  </div>
                </div>
              </div>
            );
          }
          return (
            <button
              key={m.id}
              onClick={() => {
                const shareBtn = document.querySelector('[data-tour="share-btn"]');
                if (shareBtn) {
                  shareBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => { const btn = shareBtn.querySelector('button'); if (btn) btn.click(); }, 400);
                }
              }}
              className={`group flex items-start gap-3.5 rounded-xl border p-3.5 transition-all text-left w-full ${
                m.done
                  ? 'border-white/[0.05] bg-white/[0.01] opacity-50'
                  : 'border-amber-400/10 bg-amber-500/[0.02] hover:bg-amber-500/[0.05]'
              }`}
            >
              <StepBadge step={m.step} done={m.done} locked={false} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">BONUS</span>
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
                      <span className="text-[10px] text-amber-400">🏆</span>
                      <span className="font-mono text-[10px] text-amber-400/50">{m.reward}</span>
                    </div>
                  </>
                )}
              </div>
            </button>
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
