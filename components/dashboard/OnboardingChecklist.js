"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'pl_checklist_dismissed';
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function OnboardingChecklist({ milestones, completed, total }) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [collapsed, setCollapsed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  // Celebration when all done
  useEffect(() => {
    if (completed === total && !dismissed) {
      setShowCelebration(true);
    }
  }, [completed, total, dismissed]);

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }

  // Don't render if dismissed or still loading (dismissed defaults to true)
  if (dismissed) return null;

  const pct = Math.round((completed / total) * 100);

  // Celebration state
  if (showCelebration) {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 text-4xl">🎉</div>
          <h3 className="mb-1 font-display text-lg font-bold text-white">
            You&apos;ve explored everything!
          </h3>
          <p className="mb-4 max-w-md text-sm text-white/50">
            You&apos;ve tried every major feature in PropLogAI. Keep logging trades and
            let Propol find the patterns that matter.
          </p>
          <button
            onClick={dismiss}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]"
            style={gradientBtn}
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 text-left"
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-[#08080f]"
            style={gradientBtn}
          >
            {completed}/{total}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Getting started</h3>
            <p className="text-xs text-white/40">
              Explore PropLogAI&apos;s features — {total - completed} remaining
            </p>
          </div>
          <svg
            className={`ml-1 h-4 w-4 text-white/30 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={dismiss}
          className="rounded-lg px-2.5 py-1 text-xs text-white/30 hover:text-white/50"
          title="Dismiss checklist"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ ...gradientBtn, width: `${pct}%` }}
        />
      </div>

      {/* Milestones */}
      {!collapsed && (
        <div className="mt-4 space-y-1">
          {milestones.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                m.done
                  ? 'opacity-50'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              {/* Checkbox */}
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-xs ${
                  m.done
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/15 bg-white/[0.03] text-transparent'
                }`}
              >
                {m.done ? '✓' : ''}
              </div>

              {/* Icon */}
              <span className="flex-shrink-0 text-sm">{m.icon}</span>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${m.done ? 'text-white/40 line-through' : 'text-white'}`}>
                  {m.title}
                </div>
                {!m.done && (
                  <p className="mt-0.5 text-xs text-white/35">{m.desc}</p>
                )}
              </div>

              {/* Arrow for incomplete items */}
              {!m.done && (
                <svg className="h-4 w-4 flex-shrink-0 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
