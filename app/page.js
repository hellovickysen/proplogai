import Link from 'next/link';
import { HeroParticles, LandingMotion } from '@/components/landing/LandingMotion';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };
const redGlow = { textShadow: '0 0 40px rgba(248,113,113,0.3)' };

const PAIN_CARDS = [
  {
    icon: '🔥',
    title: 'You revenge trade after losses',
    desc: 'Two losses hit. You feel the tilt. You take a setup you know is trash — and give back the whole day. Again.',
    stat: '-$340',
    statLabel: 'avg cost per revenge day',
  },
  {
    icon: '🚫',
    title: 'You break your own rules',
    desc: 'You wrote the rules. You know the rules. Then the market moves and the rules disappear. Every. Single. Time.',
    stat: '67%',
    statLabel: 'of blown challenges are rule breaks',
  },
  {
    icon: '🔁',
    title: 'You can\'t see the pattern',
    desc: 'It\'s the same mistake wearing different setups. But without data, you\'ll repeat it until the next challenge fee.',
    stat: '3.2x',
    statLabel: 'avg times same leak repeats',
  },
];

const STATS = [
  { value: 85, suffix: '%', label: 'of prop challenges end in failure', sub: 'Not because of bad strategy. Because of untracked psychology.' },
  { value: 200, suffix: '+', prefix: '$', label: 'burned per failed challenge', sub: 'That\'s the price of repeating mistakes you can\'t see.' },
  { value: 1, suffix: '', label: 'pattern is costing you everything', sub: 'Most traders have one core leak. Find it or keep paying for it.' },
];

