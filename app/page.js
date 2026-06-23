import Link from 'next/link';
import { HeroParticles, LandingMotion } from '@/components/LandingMotion';

const gradientText = { background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' };

const FEATURES = [
  { icon: '☰', title: 'One-tap trade logging', desc: 'Pair, direction, session, P&L — logged in 30 seconds. Custom setups dropdown so you never type the same thing twice.', live: true },
  { icon: '🧠', title: 'Emotion & psychology tracking', desc: 'Tag how you felt on every trade. See which emotions correlate with your best and worst days.', live: true },
  { icon: '✦', title: 'AI trade analysis', desc: 'Every trade gets graded. The AI flags your specific mistakes, what went well, and the one fix that matters most.', live: true },
  { icon: '📊', title: 'AI Coach report', desc: 'Weekly cross-trade analysis finds your recurring leaks, ranks them by R lost, and gives you concrete psychology guardrails.', live: true },
  { icon: '📅', title: 'P&L calendar', desc: 'Visual monthly calendar with daily P&L, weekly totals, journal indicators, and session tracking. See your patterns at a glance.', live: true },
  { icon: '📤', title: 'Shareable P&L cards', desc: 'Download branded cards for Instagram Stories and Twitter with dynamic motivational quotes. Turn every green day into social proof.', live: true },
  { icon: '🔍', title: 'Smart filtering', desc: 'Filter trades by result, setup, emotion, and date range. Find exactly which patterns make or lose you money.', live: true },
  { icon: '📸', title: 'Chart screenshots', desc: 'Attach multiple chart screenshots per trade with a fullscreen lightbox. Your visual trade record.', live: true },
  { icon: '💰', title: 'Prop firm expense tracker', desc: 'Track challenge fees, activation costs, renewals, payouts, and ROI across all your prop firms.', live: true },
  { icon: '🏆', title: 'Trophy wall', desc: 'Upload payout certificates, challenge passes, and funded-account wins. Share public trophies with clean proof pages.', live: true },
  { icon: '🔗', title: 'Public trader profile', desc: 'Share your verified trading story with optional calendar, trades, payouts, and trophies controlled from settings.', live: true },
  { icon: '🎁', title: 'Referral rewards', desc: 'Invite other traders with your personal link and earn beta referral credit when they build a real journaling habit.', live: true },
  { icon: '📏', title: 'Trading rules engine', desc: 'Define your rules. The AI checks every trade against them and flags violations before they cost you a challenge.', coming: true },
  { icon: '🌐', title: 'Cross-user pattern intelligence', desc: 'Anonymous aggregate insights will show which mistakes and setups are trending across funded traders.', coming: true },
  { icon: '💳', title: 'Stripe subscriptions', desc: 'Pro plans, billing controls, and referral-credit redemption will arrive once the beta feature set is ready.', coming: true },
  { icon: '🤖', title: 'Telegram bot', desc: 'Log trades from Telegram without opening the app. "/log XAU/USD long +$145" and done.', coming: true },
];

const STATS = [
  { value: 85, suffix: '%', label: 'of prop firm challenges fail', sub: 'Most failures are discipline failures, not strategy failures.' },
  { value: 200, suffix: '+', prefix: '$', label: 'per failed challenge', sub: 'The cost of repeating the same mistakes without knowing what they are.' },
  { value: 1, suffix: '', label: 'pattern to fix', sub: 'Most traders have one core leak. PropJournal\'s AI finds it.' },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <LandingMotion />

      {/* Nav */}
      <div className="relative z-30 px-4 pt-4 sm:px-10">
        <nav className="pj-nav-shell mx-auto flex max-w-7xl items-center justify-between rounded-[1.7rem] px-4 py-3 sm:px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm shadow-inner">&#8734;</span>
            <span>
              <span className="block font-display text-sm font-bold leading-none">PropJournal</span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">Trader Intelligence</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {['Tools', 'Playbook', 'Proof', 'Pricing'].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-amber-300/20 bg-amber-300/8 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/80 lg:inline-flex">Free beta</span>
            <Link href="/login" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition hover:text-white sm:inline-flex">Sign In</Link>
            <Link href="/login?mode=signup" className="pj-btn-primary rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5">
              Start Free
            </Link>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="pj-shell relative overflow-hidden px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <HeroParticles />
        <div className="pointer-events-none absolute -left-40 top-8 h-[34rem] w-[34rem] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-24 h-[32rem] w-[32rem] rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="pt-6 text-center lg:text-left" data-reveal>
            <div className="pj-label mb-7">AI trading journal and prop firm intelligence</div>

            <h1 className="font-display text-5xl font-bold leading-[0.96] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Find the pattern costing you <span className="pj-hero-word">funded accounts.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/62 sm:text-lg lg:mx-0">
              PropJournal is an AI-powered trading journal built for prop firm traders. Log trades, track your psychology, manage challenge expenses, showcase payouts, and get coaching that finds the one pattern costing you funded accounts.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/login?mode=signup" className="pj-btn-primary rounded-full px-8 py-3.5 text-base font-bold transition-transform hover:-translate-y-0.5">
                Start journaling free
              </Link>
              <Link href="#how-it-works" className="pj-btn-secondary rounded-full px-8 py-3.5 text-base font-semibold transition">
                Watch workflow
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
              {['Prop firm tracking', 'AI coach reports', 'Payout proof', 'No card needed'].map((chip) => (
                <span key={chip} className="pj-chip px-3 py-2">{chip}</span>
              ))}
            </div>

            <div className="pj-card pj-card-warm mt-8 hidden max-w-xl rounded-[1.6rem] p-5 sm:block">
              <div className="grid grid-cols-[7rem_1fr] items-center gap-5">
                <div className="pj-radar relative h-28 rounded-2xl border border-white/10">
                  <span className="pj-radar-orbit h-20 w-28" style={{ '--orbit-rotate': '-18deg' }} />
                  <span className="pj-radar-orbit h-16 w-24" style={{ '--orbit-rotate': '28deg' }} />
                  <span className="pj-radar-dot left-[62%] top-[35%]" />
                  <span className="pj-radar-dot left-[34%] top-[61%]" />
                </div>
                <div className="space-y-3 font-mono text-sm font-semibold uppercase tracking-[0.16em] text-white/72">
                  <div>Discipline</div>
                  <div>Setup quality</div>
                  <div>Risk control</div>
                  <div>Trust + psychology</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative" data-reveal style={{ '--reveal-delay': '120ms' }}>
            <div className="pj-card pj-card-warm relative overflow-hidden rounded-[2rem] p-4 lg:p-5">
              <div className="pj-radar relative min-h-[340px] overflow-hidden rounded-[1.5rem] border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="pj-label !px-3 !py-2 !text-[10px]">Live coaching engine</span>
                  <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/80">Signal locked</span>
                </div>

                <div className="absolute left-1/2 top-1/2 h-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/18" />
                <div className="absolute left-1/2 top-1/2 h-28 w-72 -translate-x-1/2 -translate-y-1/2 rotate-[-16deg] rounded-full border border-amber-300/28" />
                <div className="absolute left-[55%] top-[45%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/35 blur-xl" />

                <div className="absolute right-5 top-24 rounded-2xl border border-white/10 bg-[#070b17]/85 p-4 shadow-xl backdrop-blur-xl">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Risk</div>
                  <div className="mt-2 font-display text-3xl font-bold text-white">On</div>
                  <div className="text-xs font-semibold text-amber-200">Confirmed</div>
                </div>

                <div className="absolute bottom-5 left-5 rounded-2xl border border-white/10 bg-[#070b17]/85 p-4 shadow-xl backdrop-blur-xl">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">Discipline</div>
                  <div className="mt-2 font-display text-3xl font-bold text-white">82</div>
                  <div className="text-xs font-semibold text-emerald-300">Rising</div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Pattern', value: 'Revenge' },
                  { label: 'Leak', value: '-$200' },
                  { label: 'Fix', value: '20m pause' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-black/22 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">{item.label}</div>
                    <div className="mt-2 font-display text-xl font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pj-card mt-4 rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200">Coach velocity</div>
                  <p className="mt-2 text-sm leading-6 text-white/64">Turn scattered trades, emotions, screenshots, and prop firm costs into one clear action plan.</p>
                </div>
                <div className="hidden items-center gap-2 font-mono text-sm font-bold sm:flex">
                  <span className="rounded-xl bg-white/[0.06] px-3 py-2 text-white">Guessing</span>
                  <span className="text-amber-300">→</span>
                  <span className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-amber-100">Knowing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {STATS.map((s, i) => (
              <div key={i} className="landing-card pj-card rounded-[1.5rem] p-6 text-center" style={{ '--reveal-delay': `${i * 90}ms` }} data-reveal>
                <div className="font-display text-3xl font-extrabold text-amber-300">
                  {s.prefix}<span data-count-to={s.value} data-count-suffix={s.suffix}>0{s.suffix}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-white/80">{s.label}</div>
                <p className="mt-2 text-xs text-white/45">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">How PropJournal works</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">Three steps to becoming a more disciplined trader.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { step: '1', icon: '☰', title: 'Log your trade', desc: 'Pair, direction, session, setup — 30 seconds. Add emotions, notes, and chart screenshots.' },
              { step: '2', icon: '✦', title: 'Get AI coaching', desc: 'Instant grading. The AI flags exactly what went wrong, what went right, and the one thing to fix.' },
              { step: '3', icon: '📈', title: 'See your patterns', desc: 'Calendar, filters, and weekly reports reveal which setups, sessions, and emotions make or lose you money.' },
            ].map((s, i) => (
              <div key={i} className="landing-card pj-card rounded-[1.5rem] p-6" style={{ '--reveal-delay': `${i * 110}ms` }} data-reveal>
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl text-xl" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(47,216,255,0.10))', border: '1px solid rgba(255,255,255,0.1)' }}>
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

      {/* Features grid */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Everything you need to pass challenges</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">Core journaling, AI coaching, proof pages, payouts, and referral rewards are live. The next layer is automation and billing.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-card pj-card rounded-[1.4rem] p-5" style={{ '--reveal-delay': `${(i % 8) * 70}ms` }} data-reveal>
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

      {/* Who is this for */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Built for prop firm traders</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { emoji: '🎯', who: 'Challenge takers', desc: 'Doing FTMO, TFT, or MyFundedFx? Track every challenge, find your leaks, and stop paying for the same mistakes twice.' },
              { emoji: '📊', who: 'Funded traders', desc: 'Protect your funded account by understanding exactly which setups and sessions keep you profitable.' },
              { emoji: '🧠', who: 'Serious scalpers', desc: 'Trading XAU/USD on the 5-minute chart? Your edge is discipline. PropJournal makes it measurable.' },
            ].map((p, i) => (
              <div key={i} className="landing-card pj-card rounded-[1.5rem] p-6 text-left" style={{ '--reveal-delay': `${i * 100}ms` }} data-reveal>
                <div className="mb-3 text-2xl">{p.emoji}</div>
                <h3 className="font-display text-sm font-semibold">{p.who}</h3>
                <p className="mt-2 text-xs text-white/50">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 sm:px-10" data-reveal>
        <div className="pj-card pj-card-warm mx-auto max-w-2xl rounded-[1.8rem] p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05))' }}>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Stop guessing. <span className="gradient-shimmer">Start knowing.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55">
            Join the PropJournal beta — every live feature is free while we build. Be one of the first traders to get AI coaching that actually helps you pass challenges.
          </p>
          <Link href="/login?mode=signup" className="pj-btn-primary mt-8 inline-block rounded-full px-8 py-3.5 text-base font-bold transition-transform hover:-translate-y-0.5">
            Join the beta — it's free →
          </Link>
          <p className="mt-3 text-xs text-white/30">No credit card. No commitment. Just better trading.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded text-[10px]" style={gradientBtn}>&#9670;</span>
            <span className="font-display text-sm font-semibold">PropJournal</span>
          </div>
          <p className="text-xs text-white/30">
            PropJournal is an educational tool, not financial advice. Trading involves substantial risk of loss.
          </p>
        </div>
      </footer>
    </main>
  );
}
