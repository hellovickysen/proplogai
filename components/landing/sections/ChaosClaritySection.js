/* Chaos → Clarity — the before/after visual. */
const CHAOS = ['TradingView', 'Broker statement', 'Excel sheet', 'Screenshots', 'Notes app', 'Memory', 'Random stats'];
const CLARITY = ['Trade', 'Journal', 'Analytics', 'Rules', 'AI Coach', 'Discipline', 'Improvement'];

export default function ChaosClaritySection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The shift</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            From chaos to clarity.
          </h2>
        </div>

        <div className="mt-16 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          {/* Before — scattered */}
          <div data-reveal>
            <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-red-300/60">Before</p>
            <div className="relative flex min-h-[280px] flex-wrap content-center items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8">
              {CHAOS.map((tool, i) => (
                <span
                  key={tool}
                  className="chaos-chip rounded-lg border border-white/[0.1] bg-[#0d0d16] px-4 py-2 text-sm text-white/55"
                  style={{
                    '--rot': `${(i % 2 === 0 ? 1 : -1) * (2 + i)}deg`,
                    '--dx': `${(i % 3 - 1) * 8}px`,
                    '--dy': `${(i % 2 === 0 ? -1 : 1) * 8}px`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                >
                  {tool}
                </span>
              ))}
              <p className="mt-4 w-full text-center text-xs text-white/30">Seven places. No single truth.</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden lg:block" data-reveal style={{ '--reveal-delay': '150ms' }} aria-hidden="true">
            <svg width="72" height="40" viewBox="0 0 72 40" fill="none">
              <path d="M4 20h56m0 0-10-10m10 10-10 10" stroke="url(#chaosGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="progress-path" data-draw />
              <defs>
                <linearGradient id="chaosGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* After — one system */}
          <div data-reveal style={{ '--reveal-delay': '200ms' }}>
            <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300/70">After</p>
            <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.07] to-transparent p-8 shadow-[0_0_60px_rgba(52,211,153,0.08)]">
              <p className="mb-5 text-center font-display text-lg font-bold">PropLogAI — one system</p>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2.5">
                {CLARITY.map((step, i) => (
                  <span key={step} className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-200/90">{step}</span>
                    {i < CLARITY.length - 1 && <span className="text-emerald-300/40">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
