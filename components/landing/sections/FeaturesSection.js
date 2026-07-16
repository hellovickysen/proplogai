import { FEATURES } from '@/components/landing/LandingData';

export default function FeaturesSection() {
  return (
    <>
      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="px-4 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Everything you need to stop failing challenges</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">12 live features. Zero fluff. Built by a trader who was tired of paying for the same mistakes.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-5" style={{ '--reveal-delay': `${(i % 8) * 70}ms` }} data-reveal>
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
