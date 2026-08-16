'use client';

import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const STEPS = [
  {
    id: 'define',
    eyebrow: 'Step 01',
    title: 'Define your rules',
    desc: 'Write the setups you trust and the guardrails you keep breaking — max risk per trade, daily loss limit, no-trade windows. This becomes the rulebook everything is measured against.',
    chips: ['Max risk 1%', 'Daily loss cap', 'London close: no re-entry'],
  },
  {
    id: 'setup',
    eyebrow: 'Step 02',
    title: 'Trade your setups',
    desc: 'Tag each trade to a rulebook setup before you take it. If it\u2019s not a setup you defined, it\u2019s a No Setup — and the system counts it.',
    chips: ['A+ breakout', 'London sweep', 'No setup ⚠'],
  },
  {
    id: 'log',
    eyebrow: 'Step 03',
    title: 'Log every trade',
    desc: 'Thirty seconds: pair, direction, emotions, a screenshot. The manual pause is the point — it forces you to relive the decision instead of letting it blur into the next one.',
    chips: ['Emotions tagged', 'Screenshot', '30 seconds'],
  },
  {
    id: 'analyze',
    eyebrow: 'Step 04',
    title: 'Watch AI find the pattern',
    desc: 'Propol connects every logged trade to your rulebook and surfaces the recurring mistake you couldn\u2019t see — with the evidence attached. Your discipline score tracks the fix.',
    chips: ['Pattern found', 'Focus rule', 'Score trend'],
  },
];

/* ── Step mockups (placeholders, swap for real screenshots) ── */

function MockRules() {
  return (
    <div className="space-y-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Your rulebook</div>
      {[
        { name: 'Max risk per trade', val: '1.0%', tone: 'text-cyan-300' },
        { name: 'Daily loss limit', val: '-3R · stop', tone: 'text-rose-300' },
        { name: 'London close re-entry', val: 'Blocked 20 min', tone: 'text-amber-300' },
        { name: 'A+ setups only after 2 losses', val: 'Required', tone: 'text-emerald-300' },
      ].map((r) => (
        <div key={r.name} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
          <span className="text-xs text-white/75">{r.name}</span>
          <span className={`font-mono text-[10px] font-semibold ${r.tone}`}>{r.val}</span>
        </div>
      ))}
      <div className="pt-1 text-right font-mono text-[9px] text-white/30">4 guardrails active</div>
    </div>
  );
}

