/* The problem — a visual loop that PropLogAI breaks. */
const LOOP_STEPS = [
  { label: 'Good setup appears', tone: 'text-white/70' },
  { label: 'Trade taken', tone: 'text-white/70' },
  { label: 'Emotion takes over', tone: 'text-amber-300/80' },
  { label: 'Rule broken', tone: 'text-red-300/90' },
  { label: 'Loss', tone: 'text-red-300/90' },
  { label: 'Same mistake repeated', tone: 'text-red-300/90' },
  { label: 'You forget why it happened', tone: 'text-white/50' },
];

export default function ProblemSection() {
  return (
    <section className="relative px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The real problem</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Your trading problem isn&apos;t always your strategy.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            Most traders don&apos;t lose because their setup is bad. They lose because the same emotional loop fires — and they can&apos;t see it happening.
          </p>
        </div>

        {/* The loop */}
        <div className="mt-14 grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <ol className="space-y-3" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {LOOP_STEPS.map((step, i) => (
              <li key={step.label} className="flex items-center gap-4">
                <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] font-mono text-xs text-white/40">
                  {i + 1}
                </span>
                <span className={`text-base font-medium ${step.tone}`}>{step.label}</span>
                {i < LOOP_STEPS.length - 1 && (
                  <span className="ml-4 hidden h-px flex-1 bg-white/[0.06] sm:block" aria-hidden="true" />
                )}
              </li>
            ))}
            <li className="flex items-center gap-4 pt-1">
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-red-400/30 bg-red-400/[0.06] font-mono text-xs text-red-300">↻</span>
              <span className="text-base font-semibold text-red-300">…and the loop starts again.</span>
            </li>
          </ol>

          {/* The break */}
          <div className="relative mx-auto w-full max-w-xs" data-reveal style={{ '--reveal-delay': '220ms' }}>
            <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.10] to-cyan-500/[0.04] p-7 text-center shadow-[0_0_60px_rgba(139,92,246,0.12)]">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#08080f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </div>
              <p className="font-display text-xl font-bold">PropLogAI breaks the loop.</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                It catches the breach the moment it&apos;s logged — and shows you the pattern before you repeat it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
