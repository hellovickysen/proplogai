/* Discipline — the hero differentiator. A score dial with orbiting dimensions. */
const DIMENSIONS = [
  { label: 'Rule Adherence', value: 82 },
  { label: 'Risk Discipline', value: 76 },
  { label: 'Emotional Control', value: 64 },
  { label: 'Consistency', value: 71 },
  { label: 'Trade Quality', value: 79 },
  { label: 'Process Discipline', value: 88 },
];

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

export default function DisciplineScoreSection() {
  const score = 84;
  const scoreOffset = RING_C * (1 - score / 100);

  return (
    <section className="data-grid-bg relative px-4 py-20 sm:px-10 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-cyan" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The differentiator</p>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Your strategy isn&apos;t the only thing being measured.{' '}
            <span className="gradient-shimmer">Your behavior is too.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            PropLogAI doesn&apos;t just tell you whether you made money. It tells you <em className="not-italic text-white/85">how</em> you traded.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[auto_1fr]">
          {/* Score dial */}
          <div className="relative mx-auto" data-reveal>
            <svg width="260" height="260" viewBox="0 0 220 220" className="drop-shadow-[0_0_40px_rgba(34,211,238,0.15)]">
              <circle cx="110" cy="110" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
              <circle
                cx="110" cy="110" r={RING_R} fill="none"
                stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={RING_C} strokeDashoffset={RING_C}
                data-draw
                transform="rotate(-90 110 110)"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="font-display text-6xl font-extrabold"><span data-count-to={score}>0</span></div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/40">Discipline score</div>
              </div>
            </div>
          </div>

          {/* Orbiting dimension meters */}
          <div className="grid gap-4 sm:grid-cols-2">
            {DIMENSIONS.map((dim, i) => (
              <div key={dim.label} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4" data-reveal style={{ '--reveal-delay': `${i * 70}ms` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/70">{dim.label}</span>
                  <span className="font-mono text-sm font-bold text-white/85">{dim.value}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" data-bar>
                  <span className="block h-full rounded-full" style={{ width: `${dim.value}%`, background: 'linear-gradient(90deg,#a78bfa,#22d3ee)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
