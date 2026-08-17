/* Differentiation — journal vs PropLogAI. */
const ROWS = [
  ['Records trades', 'Understands trades'],
  ['Shows P&L', 'Shows behavior'],
  ['Static statistics', 'Actionable patterns'],
  ['Notes mistakes', 'Detects patterns'],
  ['Rules stored as text', 'Rules measured'],
  ['Review manually', 'AI-assisted review'],
  ['Tracks history', 'Tracks evolution'],
];

export default function DifferentiationSection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="text-center" data-reveal>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            A trading journal records your past.{' '}
            <span className="gradient-shimmer">PropLogAI helps you improve your future.</span>
          </h2>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a14]" data-reveal>
          <div className="grid grid-cols-2 border-b border-white/[0.08] bg-white/[0.02]">
            <p className="px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-white/35">Traditional journal</p>
            <p className="border-l border-white/[0.08] px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-violet-300/60">PropLogAI</p>
          </div>
          {ROWS.map(([oldWay, newWay], i) => (
            <div key={oldWay} className={`grid grid-cols-2 ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`} data-reveal style={{ '--reveal-delay': `${i * 50}ms` }}>
              <p className="px-6 py-4 text-sm text-white/40">{oldWay}</p>
              <p className="border-l border-white/[0.08] px-6 py-4 text-sm font-medium text-white/85">{newWay}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
