export default function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-10 sm:py-28" data-reveal>
      <div
        className="absolute right-[-12rem] top-20 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.06),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div>
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[#8b7cf6]">
            Propol AI Coach
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
            It doesn&apos;t analyze the market.
            <br />
            <span className="text-cyan-300">It analyzes you.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
            Propol reads your journal, your emotions, and your rulebook — then
            shows you the mistake you couldn&apos;t see, with the evidence
            attached. No financial advice. No signals. Just your own data, made
            honest.
          </p>
          <ul className="mt-7 space-y-3.5 text-sm text-white/60">
            {[
              'Recurring-mistake detection across every trade you log',
              'One focus rule per week — specific and measurable',
              'Monthly reviews scored on discipline, never P&L',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] text-[10px] text-cyan-300">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Real Propol AI Coach screenshot */}
        <div className="product-mockup relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0a0c16]/95 shadow-[0_28px_90px_rgba(0,0,0,0.5)]" data-reveal style={{ '--reveal-delay': '120ms' }}>
          <img
            src="/landing/ai-coach.webp"
            alt="Propol AI Coach growth plan showing recurring mistakes, emotion heatmap, action plan, and Propol's notes"
            className="block h-auto w-full"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
