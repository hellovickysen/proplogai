const PHASES = [
  {
    number: '01',
    days: 'Days 1–7',
    title: 'Build your rulebook',
    description: 'Define the setups you trust, record the rules you keep breaking, and establish your real discipline baseline.',
    outcomes: ['Your setup rules', 'Your behavior baseline', 'Your starting score'],
    color: 'violet',
  },
  {
    number: '02',
    days: 'Days 8–14',
    title: 'Expose the pattern',
    description: 'Propol connects your trades, emotions, and rule breaks to reveal the recurring mistake hiding behind different setups.',
    outcomes: ['Recurring mistakes', 'Psychology triggers', 'Evidence from your trades'],
    color: 'cyan',
  },
  {
    number: '03',
    days: 'Days 15–30',
    title: 'Build discipline that holds',
    description: 'Use discipline scores, behavior streaks, and performance reviews to reinforce the habits that protect funded accounts.',
    outcomes: ['Discipline score', 'Rule-following streaks', 'Better trading habits'],
    color: 'emerald',
  },
];

const colorStyles = {
  violet: {
    line: 'from-violet-400 to-violet-400/20',
    badge: 'border-violet-300/20 bg-violet-300/[0.08] text-violet-200',
    number: 'text-violet-300/60',
    dot: 'bg-violet-300',
  },
  cyan: {
    line: 'from-cyan-400 to-cyan-400/20',
    badge: 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200',
    number: 'text-cyan-300/60',
    dot: 'bg-cyan-300',
  },
  emerald: {
    line: 'from-emerald-400 to-emerald-400/20',
    badge: 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200',
    number: 'text-emerald-300/60',
    dot: 'bg-emerald-300',
  },
};

export default function ThirtyDaySystemSection() {
  return (
    <section id="30-day-system" className="relative border-y border-white/[0.06] bg-[#0b0b14]/[0.55] px-4 py-20 sm:px-10 sm:py-24" data-reveal>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">
            The 30-day discipline system
          </div>
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
            Thirty days. Three phases.{' '}
            <span className="gradient-shimmer">Discipline that holds.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            Trade logging is only the input. The system turns your own rules, behavior, and performance into a measurable discipline-building process.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PHASES.map((phase, index) => {
            const styles = colorStyles[phase.color];
            return (
              <article key={phase.number} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6" data-reveal style={{ '--reveal-delay': `${index * 110}ms` }}>
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${styles.line}`} />
                <div className="flex items-start justify-between gap-4">
                  <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.badge}`}>
                    {phase.days}
                  </span>
                  <span className={`font-mono text-3xl font-semibold ${styles.number}`}>{phase.number}</span>
                </div>

                <h3 className="mt-6 font-display text-lg font-bold text-white">{phase.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">{phase.description}</p>

                <div className="mt-6 border-t border-white/[0.08] pt-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">What changes</div>
                  <ul className="mt-3 space-y-2.5">
                    {phase.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-center gap-2.5 text-xs text-white/[0.65]">
                        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-white/40">
          Not a trading challenge. A behavior system built around your own rulebook and trading history.
        </p>
      </div>
    </section>
  );
}
