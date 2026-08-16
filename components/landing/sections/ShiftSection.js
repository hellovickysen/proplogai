// The Shift — 3-step narrative adapted from tradersjournal's "See / Test / Prove"
// re-framed in PropLogAI discipline language: See the breach → AI finds the pattern → Measurable adherence.
// Includes a signature vertical ticker of discipline events.

const TICKER = [
  'Rule break: position size', 'No-setup trade', 'Revenge entry', 'SL moved',
  'Good SL', 'Setup followed', 'Journal logged', 'No-setup trade',
  'Rule break: daily loss limit', 'Setup followed', 'Good SL', 'Revenge entry',
];

export default function ShiftSection() {
  return (
    <section id="how-it-works" className="relative px-4 py-24 sm:px-10" data-reveal>
      <div className="mx-auto max-w-5xl">

        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
            The fix is visibility
          </div>
        </div>

        <h2 className="text-center font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
          PropLogAI doesn&apos;t judge.
          <br />
          <span className="gradient-shimmer">It shows you the breach.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-white/55">
          Log the trade. Propol finds the pattern. You see the rule you keep breaking — and a measurable discipline score that moves when you change. That&apos;s it.
        </p>

        {/* Three steps */}
        <div className="mt-16 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {[
            { n: '1', icon: '⚡', t: 'Log the breach', d: 'Quick Log in 30 seconds — pair, direction, P&L, setup, emotions. The act of typing it is where reflection happens.' },
            { n: '2', icon: '✦', t: 'Propol finds the pattern', d: 'Your AI coach reads your journal, your emotions, your rulebook adherence — and names the leak repeating across trades.' },
            { n: '3', icon: '🎯', t: 'Measurable adherence', d: 'A discipline score that rises when you follow your rules. Streaks, badges, and a 30-day programme that turns one fix into a habit.' },
          ].map((s, i) => (
            <div key={i} className="relative" style={{ '--reveal-delay': `${i * 120}ms` }} data-reveal>
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(34,211,238,0.12))', border: '1px solid rgba(255,255,255,0.1)' }}>
                {s.icon}
              </div>
              <div className="font-mono text-xs text-white/35">Step {s.n}</div>
              <h3 className="mt-1 font-display text-lg font-bold">{s.t}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/50">{s.d}</p>
              {i < 2 && (
                <div className="mt-5 hidden font-mono text-[11px] text-white/20 sm:block">↓ next</div>
              )}
            </div>
          ))}
        </div>

        {/* Signature vertical ticker — adapted from tradersjournal's TRADE #N strip */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-white/8 bg-black/20" data-reveal>
          <div className="flex whitespace-nowrap py-4">
            <div className="flex shrink-0 items-center gap-6 px-3" style={{ animation: 'ticker-scroll 32s linear infinite' }}>
              {TICKER.concat(TICKER).map((t, i) => {
                const isBreach = /Rule break|No-setup|Revenge|SL moved/.test(t);
                return (
                  <span key={i} className={`inline-flex items-center gap-2 font-mono text-xs tracking-wider ${isBreach ? 'text-red-300/55' : 'text-emerald-300/55'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isBreach ? 'bg-red-400/60' : 'bg-emerald-400/60'}`} />
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
