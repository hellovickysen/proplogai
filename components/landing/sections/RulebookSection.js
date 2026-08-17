/* The Rulebook — rules become measurable behavior. */
const CHECK = [
  { label: 'Risk within limit', pass: true },
  { label: 'Approved setup', pass: true },
  { label: 'Entered after emotional trigger', pass: false },
];

export default function RulebookSection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The control layer</p>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Turn your trading rules into something you actually follow.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            Rules aren&apos;t useful because you wrote them down. They&apos;re useful because PropLogAI measures whether you follow them.
          </p>
        </div>

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-3">
          {/* Real Rulebook UI — the discipline guardrails */}
          <div className="story-screenshot overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-violet-950/20" data-reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/rulebook.png" alt="PropLogAI Rulebook — non-negotiable guardrails like daily loss limit, maximum lot size, and consecutive loss limit" loading="lazy" decoding="async" className="block w-full" />
          </div>

          {/* A trade is logged */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a14] p-6" data-reveal style={{ '--reveal-delay': '100ms' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Trade logged</p>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm">
                <span className="text-white/45">Pair</span><span className="font-semibold">XAU/USD</span>
              </div>
              <div className="flex justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm">
                <span className="text-white/45">Direction</span><span className="font-semibold text-emerald-300">Long</span>
              </div>
              <div className="flex justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm">
                <span className="text-white/45">Risk</span><span className="font-semibold">$85</span>
              </div>
              <div className="flex justify-between rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-4 py-2.5 text-sm">
                <span className="text-white/45">Emotion</span><span className="font-semibold text-amber-300">FOMO</span>
              </div>
            </div>
          </div>

          {/* Rulebook check */}
          <div className="ai-scan rounded-2xl border border-violet-400/20 bg-gradient-to-b from-violet-500/[0.08] to-transparent p-6" data-reveal style={{ '--reveal-delay': '200ms' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300/60">Rulebook check</p>
            <ul className="mt-5 space-y-3.5">
              {CHECK.map((item) => (
                <li key={item.label} className="rule-row text-sm">
                  <span className={`rule-ico ${item.pass ? 'rule-pass' : 'rule-fail'}`}>{item.pass ? '✓' : '✕'}</span>
                  <span className={item.pass ? 'text-white/75' : 'font-medium text-red-300'}>{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-white/[0.08] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/45">Discipline score</span>
                <span className="font-mono text-sm font-bold">
                  <span className="text-white/85">84</span>
                  <span className="mx-2 text-white/30">→</span>
                  <span className="text-red-300">78</span>
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/40">
                One emotional entry — measured, not judged. You&apos;ll see it in your next review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
