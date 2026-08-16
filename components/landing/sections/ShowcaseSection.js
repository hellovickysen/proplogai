export default function ShowcaseSection() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015] px-4 py-20 sm:px-10 sm:py-24" data-reveal>
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[#8b7cf6]">
            Propol AI Coach
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            It doesn&apos;t analyze the market.
            <br />
            <span className="text-cyan-300">It analyzes you.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
            Propol reads your journal, your emotions, and your rulebook — then shows
            you the mistake you couldn&apos;t see, with the evidence attached.
            No financial advice. No signals. Just your own data, made honest.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-white/60">
            {[
              'Recurring-mistake detection across every trade you log',
              'One focus rule per week — specific and measurable',
              'Monthly reviews scored on discipline, not P&L',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 text-cyan-300">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Coach report mockup */}
        <div className="rounded-3xl border border-white/[0.07] bg-[#0a0a13] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              Weekly review
            </span>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200">
              2 patterns found
            </span>
          </div>

          <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.028] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-rose-300/60">
                  Recurring mistake #1
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Revenge re-entry after back-to-back losses at London close.
                  6 occurrences in 3 weeks.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-rose-400/10 px-2 py-1 font-mono text-xs font-bold text-rose-300">
                6×
              </span>
            </div>
          </div>

          <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.028] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300/60">
                  Recurring mistake #2
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Stop-loss moved on 4 of 6 losing XAU/USD scalps this week.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-amber-400/10 px-2 py-1 font-mono text-xs font-bold text-amber-300">
                4×
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300/60">
              Propol insight
            </div>
            <p className="text-xs leading-relaxed text-emerald-50/75">
              Your journal shows you follow your rules 91% of the time after a
              20-minute cool-down, vs 38% without. Next week&apos;s focus: take
              the pause.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