const FEATURES = [
  { icon: '✦', title: 'AI trade grading', desc: 'Every trade gets a brutal honest grade. Mistakes flagged. Execution scored. The one fix that matters — delivered instantly.', live: true },
  { icon: '🧠', title: 'Psychology tracking', desc: 'Tag emotions on every trade. See which feelings correlate with your worst days. Stop trading blind.', live: true },
  { icon: '📊', title: 'AI Coach reports', desc: 'Weekly deep-dive finds your recurring leaks, ranks them by R lost, and gives you concrete guardrails.', live: true },
  { icon: '📅', title: 'P&L calendar', desc: 'Visual monthly grid with daily P&L. Spot losing streaks, revenge days, and session patterns at a glance.', live: true },
  { icon: '☰', title: 'One-tap trade logging', desc: 'Pair, direction, session, setup, P&L — logged in 30 seconds. No excuses to skip it.', live: true },
  { icon: '📏', title: 'Playbook discipline', desc: 'Define your setups. Track if you followed them. The AI scores your discipline weekly and catches drift.', live: true },
  { icon: '🔍', title: 'Smart filters', desc: 'Filter by result, setup, emotion, session. Find exactly which patterns make or lose you money.', live: true },
  { icon: '💰', title: 'Expense tracker', desc: 'Track challenge fees, activation costs, renewals, and payouts. Know your real ROI across all prop firms.', live: true },
  { icon: '🏆', title: 'Trophy wall & proof', desc: 'Upload payout certificates and funded-account wins. Share verified proof pages with anyone.', live: true },
  { icon: '🔗', title: 'Public trader profile', desc: 'Share your verified trading story — calendar, trades, payouts, trophies — controlled from your settings.', live: true },
  { icon: '📤', title: 'Shareable P&L cards', desc: 'Download branded cards for social media. Dynamic quotes. Turn every green day into social proof.', live: true },
  { icon: '🎁', title: 'Referral rewards', desc: 'Invite traders. Earn credit when they build a real journaling habit. Everyone wins.', live: true },
  { icon: '🤖', title: 'Telegram bot', desc: 'Log trades from Telegram. "/log XAU/USD long +$145" and done. No app needed.', coming: true },
  { icon: '🌐', title: 'Cross-user intelligence', desc: 'See which mistakes and setups are trending across funded traders. Anonymized aggregate insights.', coming: true },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <LandingMotion />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ ...gradientBtn, boxShadow: '0 0 18px rgba(139,92,246,0.5)' }}>&#9670;</span>
          <span className="font-display text-lg font-bold tracking-tight">PropJournal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white">Log in</Link>
          <Link href="/login?mode=signup" className="cta-glow rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
            Start free →
          </Link>
        </div>
      </nav>

      {/* ═══════════════ HERO — NEGATIVE HOOK ═══════════════ */}
      <section className="hero-product-stage relative overflow-hidden px-6 pb-20 pt-16 sm:px-10 sm:pt-20">
        <HeroParticles />
        <div className="pointer-events-none absolute -left-40 top-10 h-[36rem] w-[36rem] rounded-full bg-red-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-20 h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl text-center" data-reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/8 px-4 py-1.5 text-xs font-semibold text-red-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.85)]" />
            85% of prop challenges fail for the same reason
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Still losing funded accounts{' '}
            <br className="hidden sm:block" />
            to the{' '}
            <span className="text-red-400" style={redGlow}>same three mistakes?</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            You don&apos;t have a strategy problem. You have a <strong className="text-white/90">psychology problem</strong> — and it&apos;s invisible until you track it. PropJournal&apos;s AI finds the one pattern costing you funded accounts.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login?mode=signup" className="cta-glow rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
              Find your blind spot — free →
            </Link>
            <Link href="#the-pattern" className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/72 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
              See the pattern ↓
            </Link>
          </div>

          <p className="mt-5 text-xs text-white/35">No credit card. No commitment. Takes 60 seconds.</p>
        </div>
      </section>

      {/* ═══════════════ PAIN AMPLIFICATION ═══════════════ */}
      <section id="the-pattern" className="px-6 py-20 sm:px-10">
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
      <section className="px-6 py-16 sm:px-10" data-reveal>
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

      {/* ═══════════════ SOLUTION REVEAL ═══════════════ */}
      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl text-center" data-reveal>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
            The fix is visibility
          </div>

          <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
            PropJournal doesn&apos;t judge.{' '}
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
                <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">AI Coach Report</div>
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
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/32">{stat.label}</div>
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
      <section id="how-it-works" className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Three steps to stop the cycle</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">60 seconds to log a trade. The AI does the rest.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { step: '1', icon: '☰', title: 'Log the trade', desc: 'Pair, direction, P&L, emotions, setup — 30 seconds. Add chart screenshots. No excuses.' },
              { step: '2', icon: '✦', title: 'AI finds the leak', desc: 'Instant grading. It flags what went wrong, what went right, and the one thing to fix right now.' },
              { step: '3', icon: '🎯', title: 'You see the pattern', desc: 'Calendar, filters, and weekly reports reveal the invisible loop. Now you can break it.' },
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

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
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
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Sound familiar?</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: '💸', who: 'Failing challenges?', desc: 'FTMO, TFT, MyFundedFx — doesn\'t matter which. If you keep breaching, the problem isn\'t the firm. It\'s the pattern you can\'t see.' },
              { emoji: '📉', who: 'Funded but leaking?', desc: 'You passed the challenge. Now you\'re slowly giving it back. PropJournal finds where your discipline drifts before your account does.' },
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

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="px-6 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 p-10 text-center shadow-[0_0_80px_rgba(34,211,238,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05))' }}>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Every failed challenge has a pattern.{' '}
            <span className="gradient-shimmer">Find yours.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55">
            Free beta — every feature is live. Be one of the first traders with AI coaching that actually finds what&apos;s costing you money.
          </p>
          <Link href="/login?mode=signup" className="cta-glow mt-8 inline-block rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
            Start free — find your blind spot →
          </Link>
          <p className="mt-3 text-xs text-white/30">No credit card. 60 seconds to start. Your funded account will thank you.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded text-[10px]" style={gradientBtn}>&#9670;</span>
            <span className="font-display text-sm font-semibold">PropJournal</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <Link href="/privacy" className="hover:text-white/50">Privacy</Link>
            <Link href="/terms" className="hover:text-white/50">Terms</Link>
            <span>Trading involves substantial risk of loss.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
