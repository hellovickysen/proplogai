const STEPS = [
  {
    number: '1',
    title: 'See the pattern',
    description:
      'You keep calling it bad luck. Your journal shows the real pattern — the same rule break, wearing a different setup each time. Log the trade in 30 seconds; Propol connects it to the last six.',
    evidence: { label: 'Pattern surfaced', value: 'Revenge re-entry · 6× in 3 weeks' },
  },
  {
    number: '2',
    title: 'Get coached, not lectured',
    description:
      'Propol turns the pattern into one concrete focus rule for the week — specific, measurable, yours. No generic advice, no signals. Just the one behavior change your own data points to.',
    evidence: { label: 'This week\u2019s focus', value: 'No re-entry for 20 min after 2 losses' },
  },
  {
    number: '3',
    title: 'Prove it over 30 days',
    description:
      'Your discipline score tracks only what you control: rule adherence and review consistency. Watch the trend bend as the repeated mistake disappears. That\u2019s the proof — not a lucky week.',
    evidence: { label: 'Day 14', value: 'Rule breaks: 6 → 2 · Score 82' },
  },
];

export default function LoopSection() {
  return (
    <section id="the-loop" className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center" data-reveal>
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300/70">
            How it works
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
            See the pattern. Break it.
            <br />
            <span className="bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] bg-clip-text text-transparent">
              Prove it held.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            One review loop — no switching between a journal, a spreadsheet, and
            willpower. Your trades go in, the pattern comes out.
          </p>
        </div>

        <div className="mt-16 space-y-0">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="group relative grid gap-6 border-t border-white/[0.07] py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-12 sm:py-12"
              data-reveal
              style={{ '--reveal-delay': `${index * 100}ms` }}
            >
              <span className="font-display text-6xl font-extrabold leading-none text-white/[0.08] transition-colors duration-300 group-hover:text-white/[0.14] sm:text-8xl">
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

              <div className="w-full max-w-xs rounded-2xl border border-white/[0.07] bg-white/[0.028] p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  {step.evidence.label}
                </div>
                <div className="mt-1.5 text-sm font-semibold leading-snug text-white/85">
                  {step.evidence.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p
          className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-white/40"
          data-reveal
        >
          Not a trading challenge. A behavior system built around your own
          rulebook — where the score never touches your P&L.
        </p>
      </div>
    </section>
  );
}
