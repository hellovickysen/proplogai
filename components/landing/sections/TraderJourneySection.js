/* Trader journey — a vertical timeline of progression (server-rendered, robust). */
const MILESTONES = [
  { when: 'Day 1', quote: 'I just started journaling.' },
  { when: 'Week 1', quote: 'I can see my numbers.' },
  { when: 'Week 2', quote: 'I found my mistakes.' },
  { when: 'Month 1', quote: 'I understand my best setups.' },
  { when: 'Month 2', quote: 'I know when I break my rules.' },
  { when: 'Month 3', quote: 'I have a process.' },
];

export default function TraderJourneySection() {
  return (
    <section className="relative px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The journey</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            What improvement actually looks like.
          </h2>
        </div>

        <div className="relative mt-16">
          <div className="journey-line" aria-hidden="true" />
          <ol className="relative space-y-10">
            {MILESTONES.map((milestone, i) => (
              <li
                key={milestone.when}
                className={`relative flex ${i % 2 === 0 ? 'md:justify-start' : 'md:justify-end'} pl-14 md:pl-0`}
                data-reveal
                style={{ '--reveal-delay': `${i * 70}ms` }}
              >
                {/* node dot */}
                <span className="absolute left-[11px] top-1.5 grid h-4 w-4 place-items-center md:left-1/2 md:-translate-x-1/2" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-violet-400 bg-[#07070b] shadow-[0_0_12px_rgba(167,139,250,0.6)]" />
                </span>
                <div className={`w-full rounded-2xl border border-white/[0.08] bg-[#0a0a14] px-6 py-5 md:w-[calc(50%-2.5rem)] ${i % 2 === 0 ? '' : ''}`}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300/60">{milestone.when}</p>
                  <p className="mt-2 font-display text-lg font-semibold text-white/90">&ldquo;{milestone.quote}&rdquo;</p>
                </div>
              </li>
            ))}

            {/* Result */}
            <li className="relative pl-14 md:pl-0" data-reveal style={{ '--reveal-delay': '450ms' }}>
              <span className="absolute left-[9px] top-1.5 grid h-5 w-5 place-items-center md:left-1/2 md:-translate-x-1/2" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.8)]" />
              </span>
              <div className="mx-auto max-w-xl rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-400/[0.08] to-transparent px-7 py-6 text-center md:mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">The result</p>
                <p className="mt-3 font-display text-lg font-bold leading-snug sm:text-xl">
                  &ldquo;I&apos;m not hoping to be consistent by luck anymore. I&apos;m building consistency through process.&rdquo;
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
