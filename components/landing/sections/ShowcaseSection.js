/* Product showcase — full-width beats with the real product UI. */
const BEATS = [
  {
    eyebrow: 'Your history',
    headline: 'Your entire trading history becomes measurable.',
    copy: 'Dashboard stats, equity curve, and the discipline score for the week — one glance tells you how you traded, not just what you made.',
    img: '/landing/dashboard.png',
    alt: 'PropLogAI dashboard with net P&L, win rate, profit factor, and weekly discipline score',
  },
  {
    eyebrow: 'Your patterns',
    headline: 'Your mistakes become patterns you can fix.',
    copy: 'Propol reads your journal and hands you a growth plan: the one thing to fix, your best habit, recurring mistakes, and an emotion heatmap.',
    img: '/landing/ai-coach.png',
    alt: 'Propol AI Coach growth plan with recurring mistakes, emotion heatmap, and action plan',
  },
  {
    eyebrow: 'Your progress',
    headline: 'Your progress becomes visible.',
    copy: 'Trophy wall, payout certificates, and funded-account milestones — the proof that the process is working, all in one place.',
    img: '/landing/trophy-wall.png',
    alt: 'PropLogAI trophy wall with payout certificates and funded account achievements',
  },
];

export default function ShowcaseSection() {
  return (
    <section className="px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl space-y-24">
        {BEATS.map((beat, i) => (
          <div
            key={beat.eyebrow}
            className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
          >
            <div data-reveal>
              <p className="section-eyebrow mb-4">{beat.eyebrow}</p>
              <h3 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">{beat.headline}</h3>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">{beat.copy}</p>
            </div>
            <div className="story-screenshot overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-950/30" data-reveal style={{ '--reveal-delay': '120ms' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={beat.img} alt={beat.alt} loading="lazy" decoding="async" className="block w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
