import { gradientBtn } from '@/components/landing/LandingData';
import Link from 'next/link';

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

/* ── Step mockups (stylized placeholders) ── */

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

/**
 * JourneySection — reliable vertical timeline. NO sticky-pin, NO scroll math.
 * A connecting line runs down the left; each step reveals on scroll via the
 * existing [data-reveal] IntersectionObserver. Works on every device/browser.
 */
export default function JourneySection() {
  return (
    <section id="journey" className="relative px-4 py-20 sm:px-10 sm:py-24">
      <div
        className="absolute left-1/2 top-0 -z-10 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

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
            Four steps, one review loop — the line connects them all the way down.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connecting line down the center (desktop) / left (mobile) */}
          <div
            className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-[#8b7cf6]/50 via-cyan-300/40 to-emerald-300/40 sm:left-1/2 sm:-translate-x-1/2"
            aria-hidden="true"
          />

          <div className="space-y-16 sm:space-y-20">
            {STEPS.map((step, i) => {
              const Mock = MOCKS[step.id];
              const leftSide = i % 2 === 0;
              return (
                <div key={step.id} className="relative" data-reveal style={{ '--reveal-delay': `${i * 40}ms` }}>
                  {/* Node dot on the line */}
                  <div className="absolute left-5 top-2 z-10 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-cyan-300/40 bg-[#0b0d18] font-display text-sm font-bold text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.3)] sm:left-1/2">
                    {i + 1}
                  </div>

                  <div className={`grid items-center gap-8 pl-14 sm:pl-0 sm:grid-cols-2 sm:gap-12 ${leftSide ? '' : ''}`}>
                    {/* Text — alternates sides on desktop */}
                    <div className={leftSide ? 'sm:order-1 sm:pr-8 sm:text-right' : 'sm:order-2 sm:pl-8'}>
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">{step.eyebrow}</div>
                      <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{step.title}</h3>
                      <p className={`mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-base ${leftSide ? 'sm:ml-auto' : ''}`}>
                        {step.desc}
                      </p>
                      <div className={`mt-4 flex flex-wrap gap-2 ${leftSide ? 'sm:justify-end' : ''}`}>
                        {step.chips.map((c) => (
                          <span key={c} className="rounded-full border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/50">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mockup — opposite side */}
                    <div className={leftSide ? 'sm:order-2 sm:pl-8' : 'sm:order-1 sm:pr-8'}>
                      <div className="product-mockup relative rounded-2xl border border-white/[0.09] bg-[#0a0c16]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                        <Mock />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal node */}
          <div className="relative mt-16 flex sm:justify-center" data-reveal>
            <div className="ml-5 sm:ml-0 sm:-translate-x-0 flex -translate-x-1/2 items-center gap-3 rounded-full border border-emerald-300/30 bg-emerald-300/[0.06] px-5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              <span className="text-sm font-semibold text-emerald-200">The loop runs every week</span>
            </div>
          </div>
        </div>

        <div className="mt-14 text-center" data-reveal>
          <Link
            href="/login?mode=signup"
            className="cta-glow inline-block rounded-xl px-8 py-3.5 text-sm font-semibold text-[#070710] transition-transform hover:-translate-y-0.5 sm:text-base"
            style={gradientBtn}
          >
            Start your loop →
          </Link>
        </div>
      </div>
    </section>
  );
}
