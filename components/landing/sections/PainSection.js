import { PAIN_CARDS, STATS, gradientText, redGlow } from '@/components/landing/LandingData';

export default function PainSection() {
  return (
    <>
      {/* ═══════════════ PAIN AMPLIFICATION ═══════════════ */}
      <section id="the-pattern" className="px-4 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl text-center" data-reveal>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            The cycle that&apos;s <span className="text-red-400">bleeding your account</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">
            Every blown challenge follows the same invisible loop. You just can&apos;t see it — yet.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {PAIN_CARDS.map((card, i) => (
            <div key={i} className="group relative rounded-2xl border border-red-400/15 bg-red-400/[0.03] p-6 transition-colors hover:border-red-400/25 hover:bg-red-400/[0.05]" style={{ '--reveal-delay': `${i * 100}ms` }} data-reveal>
              <div className="mb-3 text-2xl">{card.icon}</div>
              <h3 className="font-display text-sm font-bold text-red-300">{card.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{card.desc}</p>
              <div className="mt-4 border-t border-white/8 pt-3">
                <div className="font-mono text-lg font-bold text-red-400">{card.stat}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">{card.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ COST STATS ═══════════════ */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <div key={i} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center" style={{ '--reveal-delay': `${i * 90}ms` }} data-reveal>
                <div className="font-display text-3xl font-extrabold" style={gradientText}>
                  {s.prefix}<span data-count-to={s.value} data-count-suffix={s.suffix}>0{s.suffix}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-white/80">{s.label}</div>
                <p className="mt-2 text-xs text-white/45">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
