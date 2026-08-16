// Real evidence — uses ACTUAL product screenshots committed to /public/landing/
// Each beat pairs one screenshot with a one-line insight. Storytelling, not a feature dump.
// Plain <img> (not next/image) to match the existing landing approach and avoid optimizer edge cases.
export default function EvidenceSection() {
  return (
    <>
      {/* Beat 1 — Dashboard / Rulebook discipline score */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.06] px-3 py-1 text-[11px] font-semibold text-violet-200">
              Your discipline, scored
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              One number tells you<br />if you&apos;re following your rules.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              A weekly Rulebook discipline score built from your journaling, your setup adherence, and your revenge-trading streak. No P&amp;L in the score — discipline isn&apos;t profit. It&apos;s whether you did what you said you&apos;d do.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Weekly score across journal, discipline, no-revenge, volume', 'Streaks that reward consistency, not just wins', 'Badges for habits that actually compound'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative" style={{ '--reveal-delay': '120ms' }} data-reveal>
            <div className="story-screenshot overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b14] shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/dashboard.png"
                alt="PropLogAI dashboard showing Net P&L, win rate, profit factor, and a weekly Rulebook discipline score of 85 broken down by journal, discipline, no-revenge, and volume"
                className="block w-full h-auto"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Beat 2 — AI Coach Growth Plan (mockup left, text right) */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1" style={{ '--reveal-delay': '120ms' }} data-reveal>
            <div className="story-screenshot overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b14] shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/ai-coach.png"
                alt="Propol AI Coach Growth Plan showing if you fix one thing insight, best habit, recurring mistakes ranked high to medium, an emotion heatmap with win rates, a 3-item action plan with impact and difficulty, and Propols notes"
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-1 text-[11px] font-semibold text-cyan-200">
              Propol AI Coach
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              Your coach names the leak<br />you couldn&apos;t see.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Propol reads your own journal and surfaces the recurring mistake costing you the most — then hands you a one-thing action plan with impact and difficulty. An emotion heatmap shows that <span className="text-white/80">FOMO entries have a 13% win rate</span> while disciplined ones hit 46%. Evidence, not advice.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['"If you fix one thing" — the single highest-impact change', 'Recurring mistakes ranked high / medium / low', 'Action plan with impact and difficulty ratings'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Beat 3 — Trophy Wall (text left, mockup right) */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[11px] font-semibold text-amber-200">
              Proof, not screenshots
            </div>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              Your funded story,<br />verified.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Upload payout certificates and funded-account wins to a trophy wall that backs your discipline with real documents — not cropped screenshots anyone could fake. Share a verified public profile that proves you actually get paid.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Payout certificates from every firm that paid you', 'Funded-account passes, challenge-by-challenge', 'A public profile that is verifiable by anyone'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-amber-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative" style={{ '--reveal-delay': '120ms' }} data-reveal>
            <div className="story-screenshot overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b14] shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/trophy-wall.png"
                alt="PropLogAI Trophy Wall showing 7 achievements earned — payout certificates from Fundedfirm, Phidias, DayTraders, Bulenox, and a FundingPips phase-one pass"
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
