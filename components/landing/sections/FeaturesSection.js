import { FEATURES } from '@/components/landing/LandingData';

// Trimmed, story-aligned feature grid — not the old 14-card dump.
// Curated to the capabilities that back the discipline story told above.
export default function FeaturesSection() {
  // Keep the live ones that reinforce the narrative; drop duplicates already shown in Evidence.
  const featured = FEATURES.filter(f =>
    ['Propol trade analysis', 'Psychology tracking', 'Propol monthly review', 'P&L calendar', 'One-tap trade logging', 'Rulebook discipline', 'Smart filters', 'Expense tracker', 'Trophy wall & proof', 'Public trader profile', 'Shareable P&L cards', 'Referral rewards'].includes(f.title)
  );

  return (
    <section className="px-4 py-24 sm:px-10" data-reveal>
      <div className="mx-auto max-w-5xl">

        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-4 py-1.5 text-xs font-semibold text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.85)]" />
            Everything else
          </div>
        </div>

        <h2 className="text-center font-display text-3xl font-bold leading-tight sm:text-4xl">
          Built for the whole prop journey.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-center text-sm text-white/50">
          Logging is the evidence. Discipline is the goal. Here&apos;s everything that supports both.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((f, i) => (
            <div key={i} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-5" style={{ '--reveal-delay': `${(i % 6) * 70}ms` }} data-reveal>
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xl">{f.icon}</span>
                {f.coming ? (
                  <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Coming soon</span>
                ) : (
                  <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Live</span>
                )}
              </div>
              <h3 className="font-display text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
