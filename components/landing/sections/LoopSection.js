const STEPS = [
  {
    number: '1',
    title: 'See the pattern',
    description:
      'You keep calling it bad luck. Your journal shows the real pattern — the same rule break wearing a different setup each time. Log a trade in 30 seconds; Propol connects it to the last six.',
    evidence: { label: 'Pattern surfaced', value: 'Revenge re-entry · 6× in 3 weeks', tone: 'rose' },
  },
  {
    number: '2',
    title: 'Get coached, not lectured',
    description:
      'Propol turns the pattern into one concrete focus rule for the week — specific, measurable, yours. No generic advice, no signals. Just the one change your own data points to.',
    evidence: { label: 'This week\u2019s focus', value: 'No re-entry for 20 min after 2 losses', tone: 'violet' },
  },
  {
    number: '3',
    title: 'Prove it over 30 days',
    description:
      'Your discipline score tracks only what you control: rule adherence and review follow-through. Watch the trend bend as the repeated mistake disappears. That\u2019s proof — not a lucky week.',
    evidence: { label: 'Day 14', value: 'Rule breaks 6 → 2 · Score 82', tone: 'emerald' },
  },
];

const toneStyles = {
  rose: 'border-rose-300/20 bg-rose-300/[0.05] text-rose-200',
  violet: 'border-[#8b7cf6]/25 bg-[#8b7cf6]/[0.06] text-[#c4b5fd]',
  emerald: 'border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200',
};

/** Outlined fanned trade cards — 3D stack like the reference site's trade deck. */
function TradeFan() {
  const cards = ['#47', '#48', '#49', '#50', '#51', '#52', '#53'];
  return (
    <div className="relative mx-auto mt-14 h-56 max-w-md sm:h-64" aria-hidden="true">
      {cards.map((id, i) => {
        const mid = (cards.length - 1) / 2;
        const offset = i - mid;
        const isFlagged = id === '#52';
        return (
          <div
            key={id}
            className={`absolute left-1/2 top-1/2 h-40 w-28 rounded-xl border backdrop-blur-sm transition-transform sm:h-48 sm:w-32 ${
              isFlagged
                ? 'border-rose-300/40 bg-rose-300/[0.06]'
                : 'border-white/[0.12] bg-white/[0.02]'
            }`}
            style={{
              transform: `translate(calc(-50% + ${offset * 34}px), calc(-50% + ${Math.abs(offset) * 6}px)) rotate(${offset * 7}deg)`,
              zIndex: i,
            }}
          >
            <div className="flex h-full flex-col justify-between p-3">
              <span className={`font-mono text-[9px] tracking-wider ${isFlagged ? 'text-rose-300' : 'text-white/35'}`}>
                TRADE {id}
              </span>
              {isFlagged ? (
                <div>
                  <div className="font-mono text-[8px] uppercase tracking-wider text-rose-300/70">Rule break</div>
                  <div className="mt-0.5 text-[10px] font-semibold leading-tight text-rose-200">
                    Moved stop-loss
                  </div>
                </div>
              ) : (
                <span className="font-mono text-[9px] text-white/20">·</span>
              )}
            </div>
          </div>
        );
      })}
      {/* Propol scanning callout */}
      <div className="absolute -right-2 top-2 z-20 rounded-lg border border-cyan-300/30 bg-[#0a0c16]/90 px-3 py-1.5 shadow-lg shadow-cyan-950/40 backdrop-blur">
        <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-300">Propol spotted #52</span>
      </div>
    </div>
  );
}

export default function LoopSection() {
  return (
    <section id="the-loop" className="relative overflow-hidden px-4 py-24 sm:px-10 sm:py-32">
      <div
        className="absolute left-1/2 top-0 -z-10 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        <div className="grid items-start gap-10 lg:grid-cols-2" data-reveal>
          <div>
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">
              Why us
            </div>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              See the pattern.
              <br />
              Break it.{' '}
              <span className="gradient-shimmer">Prove it held.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/50 sm:text-base lg:pt-16">
            Right now that&apos;s a journal, a spreadsheet, and willpower — three
            tabs, no context. Here it&apos;s one review loop: your trades go in,
            the pattern comes out.
          </p>
        </div>

        <TradeFan />

        <div className="mt-16 space-y-0">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="group relative grid gap-6 border-t border-white/[0.07] py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-12"
              data-reveal
              style={{ '--reveal-delay': `${index * 100}ms` }}
            >
              <span className="font-display text-6xl font-extrabold leading-none text-white/[0.08] transition-colors duration-300 group-hover:text-white/[0.16] sm:text-8xl">
                {step.number}
              </span>

              <div className="max-w-lg">
                <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
                  {step.description}
                </p>
              </div>

              <div className={`w-full max-w-xs rounded-2xl border p-4 ${toneStyles[step.evidence.tone]}`}>
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-70">
                  {step.evidence.label}
                </div>
                <div className="mt-1.5 text-sm font-semibold leading-snug">
                  {step.evidence.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-white/40" data-reveal>
          Not a trading challenge. A behavior system built around your own
          rulebook — where the score never touches your P&amp;L.
        </p>
      </div>
    </section>
  );
}
