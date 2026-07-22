const CAPABILITY_PILLARS = [
  {
    icon: '✦',
    label: 'Understand',
    title: 'AI Coach',
    description: 'Propol learns from your trading history to find the recurring mistakes and psychology patterns you cannot see alone.',
    capabilities: ['Per-trade analysis', 'Psychology patterns', 'Performance reviews'],
    accent: 'border-violet-300/20 bg-violet-300/[0.07] text-violet-200',
    dot: 'bg-violet-300',
  },
  {
    icon: '◎',
    label: 'Measure',
    title: 'Discipline System',
    description: 'Turn your rulebook into something measurable. Track adherence, score consistency, and reinforce better behavior.',
    capabilities: ['Rulebook adherence', 'Discipline score', 'Streaks and achievements'],
    accent: 'border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-200',
    dot: 'bg-cyan-300',
  },
  {
    icon: '▦',
    label: 'Control',
    title: 'Prop Firm Command Center',
    description: 'See the complete prop-firm picture—from challenge costs and account progress to payouts and real return on investment.',
    capabilities: ['Challenge and account tracking', 'Expenses, payouts, and ROI', 'P&L calendar'],
    accent: 'border-amber-300/20 bg-amber-300/[0.07] text-amber-200',
    dot: 'bg-amber-300',
  },
  {
    icon: '◇',
    label: 'Prove',
    title: 'Proof & Progress',
    description: 'Turn consistent behavior into visible progress with verified achievements, payout proof, and a trader story you control.',
    capabilities: ['Trophy wall and certificates', 'Public trader profile', 'Shareable P&L proof'],
    accent: 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200',
    dot: 'bg-emerald-300',
  },
];

const INCLUDED_TOOLS = ['30-second trade logging', 'Smart filters', 'Chart screenshots', 'Referral rewards'];

export default function FeaturesSection() {
  return (
    <>
      {/* ═══════════════ CAPABILITY PILLARS ═══════════════ */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-violet-200">
              Four connected systems
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
              Every capability works toward{' '}
              <span className="gradient-shimmer">better discipline.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
              Not a collection of journal features. One connected system for understanding behavior, measuring discipline, managing the prop-firm journey, and proving progress.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {CAPABILITY_PILLARS.map((pillar, index) => (
              <article key={pillar.title} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-6" style={{ '--reveal-delay': `${index * 90}ms` }} data-reveal>
                <div className="flex items-start justify-between gap-4">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl border font-mono text-lg ${pillar.accent}`} aria-hidden="true">
                    {pillar.icon}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">{pillar.label}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{pillar.description}</p>
                <ul className="mt-5 grid gap-2 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
                  {pillar.capabilities.map((capability) => (
                    <li key={capability} className="flex items-start gap-2 text-xs leading-relaxed text-white/[0.65]">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${pillar.dot}`} />
                      {capability}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5" data-reveal>
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">Also included</span>
            {INCLUDED_TOOLS.map((tool) => (
              <span key={tool} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHO IT'S FOR ═══════════════ */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Sound familiar?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: '💸', who: 'Failing challenges?', desc: 'FTMO, TFT, MyFundedFx — doesn\'t matter which. If you keep breaching, the problem isn\'t the firm. It\'s the pattern you can\'t see.' },
              { emoji: '📉', who: 'Funded but leaking?', desc: 'You passed the challenge. Now you\'re slowly giving it back. PropLogAI finds where your discipline drifts before your account does.' },
              { emoji: '⚡', who: 'Scalping blind?', desc: 'XAU/USD on the 5M chart? Your edge is speed, but your weakness is tilt. Track it or lose to it.' },
            ].map((p, i) => (
              <div key={i} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left" style={{ '--reveal-delay': `${i * 100}ms` }} data-reveal>
                <div className="mb-3 text-2xl">{p.emoji}</div>
                <h3 className="font-display text-sm font-bold text-white">{p.who}</h3>
                <p className="mt-2 text-xs text-white/50">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY MANUAL ENTRY ═══════════════ */}
      <section className="px-4 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70">
              Our philosophy
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Why we don&apos;t connect to your broker
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/55">
              Every other journal wants to auto-import your trades. We deliberately don&apos;t. Here&apos;s why that makes PropLogAI more effective.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10">
            <blockquote className="border-l-2 border-violet-400/50 pl-5 mb-8">
              <p className="text-base italic leading-relaxed text-white/75">
                &ldquo;The winning trader knows that the real edge isn&apos;t in the strategy — it&apos;s in the self-awareness to execute it consistently.&rdquo;
              </p>
              <cite className="mt-2 block text-sm font-semibold text-violet-300/70">— Mark Douglas, Trading in the Zone</cite>
            </blockquote>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-lg">🧠</div>
                <h3 className="font-display text-sm font-bold">Manual logging forces reflection</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">When you type the trade yourself, you&apos;re forced to relive it — the emotion, the setup, the decision. That 30-second pause is where behavior change happens. Auto-import skips the only moment that matters.</p>
              </div>
              <div>
                <div className="mb-2 text-lg">🔒</div>
                <h3 className="font-display text-sm font-bold">Your broker credentials stay yours</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">We never ask for your MT4/MT5 login, API key, or broker password. No third-party sync service has access to your funded account. Zero attack surface. Zero risk.</p>
              </div>
              <div>
                <div className="mb-2 text-lg">✦</div>
                <h3 className="font-display text-sm font-bold">The act of logging IS the therapy</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">Journaling isn&apos;t data entry — it&apos;s self-confrontation. Writing &ldquo;I revenge traded after two losses&rdquo; hits different than seeing it auto-imported in a spreadsheet. That discomfort is what builds discipline.</p>
              </div>
              <div>
                <div className="mb-2 text-lg">🎯</div>
                <h3 className="font-display text-sm font-bold">Quality over quantity</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">Auto-import dumps 50 trades with no context. Manual logging means every trade has emotions, notes, and a setup tag. That rich data is what makes the AI coaching actually useful.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
