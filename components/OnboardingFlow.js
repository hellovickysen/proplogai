"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from '@/app/dashboard/onboarding/actions';

const DEFAULT_EMOTIONS = ['Disciplined', 'Calm', 'Confident', 'FOMO', 'Fear', 'Greed', 'Revenge', 'Boredom'];

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function OnboardingFlow({ userEmail }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [emotions, setEmotions] = useState([...DEFAULT_EMOTIONS]);
  const [newEmotion, setNewEmotion] = useState('');
  const [defaultConfidence, setDefaultConfidence] = useState(0);
  const [saving, setSaving] = useState(false);

  function toggleEmotion(e) {
    setEmotions((cur) => cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]);
  }

  function addEmotion() {
    const t = newEmotion.trim();
    if (!t || emotions.map((e) => e.toLowerCase()).includes(t.toLowerCase())) return;
    setEmotions([...emotions, t]);
    setNewEmotion('');
  }

  async function finish() {
    setSaving(true);
    await completeOnboarding({ custom_emotions: emotions, default_confidence: defaultConfidence });
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('onboarding_completed');
    }
    router.push('/dashboard');
    router.refresh();
  }

  const total = 4;
  const pct = ((step + 1) / total) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070b] px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
            <span>Step {step + 1} of {total}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + '%', background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl text-3xl" style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.25), rgba(34,211,238,0.15))', border: '1px solid rgba(255,255,255,0.12)' }}>
                &#9670;
              </div>
              <h1 className="font-display text-2xl font-bold">Welcome to PipMind</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Your AI-powered forex trading journal. Log trades, track your emotions, and get coaching that helps you find — and fix — the patterns costing you money.
              </p>
              <p className="mt-4 font-mono text-xs text-white/40">Signed in as {userEmail}</p>
              <button onClick={() => setStep(1)} className="mt-7 rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
                Let's go →
              </button>
            </div>
          )}

          {/* Step 1: How it works */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold">How PipMind works</h2>
              <p className="mt-2 mb-6 text-sm text-white/50">Three steps to better trading.</p>

              <div className="space-y-4">
                {[
                  { icon: '☰', title: 'Log your trades', desc: 'Pair, direction, P&L — done in 30 seconds. CSV import coming soon.' },
                  { icon: '✎', title: 'Journal each trade', desc: 'Tag your emotions, rate your confidence, note what happened and why. Add chart screenshots.' },
                  { icon: '✦', title: 'Get AI coaching', desc: 'Instant per-trade analysis flags mistakes. The weekly coach report finds your recurring leaks.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-lg" style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold">{item.title}</h3>
                      <p className="mt-0.5 text-xs text-white/50">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(0)} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70">Back</button>
                <button onClick={() => setStep(2)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Journal preferences */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold">Set up your journal</h2>
              <p className="mt-2 mb-5 text-sm text-white/50">Pick the emotions you want to track. You can always change these in Settings.</p>

              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Your emotion tags</label>
              <div className="mb-4 flex flex-wrap gap-2">
                {emotions.map((em, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleEmotion(em)}
                    className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-200"
                  >
                    {em} ✕
                  </button>
                ))}
              </div>

              <div className="mb-5 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60"
                  value={newEmotion}
                  onChange={(e) => setNewEmotion(e.target.value)}
                  placeholder="Add a feeling (e.g. Anxious, Excited)…"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmotion())}
                />
                <button type="button" onClick={addEmotion} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white">Add</button>
              </div>

              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40">Default confidence</label>
              <div className="mb-1 flex gap-1 text-2xl">
                {[0, 1, 2, 3, 4, 5].map((i) =>
                  i === 0 ? (
                    <button key={i} type="button" onClick={() => setDefaultConfidence(0)} className={'rounded-lg border px-2 py-1 text-xs ' + (defaultConfidence === 0 ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300' : 'border-white/10 text-white/30')}>None</button>
                  ) : (
                    <button key={i} type="button" onClick={() => setDefaultConfidence(i)} className={i <= defaultConfidence ? 'text-amber-400' : 'text-white/20'}>&#9733;</button>
                  )
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70">Back</button>
                <button onClick={() => setStep(3)} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready to go */}
          {step === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-5 text-5xl">🚀</div>
              <h2 className="font-display text-xl font-bold">You're all set!</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                Your journal is ready. Log your first trade and let the AI coach start working for you.
              </p>

              <div className="mx-auto mt-6 max-w-xs space-y-2 text-left">
                {[
                  'Log a trade (pair, direction, P&L)',
                  'Add your journal entry (emotions + notes)',
                  'Hit "Analyze" for instant AI feedback',
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                    <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold" style={gradientBtn}>{i + 1}</span>
                    <span className="text-xs text-white/60">{tip}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button onClick={() => setStep(2)} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70">Back</button>
                <button onClick={finish} disabled={saving} className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={gradientBtn}>
                  {saving ? 'Saving…' : 'Start trading →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
