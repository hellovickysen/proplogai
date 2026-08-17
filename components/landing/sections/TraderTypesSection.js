/* Who it's for — three trader profiles, one system. */
const PROFILES = [
  {
    name: 'Beginner',
    promise: 'Build good habits before bad ones become expensive.',
    detail: 'Start with the journal and the Rulebook. Learn to review every trade while the stakes are small.',
  },
  {
    name: 'Developing Trader',
    promise: 'Find the patterns hiding inside your trading history.',
    detail: 'You have trades. Now get the truth — setup performance, emotional leaks, and the mistakes on repeat.',
  },
  {
    name: 'Prop Trader',
    promise: 'Measure your process, risk, and consistency with precision.',
    detail: 'Daily loss limits, rule adherence, and discipline scoring built for the pressure of funded accounts.',
  },
];

export default function TraderTypesSection() {
  return (
    <section className="data-grid-bg px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center" data-reveal>
          <p className="section-eyebrow mb-4">Who it&apos;s for</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            One system. Every stage of the journey.
          </h2>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PROFILES.map((profile, i) => (
            <div key={profile.name} className="landing-card flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8" data-reveal style={{ '--reveal-delay': `${i * 90}ms` }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet-300/50">{profile.name}</p>
              <p className="mt-4 font-display text-xl font-bold leading-snug text-white/90">&ldquo;{profile.promise}&rdquo;</p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-white/50">{profile.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