function MockSetup() {
  return (
    <div className="space-y-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Tag this trade</div>
      {[
        { name: 'A+ breakout', sel: true },
        { name: 'London sweep', sel: false },
        { name: 'Range fade', sel: false },
      ].map((s) => (
        <div key={s.name} className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 ${s.sel ? 'border-[#8b7cf6]/40 bg-[#8b7cf6]/[0.08]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
          <span className={`h-2 w-2 rounded-full ${s.sel ? 'bg-[#8b7cf6]' : 'bg-white/15'}`} />
          <span className={`text-xs ${s.sel ? 'font-semibold text-white' : 'text-white/55'}`}>{s.name}</span>
          {s.sel && <span className="ml-auto font-mono text-[9px] text-[#b3a5f8]">Selected</span>}
        </div>
      ))}
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-rose-300/30 bg-rose-300/[0.04] px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-rose-300/60" />
        <span className="text-xs text-rose-200/80">None of these = No Setup</span>
      </div>
    </div>
  );
}

function MockLog() {
  return (
    <div className="space-y-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Log trade · 30s</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
          <div className="font-mono text-[8px] text-white/30">PAIR</div>
          <div className="text-xs font-semibold text-white/85">XAU/USD</div>
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
          <div className="font-mono text-[8px] text-white/30">DIRECTION</div>
          <div className="text-xs font-semibold text-emerald-300">Long</div>
        </div>
      </div>
      <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
        <div className="font-mono text-[8px] text-white/30">EMOTIONS</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {['Calm', 'Patient'].map((e) => (
            <span key={e} className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-2 py-0.5 text-[9px] text-cyan-200">{e}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
        <span className="text-[10px] text-white/45">Chart screenshot</span>
        <span className="font-mono text-[9px] text-emerald-300">✓ attached</span>
      </div>
    </div>
  );
}

function MockAnalyze() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Propol analysis</span>
        <span className="rounded-full bg-rose-400/10 px-2 py-0.5 font-mono text-[8px] font-bold text-rose-300">Pattern</span>
      </div>
      <div className="rounded-lg border border-rose-300/20 bg-rose-300/[0.05] px-3.5 py-3">
        <div className="font-mono text-[8px] uppercase tracking-wider text-rose-300/70">Recurring mistake</div>
        <p className="mt-1 text-xs leading-relaxed text-white/80">
          Revenge re-entry 9 min after back-to-back losses — <span className="font-semibold text-rose-300">6× in 3 weeks</span>.
        </p>
      </div>
      <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.06] px-3.5 py-2.5">
        <div className="font-mono text-[8px] uppercase tracking-wider text-emerald-300/70">Focus rule set</div>
        <div className="mt-0.5 text-xs text-emerald-50/85">No re-entry for 20 min after 2 losses</div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
        <span className="font-mono text-[9px] text-white/40">Discipline score</span>
        <span className="font-display text-sm font-extrabold text-cyan-300">82 <span className="font-mono text-[8px] font-normal text-emerald-300">↑18</span></span>
      </div>
    </div>
  );
}

const MOCKS = { define: MockRules, setup: MockSetup, log: MockLog, analyze: MockAnalyze };

/* ── Section ── */

export default function JourneySection() {
  const trackRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(min-width: 1024px)');
    const setMQ = () => setIsDesktop(mq.matches);
    setMQ();
    mq.addEventListener('change', setMQ);
    return () => mq.removeEventListener('change', setMQ);
  }, []);

  const pinned = isDesktop && !reduced;

  useEffect(() => {
    if (!pinned) return undefined;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const track = trackRef.current;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const passed = Math.min(Math.max(-rect.top, 0), total);
        setProgress(total > 0 ? passed / total : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pinned]);

  const count = STEPS.length;
  const active = Math.min(Math.floor(progress * count), count - 1);
  const lineScale = pinned ? progress : 1;

  /* ── shared rail + content renderers ── */

  const Rail = () => {
    const H = 320; // px between first and last dot (fixed so line + dots align)
    return (
      <div className="relative w-12 shrink-0 self-center" style={{ height: `${H}px` }}>
        {/* track */}
        <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-white/[0.1]" aria-hidden="true" />
        {/* fill — scaleY with scroll progress */}
        <div
          className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px origin-top -translate-x-1/2 bg-gradient-to-b from-[#8b7cf6] to-[#22d3ee]"
          style={{ transform: `translateX(-50%) scaleY(${lineScale})`, transition: 'transform 120ms linear' }}
          aria-hidden="true"
        />
        {/* dots, evenly spaced top→bottom */}
        {STEPS.map((s, i) => {
          const on = pinned ? i <= active : true;
          const top = 16 + (i * (H - 32)) / (count - 1); // 16px inset both ends
          return (
            <div
              key={s.id}
              className={`absolute left-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border font-mono text-[10px] font-semibold transition-all duration-300 ${
                on
                  ? 'border-cyan-300/60 bg-[#0b0d18] text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                  : 'border-white/[0.12] bg-[#0b0d18] text-white/30'
              }`}
              style={{ top: `${top}px` }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    );
  };

  const StepText = ({ step, index }) => {
    const on = pinned ? index === active : true;
    return (
      <div
        className={`transition-all duration-500 ${pinned ? (on ? 'opacity-100' : 'opacity-25') : 'opacity-100'}`}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">{step.eyebrow}</div>
        <h3 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">{step.title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">{step.desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {step.chips.map((c) => (
            <span key={c} className="rounded-full border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/50">
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section id="journey" className="relative px-4 py-20 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">
            The loop, step by step
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            From your rules{' '}
            <span className="gradient-shimmer">to the pattern.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Scroll — the line fills as the loop runs. Four steps, one review loop.
          </p>
        </div>

        {/* Desktop: pinned scrollytelling */}
        {pinned ? (
          <div ref={trackRef} className="relative mt-10" style={{ height: `${count * 80}vh` }}>
            <div className="sticky top-0 flex h-screen items-center">
              <div className="flex w-full items-center gap-8">
                <Rail />
                <div className="grid flex-1 items-center gap-12 lg:grid-cols-2">
                  {/* Step text — absolutely stacked so only the active one shows
                      and the pinned panel never grows past the viewport */}
                  <div className="relative h-[300px] sm:h-[280px]">
                    {STEPS.map((s, i) => (
                      <div
                        key={s.id}
                        className={`absolute inset-0 transition-all duration-500 ${
                          i === active
                            ? 'translate-y-0 opacity-100'
                            : 'pointer-events-none translate-y-4 opacity-0'
                        }`}
                      >
                        <StepText step={s} index={i} />
                      </div>
                    ))}
                  </div>
                  {/* Mockup panel — crossfades by active step */}
                  <div className="relative self-center h-[380px] w-full max-w-md lg:max-w-none">
                    {STEPS.map((s, i) => {
                      const Mock = MOCKS[s.id];
                      const on = i === active;
                      return (
                        <div
                          key={s.id}
                          className={`absolute inset-0 transition-all duration-500 ${
                            on ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
                          }`}
                        >
                          <div className="product-mockup relative h-full rounded-2xl border border-white/[0.09] bg-[#0a0c16]/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
                            <Mock />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Mobile / reduced-motion: stacked, no pin, no rail */
          <div className="mt-12">
            <div className="space-y-12">
              {STEPS.map((s, i) => {
                const Mock = MOCKS[s.id];
                return (
                  <div key={s.id} className="space-y-5" data-reveal style={{ '--reveal-delay': `${i * 60}ms` }}>
                    <StepText step={s} index={i} />
                    <div className="rounded-2xl border border-white/[0.09] bg-[#0a0c16]/95 p-5">
                      <Mock />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
