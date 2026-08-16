import { SectionLabel, Reveal, AnimatedNumber } from '@/components/landing/motion';

/** SECTION 06 — TRADING DASHBOARD: floating metric modules over animated curve. */
export function DashboardSection() {
  const metrics = [
    { label: 'DISCIPLINE', value: 82, tone: 'text-lime-300' },
    { label: 'WIN RATE', value: 62, suffix: '%', tone: 'text-[#f5f5f2]' },
    { label: 'AVG R', value: 0.72, prefix: '+', suffix: 'R', tone: 'text-lime-300', decimals: true },
    { label: 'RULE ADHERENCE', value: 91, suffix: '%', tone: 'text-[#f5f5f2]' },
  ];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><SectionLabel>THE DASHBOARD / 06</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            Your story, told in data.
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <div className="relative mt-14 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0d12]/60 p-8 backdrop-blur">
            {/* animated equity curve behind */}
            <svg viewBox="0 0 400 100" className="absolute inset-0 h-full w-full opacity-[0.14]" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,80 L40,74 L80,78 L120,60 L160,64 L200,48 L240,52 L280,36 L320,30 L360,20 L400,12" fill="none" stroke="#a3e635" strokeWidth="1.5" />
            </svg>
            <div className="relative grid grid-cols-2 gap-5 sm:grid-cols-4">
              {metrics.map((m, i) => (
                <Reveal key={m.label} delay={i * 110}>
                  <div className="rounded-xl border border-white/[0.07] bg-[#050507]/70 p-4 backdrop-blur">
                    <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">{m.label}</div>
                    <div className={`mt-2 font-display text-3xl font-extrabold ${m.tone}`}>
                      {m.decimals
                        ? <>{m.prefix}{m.value}{m.suffix}</>
                        : <AnimatedNumber value={m.value} prefix={m.prefix || ''} suffix={m.suffix || ''} />}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="relative mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/[0.06] pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              <span>Computed from your trades</span>
              <span className="text-lime-300/70">No spreadsheets</span>
              <span>No guessing</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 07 — DISCIPLINE: circular score + 4 dimensions fill. */
export function DisciplineSection() {
  const dims = [
    { label: 'DISCIPLINE', pct: 82 },
    { label: 'PSYCHOLOGY', pct: 78 },
    { label: 'PERFORMANCE', pct: 85 },
    { label: 'EXECUTION', pct: 91 },
  ];
  const C = 2 * Math.PI * 54;
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal><SectionLabel>DISCIPLINE / 07</SectionLabel></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
              Profit is an outcome.
              <br />
              <span className="gradient-shimmer">Discipline is the system.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#858995]">
              PropLogAI doesn&apos;t just track P&amp;L. It measures how you
              trade — across discipline, psychology, performance, and execution.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-8 space-y-4">
              {dims.map((d, i) => (
                <div key={d.label}>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em]">
                    <span className="text-white/45">{d.label}</span>
                    <span className="text-lime-300/80">{d.pct}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#a3e635] to-[#34d399]" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} dir="left">
          <div className="relative mx-auto grid h-72 w-72 place-items-center">
            <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
              <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle cx="64" cy="64" r="54" fill="none" stroke="url(#discGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${0.82 * C} ${C}`} />
              <defs>
                <linearGradient id="discGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a3e635" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-6xl font-extrabold text-[#f5f5f2]">
                <AnimatedNumber value={82} />
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">/ 100 discipline</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 08 — RULEBOOK: rules as a programmable system. */
export function RulebookSection() {
  const flow = ['SETUP', 'ENTRY CONDITION', 'RISK', 'EXECUTION', 'RESULT'];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><SectionLabel>RULEBOOK / 08</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            Write your rules. Then let your trades prove whether you followed them.
          </h2>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-14 rounded-2xl border border-white/[0.08] bg-[#0c0d12]/60 p-8 backdrop-blur">
            {/* rule engine flow */}
            <div className="flex flex-wrap items-center gap-3">
              {flow.map((f, i) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/75">
                    {f}
                  </div>
                  {i < flow.length - 1 && <span className="text-lime-300/60">→</span>}
                </div>
              ))}
            </div>
            {/* verdicts */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-lime-300/20 bg-lime-300/[0.05] px-4 py-3">
                <span className="font-mono text-[10px] text-white/70">A+ breakout · risk 1%</span>
                <span className="font-mono text-[10px] font-bold text-lime-300">RULE FOLLOWED ✓</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-rose-300/20 bg-rose-300/[0.05] px-4 py-3">
                <span className="font-mono text-[10px] text-white/70">No setup · moved stop</span>
                <span className="font-mono text-[10px] font-bold text-rose-300">RULE BROKEN ×</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 09 — P&L CALENDAR: floating lit calendar. */
export function PnLCalendarSection() {
  const days = [
    'g','g','r','g','n','g','g','r','g','n','g','r','g','g',
    'n','g','g','r','g','g','n','g','r','g','g','n','g','g',
  ];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-2">
        <div>
          <Reveal><SectionLabel>P&amp;L CALENDAR / 09</SectionLabel></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
              See the pattern at a glance.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#858995]">
              A month of behavior in one grid. Winning days, losing days, and the
              streaks in between — instantly visible.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 font-mono text-[10px] text-white/60">
              <span className="text-white/35">Day 14 · </span>
              <span className="text-lime-300">3 rules kept</span>
              <span className="text-white/35"> · discipline </span>
              <span className="text-lime-300">91</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} dir="left">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12]/70 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              <span>June 2026</span>
              <span className="text-lime-300/70">Adherence view</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-md transition-transform hover:scale-110 ${
                    d === 'g' ? 'bg-lime-300/30 shadow-[0_0_8px_rgba(163,230,53,0.2)]' :
                    d === 'r' ? 'bg-rose-400/30' :
                    'bg-white/[0.05]'
                  }`}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between font-mono text-[9px] text-white/35">
              <span>Green = rules kept</span>
              <span>Red = rule break</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** SECTION 10 — PROP FIRM JOURNEY: account lifecycle nodes. */
export function PropJourneySection() {
  const stages = ['CHALLENGE', 'PHASE 1', 'PHASE 2', 'FUNDED', 'PAYOUT'];
  const accounts = [
    { firm: 'FTMO $200K', state: 'FUNDED ✓', tone: 'text-lime-300 border-lime-300/25 bg-lime-300/[0.06]' },
    { firm: 'TFT $100K', state: 'PHASE 2', tone: 'text-cyan-300 border-cyan-300/25 bg-cyan-300/[0.06]' },
    { firm: 'MYFUNDEDFX $50K', state: 'BREACHED', tone: 'text-rose-300 border-rose-300/25 bg-rose-300/[0.06]' },
  ];
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal><SectionLabel>PROP JOURNEY / 10</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            The whole prop journey, in one place.
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-12 flex flex-wrap items-center gap-2">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white/60">{s}</span>
                {i < stages.length - 1 && <span className="text-lime-300/50">→</span>}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {accounts.map((a, i) => (
            <Reveal key={a.firm} delay={i * 100}>
              <div className={`rounded-xl border p-5 ${a.tone}`}>
                <div className="font-mono text-xs font-semibold text-white/85">{a.firm}</div>
                <div className="mt-2 font-mono text-[10px] font-bold uppercase tracking-wider">{a.state}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** SECTION 11 — REAL ROI: money flow. */
export function ROIFlowSection() {
  return (
    <section className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal><SectionLabel className="mx-auto w-fit">REAL ROI / 11</SectionLabel></Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-[#f5f5f2] sm:text-5xl">
            Measure the economics of the whole journey.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#858995]">
            Not just trading P&amp;L — challenge fees, activations, renewals,
            and payouts. The real return on your prop path.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-12 grid gap-4 sm:grid-cols-4">
            {[
              { label: 'INVESTED', value: '$4,470', tone: 'text-[#f5f5f2]' },
              { label: 'PAYOUTS', value: '$8,240', tone: 'text-lime-300' },
              { label: 'NET', value: '+$3,770', tone: 'text-lime-300' },
              { label: 'ROI', value: '+84.3%', tone: 'text-lime-300' },
            ].map((s, i) => (
              <div key={s.label} className="relative rounded-xl border border-white/[0.08] bg-[#0c0d12]/60 p-5 backdrop-blur">
                <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/35">{s.label}</div>
                <div className={`mt-2 font-display text-2xl font-extrabold ${s.tone}`}>{s.value}</div>
                {i < 3 && <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-lime-300/50 sm:block">→</span>}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
