/* Gamification / progression — the Monk Trader evolution, kept elegant. */
const STREAKS = [
  { label: 'Journal streak', value: 12, suffix: 'd' },
  { label: 'No-revenge streak', value: 6, suffix: 'd' },
  { label: 'Rules followed this week', value: 92, suffix: '%' },
];

const MILESTONES = [
  { name: 'First Reflection', desc: 'Log your first trade with an emotion tag', unlocked: true },
  { name: 'Pattern Spotter', desc: 'Review 10 trades in a single week', unlocked: true },
  { name: 'Rule Keeper', desc: '7 straight days with zero rule breaches', unlocked: true },
  { name: 'Process Builder', desc: 'A full month of consistent journaling', unlocked: false },
];

export default function ProgressionSection() {
  return (
    <section className="data-grid-bg px-4 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div data-reveal>
            <p className="section-eyebrow mb-4">The motivation layer</p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              You&apos;re not collecting points.
              <br />
              <span className="gradient-shimmer">You&apos;re building yourself as a trader.</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/55">
              Levels, streaks, and milestones track one thing only: whether you showed up and followed your process. The scoreboard is your discipline — never your P&amp;L.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {STREAKS.map((streak) => (
                <div key={streak.label} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
                  <p className="font-display text-2xl font-bold text-white/90">
                    <span data-count-to={streak.value} data-count-suffix={streak.suffix}>0{streak.suffix}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-white/40">{streak.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a14] p-7" data-reveal style={{ '--reveal-delay': '150ms' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Trader evolution</p>
            <ul className="mt-6 space-y-4">
              {MILESTONES.map((milestone) => (
                <li key={milestone.name} className="flex items-start gap-4">
                  <span
                    className={`mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border ${
                      milestone.unlocked
                        ? 'border-violet-400/30 bg-violet-500/[0.12] text-violet-300'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/25'
                    }`}
                    aria-hidden="true"
                  >
                    {milestone.unlocked ? '✦' : '◇'}
                  </span>
                  <div>
                    <p className={`text-[15px] font-semibold ${milestone.unlocked ? 'text-white/90' : 'text-white/40'}`}>{milestone.name}</p>
                    <p className="mt-0.5 text-sm text-white/40">{milestone.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>Level progress</span>
                <span className="font-mono">Disciplined · Level 4</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" data-bar>
                <span className="block h-full w-[68%] rounded-full" style={{ background: 'linear-gradient(90deg,#a78bfa,#22d3ee)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
