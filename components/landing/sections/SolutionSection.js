import { gradientText, gradientBtn } from '@/components/landing/LandingData';

export default function SolutionSection() {
  return (
    <>
      {/* ═══════════════ SOLUTION REVEAL ═══════════════ */}
      <section className="px-4 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl text-center" data-reveal>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
            The fix is visibility
          </div>

          <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
            PropLogAI doesn&apos;t judge.{' '}
            <span className="gradient-shimmer">It shows you.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/55 sm:text-base">
            Log your trades. The AI finds the pattern. You see the mistake you couldn&apos;t see before. That&apos;s it. No lectures — just data.
          </p>
        </div>

        {/* Product mockup */}
        <div className="relative mx-auto mt-12 max-w-2xl" data-reveal style={{ '--reveal-delay': '120ms' }}>
          <div className="product-mockup relative rounded-[2rem] border border-white/12 bg-[#0b0b14]/85 p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">Propol AI Review</div>
                <div className="mt-1 font-display text-lg font-bold text-white">Pattern detected</div>
              </div>
              <div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">Action needed</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/55">Your blind spot</div>
                      <p className="mt-2 text-sm leading-relaxed text-white/78">You give back profits after two consecutive losses — mostly during London close.</p>
                    </div>
                    <span className="rounded-xl bg-red-400/12 px-2.5 py-1 text-xs font-bold text-red-300">-2.4R</span>
                  </div>
                  <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/8 p-3 text-xs leading-relaxed text-emerald-50/75">
                    <strong className="text-emerald-200">Fix:</strong> Stop trading 20 min after back-to-back losses. Only take A+ setups with screenshot proof.
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Win rate', value: '57%' },
                    { label: 'Discipline', value: '82' },
                    { label: 'Payouts', value: '$1.2k' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/32">{stat.label}</div>
                      <div className="mt-1 font-display text-lg font-bold text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">P&L calendar</span>
                    <span className="text-xs text-emerald-300">+$420</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {['', '', 'g', 'r', 'g', '', 'g', 'r', 'g', 'g', '', 'r', 'g', ''].map((day, i) => (
                      <span key={i} className={`h-6 rounded-md ${day === 'g' ? 'bg-emerald-400/35' : day === 'r' ? 'bg-red-400/35' : 'bg-white/[0.07]'}`} />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Emotion tags</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['FOMO', 'No setup', 'Revenge', 'Tilt'].map((tag) => (
                      <span key={tag} className="rounded-full border border-red-300/20 bg-red-300/10 px-2.5 py-1 text-[11px] text-red-100">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card floating-card-one hidden rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100 shadow-2xl shadow-red-950/20 backdrop-blur-xl sm:block">
            ⚠️ Revenge pattern: 3 days this week
          </div>
          <div className="floating-card floating-card-two hidden rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:block">
            ✓ Setup followed: 8-day streak
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Three steps to stop the cycle</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">60 seconds to log a trade. Propol does the rest.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { step: '1', icon: '☰', title: 'Log the trade', desc: 'Pair, direction, P&L, emotions, setup — 30 seconds. Add chart screenshots. No excuses.' },
              { step: '2', icon: '✦', title: 'Propol finds the leak', desc: 'Instant scoring across discipline, psychology, performance, and execution — evidence from your own journal.' },
              { step: '3', icon: '🎯', title: 'You see the pattern', desc: 'Monthly reviews, insights, and progress tracking reveal the invisible loop. Now you can break it.' },
            ].map((s, i) => (
              <div key={i} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-6" style={{ '--reveal-delay': `${i * 110}ms` }} data-reveal>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl text-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(34,211,238,0.15))', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {s.icon}
                </div>
                <div className="font-mono text-xs text-white/40">Step {s.step}</div>
                <h3 className="mt-1 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/50">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
