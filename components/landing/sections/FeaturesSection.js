const PILLARS = [
  {
    label: 'Journal',
    title: '30-second trade logging',
    description:
      'Pair, setup, emotions, screenshot. Fast enough that you actually do it — detailed enough that the patterns are real.',
    color: '#22d3ee',
  },
  {
    label: 'Rulebook',
    title: 'Your rules, made measurable',
    description:
      'Write the setups you trust and the guardrails you keep breaking. Adherence becomes a number you can move.',
    color: '#8b7cf6',
  },
  {
    label: 'Coach',
    title: 'Weekly focus, monthly review',
    description:
      'Propol finds the recurring mistake, sets one focus rule, and scores your follow-through. Evidence, not vibes.',
    color: '#34d399',
  },
  {
    label: 'Prop firms',
    title: 'The full journey in one place',
    description:
      'Challenge costs, account phases, payouts, real ROI per firm. Know what the prop path actually costs you.',
    color: '#fbbf24',
  },
];

const PHILOSOPHY_POINTS = [
  {
    title: 'Manual logging forces reflection',
    description:
      'Typing the trade yourself means reliving the decision. That 30-second pause is where behavior change happens. Auto-import skips the only moment that matters.',
  },
  {
    title: 'Your broker credentials stay yours',
    description:
      'We never ask for your MT4/MT5 login or API keys. No third-party sync touches your funded account. Zero attack surface.',
  },
  {
    title: 'Rich data beats more data',
    description:
      'Every manually logged trade carries emotions, notes, and a setup tag. That context is what makes AI coaching actually useful.',
  },
];

export default function FeaturesSection() {
  return (
    <>
      {/* ═══════════════ WHAT'S INSIDE ═══════════════ */}
      <section className="relative px-4 py-24 sm:px-10" data-reveal>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
              What&apos;s inside
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Four pieces.{' '}
              <span className="gradient-shimmer">One loop.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {PILLARS.map((pillar, index) => (
              <div
                key={pillar.title}
                className="landing-card rounded-2xl border border-white/[0.08] bg-white/[0.028] p-7"
                data-reveal
                style={{ '--reveal-delay': `${index * 80}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: pillar.color }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                    {pillar.label}
                  </span>
                </div>
                <h3 className="mt-3.5 font-display text-lg font-bold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/55">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY MANUAL ENTRY ═══════════════ */}
      <section className="px-4 pb-24 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.028] p-8 sm:p-12">
            <div className="max-w-2xl">
              <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
                Our philosophy
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Why we don&apos;t connect to your broker
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
                Every other journal wants to auto-import your trades. We
                deliberately don&apos;t — because the logging is where the
                discipline is built.
              </p>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {PHILOSOPHY_POINTS.map((point, index) => (
                <div key={point.title} data-reveal style={{ '--reveal-delay': `${index * 80}ms` }}>
                  <h3 className="font-display text-sm font-bold text-white">
                    {point.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
