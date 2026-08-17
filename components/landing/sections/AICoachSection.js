/* AI Coach — insights emerging from real trading data, not a chat window. */
const PATTERNS = [
  { num: '01', title: 'Overtrading after losses', detail: 'You take 2.4x more trades in the hour after a losing trade.' },
  { num: '02', title: 'Best performance during London session', detail: 'Your highest expectancy setups cluster between 07:00–10:00 UTC.' },
  { num: '03', title: 'Setup A produces your highest expectancy', detail: 'London sweep + 1M ChoCh outperforms every other setup you trade.' },
];

export default function AICoachSection() {
  return (
    <section className="relative px-4 py-20 sm:px-10 sm:py-28">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] glow-violet" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The intelligence layer</p>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Your trading history is talking.{' '}
            <span className="gradient-shimmer">AI helps you listen.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            Propol reads your journal, your emotions, and your discipline — then surfaces the patterns you can&apos;t see yourself.
          </p>
        </div>

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Detected patterns */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a14] p-7" data-reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">AI detected 3 patterns</p>
            <div className="mt-6 space-y-5">
              {PATTERNS.map((pattern, i) => (
                <div key={pattern.num} className="flex gap-4" data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
                  <span className="font-mono text-sm font-bold text-violet-300/70">{pattern.num}</span>
                  <div>
                    <p className="text-[15px] font-semibold text-white/90">{pattern.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">{pattern.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 border-t border-white/[0.06] pt-4 font-mono text-[10px] uppercase tracking-widest text-white/25">
              Illustrative example — your coach works from your data
            </p>
          </div>

          {/* What to change */}
          <div className="ai-scan rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-cyan-500/[0.08] to-transparent p-7" data-reveal style={{ '--reveal-delay': '150ms' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/60">What to change</p>
            <p className="mt-5 font-display text-xl font-bold leading-snug">
              &ldquo;Limit yourself to one additional trade after a losing trade.&rdquo;
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Not a signal. Not advice. A specific, testable change to your process — suggested by the pattern in your own history.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <span className="text-xs text-white/50">Added to your Rulebook as a measurable rule</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
