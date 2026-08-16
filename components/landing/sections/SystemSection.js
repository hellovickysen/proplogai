const NODES = [
  { label: 'Journal', desc: '30-second logging', angle: -90, color: '#22d3ee' },
  { label: 'Rulebook', desc: 'Your setups & guardrails', angle: 0, color: '#8b7cf6' },
  { label: 'AI Coach', desc: 'Pattern detection', angle: 90, color: '#34d399' },
  { label: 'Prop firms', desc: 'Costs & payouts', angle: 180, color: '#fbbf24' },
];

/**
 * Orbit visual: PropLogAI at the center, the four systems connected by
 * dashed orbit lines — the reference site's node-graph motif.
 */
function Orbit() {
  return (
    <div className="relative mx-auto mt-16 aspect-square w-full max-w-md" aria-hidden="true">
      {/* Orbit rings */}
      <div className="absolute inset-0 rounded-full border border-dashed border-white/[0.1]" />
      <div className="absolute inset-[18%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[36%] rounded-full border border-white/[0.04]" />

      {/* Center hub */}
      <div className="absolute left-1/2 top-1/2 z-10 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#8b7cf6]/30 bg-[#0b0d18] shadow-[0_0_60px_rgba(139,124,246,0.25)] sm:h-36 sm:w-36">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#8b7cf6] to-[#22d3ee] text-sm font-bold text-[#070710]">P</span>
        <span className="mt-2 font-display text-xs font-bold tracking-wide text-white">PROPLOGAI</span>
        <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-300/70">One loop</span>
      </div>

      {/* Orbit nodes */}
      {NODES.map((node) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = 50 + 50 * Math.cos(rad);
        const y = 50 + 50 * Math.sin(rad);
        return (
          <div
            key={node.label}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl border bg-[#0b0d18]/95 shadow-lg backdrop-blur"
                style={{ borderColor: `${node.color}55`, boxShadow: `0 0 24px ${node.color}22` }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: node.color }} />
              </div>
              <div className="rounded-md border border-white/[0.08] bg-black/50 px-2 py-1 text-center backdrop-blur">
                <div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-white/80">{node.label}</div>
                <div className="text-[8px] text-white/40">{node.desc}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SystemSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.06] bg-[#070912]/80 px-4 py-24 sm:px-10 sm:py-28" data-reveal>
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-[30rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,124,246,0.07),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
            One system
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Journal, rulebook, coach, prop firms —{' '}
            <span className="gradient-shimmer">one review loop.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            No switching between tools. Every trade you log feeds the coach,
            every rule you write feeds the score, every payout proves the journey.
          </p>
        </div>

        <Orbit />
      </div>
    </section>
  );
}
