import Link from 'next/link';
import { HeroParticles, LandingMotion } from '@/components/LandingMotion';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

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
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ ...gradientBtn, boxShadow: '0 0 18px rgba(139,92,246,0.5)' }}>&#9670;</span>
          <span className="font-display text-lg font-bold tracking-tight">PropJournal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/60 hover:text-white">Log in</Link>
          <Link href="/login?mode=signup" className="cta-glow rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
            Join the beta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 text-center sm:px-10 sm:pt-24">
        <HeroParticles />
        <div className="pointer-events-none absolute -left-32 -top-32 h-[60vw] w-[60vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2), transparent 60%)', filter: 'blur(60px)' }} />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-[50vw] w-[50vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15), transparent 60%)', filter: 'blur(50px)' }} />

        <div className="relative z-10 mx-auto max-w-3xl" data-reveal>
          <div className="mb-6 inline-block rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-200 shadow-[0_0_28px_rgba(167,139,250,0.18)]">
            Free beta — all live features unlocked
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            The journal that tells you{' '}
            <span className="gradient-shimmer">why you lose challenges.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            PropJournal is an AI-powered trading journal built for prop firm traders. Log trades, track your psychology, manage challenge expenses, showcase payouts, and get coaching that finds the one pattern costing you funded accounts.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/login?mode=signup" className="cta-glow rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
              Start journaling free →
            </Link>
            <Link href="/login" className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
              Log in
            </Link>
          </div>

          <p className="mt-4 text-xs text-white/35">No credit card required. Free during beta.</p>
        </div>
      </section>

      {/* Problem → Solution */}
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

      {/* How it works */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">How PropJournal works</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">Three steps to becoming a more disciplined trader.</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { step: '1', icon: '☰', title: 'Log your trade', desc: 'Pair, direction, session, setup — 30 seconds. Add emotions, notes, and chart screenshots.' },
              { step: '2', icon: '✦', title: 'Get AI coaching', desc: 'Instant grading. The AI flags exactly what went wrong, what went right, and the one thing to fix.' },
              { step: '3', icon: '📈', title: 'See your patterns', desc: 'Calendar, filters, and weekly reports reveal which setups, sessions, and emotions make or lose you money.' },
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

      {/* Features grid */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Everything you need to pass challenges</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/50">Core journaling, AI coaching, proof pages, payouts, and referral rewards are live. The next layer is automation and billing.</p>
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
              <div key={i} className="landing-card rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left" style={{ '--reveal-delay': `${i * 100}ms` }} data-reveal>
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
        <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 p-10 text-center shadow-[0_0_80px_rgba(34,211,238,0.08)]" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(34,211,238,0.05))' }}>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Stop guessing. <span className="gradient-shimmer">Start knowing.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55">
            Join the PropJournal beta — every live feature is free while we build. Be one of the first traders to get AI coaching that actually helps you pass challenges.
          </p>
          <Link href="/login?mode=signup" className="cta-glow mt-8 inline-block rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
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
