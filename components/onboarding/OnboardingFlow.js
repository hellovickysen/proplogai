"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/app/onboarding/actions';
import { LogoMark } from '@/components/Logo';

const DEFAULT_EMOTIONS = ['Disciplined', 'Calm', 'Confident', 'FOMO', 'Fear', 'Greed', 'Revenge', 'Boredom'];

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

const FEATURES = [
  {
    icon: '📊',
    title: 'Trade Logging',
    desc: 'Log any trade in 30 seconds — pair, direction, P&L, and setups.',
    accent: 'border-violet-400/30 bg-violet-500/[0.06]',
    iconBg: 'bg-violet-500/15',
  },
  {
    icon: '📝',
    title: 'Journal & Psychology',
    desc: 'Tag emotions, rate confidence, capture lessons and screenshots.',
    accent: 'border-cyan-400/30 bg-cyan-500/[0.06]',
    iconBg: 'bg-cyan-500/15',
  },
  {
    icon: '✦',
    title: 'Propol AI Coach',
    desc: 'Instant trade analysis and monthly reviews that find your leaks.',
    accent: 'border-amber-400/30 bg-amber-500/[0.06]',
    iconBg: 'bg-amber-500/15',
  },
  {
    icon: '📅',
    title: 'P&L Calendar',
    desc: 'See daily P&L at a glance. Spot streaks, slumps, and patterns.',
    accent: 'border-emerald-400/30 bg-emerald-500/[0.06]',
    iconBg: 'bg-emerald-500/15',
  },
  {
    icon: '📖',
    title: 'Rulebook & Setups',
    desc: 'Define your trading playbook and track which setups you follow.',
    accent: 'border-rose-400/30 bg-rose-500/[0.06]',
    iconBg: 'bg-rose-500/15',
  },
  {
    icon: '💰',
    title: 'Expense Tracker',
    desc: 'Track prop firm fees, renewals, and payouts. Know your real ROI.',
    accent: 'border-yellow-400/30 bg-yellow-500/[0.06]',
    iconBg: 'bg-yellow-500/15',
  },
  {
    icon: '🏆',
    title: 'Trophy Wall',
    desc: 'Celebrate funded accounts, challenge passes, and big milestones.',
    accent: 'border-orange-400/30 bg-orange-500/[0.06]',
    iconBg: 'bg-orange-500/15',
  },
  {
    icon: '👤',
    title: 'Public Profile',
    desc: 'Share your trading journey — calendar, trades, payouts, and wins.',
    accent: 'border-blue-400/30 bg-blue-500/[0.06]',
    iconBg: 'bg-blue-500/15',
  },
];

export default function OnboardingFlow({ userEmail }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    // Pass sensible defaults — user can customize emotions/confidence in Settings later
    await completeOnboarding({ custom_emotions: DEFAULT_EMOTIONS, default_confidence: 0 });
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('onboarding_completed');
    }
    // Full page reload ensures fresh server-rendered dashboard content.
    // Client-side router.push can serve stale cached data on iOS Safari.
    window.location.href = '/dashboard';
  }

  const total = 3;
  const pct = ((step + 1) / total) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07070b] px-4 py-10">
      {/* Progress bar */}
      <div className="mb-8 w-full max-w-lg">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
            Step {step + 1} of {total}
          </span>
          <span className="font-mono text-[11px] text-white/30">{Math.round(pct)}%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-white/[0.06]">
          <div
            className="h-1 rounded-full transition-all duration-500 ease-out"
            style={{ ...gradientBtn, width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Card container */}
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        {/* ─── Step 0: Welcome ─── */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={gradientBtn}>
              <LogoMark />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold sm:text-3xl" style={gradientText}>
              Welcome to PropLogAI
            </h1>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-white/55">
              Your AI-powered trading journal. Log trades, track emotions, and get
              coaching that helps you find — and fix — the patterns costing you money.
            </p>
            <p className="mb-7 font-mono text-xs text-white/35">
              Signed in as {userEmail}
            </p>
            <button
              onClick={() => setStep(1)}
              className="rounded-xl px-8 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={gradientBtn}
            >
              Let&apos;s go →
            </button>
          </div>
        )}

        {/* ─── Step 1: Feature Showcase ─── */}
        {step === 1 && (
          <div>
            <h2 className="mb-1 text-center font-display text-xl font-bold text-white sm:text-2xl">
              Everything you need
            </h2>
            <p className="mb-5 text-center text-sm text-white/45">
              Here&apos;s what PropLogAI gives you from day one.
            </p>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${f.accent}`}
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base ${f.iconBg}`}>
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{f.title}</div>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/45">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep(0)}
                className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={gradientBtn}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Ready ─── */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl">
              🚀
            </div>
            <h2 className="mb-2 font-display text-xl font-bold text-white sm:text-2xl">
              You&apos;re all set!
            </h2>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-white/50">
              Your journal is ready. Here&apos;s how to get started:
            </p>

            <div className="mb-6 w-full space-y-2.5">
              {[
                { n: '1', text: 'Log a trade — pair, direction, and your P&L' },
                { n: '2', text: 'Add a journal entry — emotions, notes, screenshots' },
                { n: '3', text: 'Hit "Analyze" for instant AI feedback on any trade' },
              ].map((tip) => (
                <div
                  key={tip.n}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left"
                >
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-[#08080f]"
                    style={gradientBtn}
                  >
                    {tip.n}
                  </div>
                  <span className="text-sm text-white/70">{tip.text}</span>
                </div>
              ))}
            </div>

            <p className="mb-5 text-xs text-white/35">
              You can customize your emotion tags and confidence settings anytime in Settings.
            </p>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => setStep(1)}
                className="order-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 hover:bg-white/10 sm:order-1"
              >
                Back
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="order-1 rounded-xl px-8 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 sm:order-2"
                style={gradientBtn}
              >
                {saving ? 'Saving…' : 'Start trading →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
