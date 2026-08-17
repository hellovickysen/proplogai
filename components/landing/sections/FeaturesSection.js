/* Feature ecosystem — six meaningful systems, not a card dump. */
const SYSTEMS = [
  {
    name: 'Trade Journal',
    line: 'Log and understand every trade.',
    detail: 'One-tap logging with setup, emotion, and screenshot — so the evidence is always there when you review.',
  },
  {
    name: 'Performance Intelligence',
    line: 'Discover your real statistics and edge.',
    detail: 'Win rate, profit factor, expectancy, drawdown, and setup performance — calculated from your journal, not your memory.',
  },
  {
    name: 'AI Coach',
    line: 'Find the patterns you miss yourself.',
    detail: 'Propol reads your whole history and surfaces the recurring leaks costing you the most — with evidence.',
  },
  {
    name: 'Rulebook',
    line: 'Turn your trading plan into measurable behavior.',
    detail: 'Define your rules once. PropLogAI scores every trade against them and tracks your adherence over time.',
  },
  {
    name: 'Discipline',
    line: 'Track whether you actually follow your process.',
    detail: 'A single score that reflects rule adherence, risk control, and emotional consistency — not profit.',
  },
  {
    name: 'Trader Evolution',
    line: 'See your improvement over time.',
    detail: 'Streaks, milestones, and levels that measure the trader you\'re becoming, week after week.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">The system</p>
          <h2 className="mx-auto max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Six layers. One discipline system.
          </h2>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SYSTEMS.map((system, i) => (
            <div key={system.name} className="landing-card rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7" data-reveal style={{ '--reveal-delay': `${(i % 3) * 80}ms` }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300/50">0{i + 1}</p>
              <h3 className="mt-3 font-display text-xl font-bold text-white/90">{system.name}</h3>
              <p className="mt-1.5 text-[15px] font-medium text-white/70">{system.line}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/45">{system.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
