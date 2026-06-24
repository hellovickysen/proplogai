import Link from 'next/link';
import { HeroParticles, LandingMotion } from '@/components/landing/LandingMotion';
import { createClient } from '@/lib/supabase/server';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };
const redGlow = { textShadow: '0 0 40px rgba(248,113,113,0.3)' };

const BETA_LIMIT = 500;

function BetaBar({ count }) {
  const pct = Math.min(100, (count / BETA_LIMIT) * 100);
  const remaining = Math.max(0, BETA_LIMIT - count);
  const barColor = count >= 480 ? 'linear-gradient(120deg, #f87171, #ef4444)'
    : count >= 400 ? 'linear-gradient(120deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(120deg, #a78bfa, #22d3ee)';
  const dotColor = count >= 480 ? 'bg-red-400' : count >= 400 ? 'bg-amber-400' : 'bg-emerald-300';
  const textColor = count >= 480 ? 'text-red-300' : count >= 400 ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <span className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_10px_rgba(52,211,153,0.7)]`} />
          Beta spots filling up
        </span>
        <span className={`font-mono text-sm font-bold ${textColor}`}>{remaining} left</span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + '%', background: barColor }} />
      </div>
      <div className="mt-2 text-center font-mono text-xs text-white/40">{count} / {BETA_LIMIT} traders joined</div>
    </div>
  );
}

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
  { icon: '🤖', title: 'Telegram bot', desc: 'Log trades from Telegram. \"/log XAU/USD long +$145\" and done. No app needed.', coming: true },
  { icon: '🌐', title: 'Cross-user intelligence', desc: 'See which mistakes and setups are trending across funded traders. Anonymized aggregate insights.', coming: true },
];

export default async function Home() {
  // Fetch beta counter from DB (falls back to 15 if table doesn't exist yet)
  let betaCount = 15;
  try {
    const supabase = createClient();
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'beta_count').maybeSingle();
    if (data && data.value) betaCount = parseInt(data.value, 10) || 15;
  } catch (e) {
    // Table may not exist yet — use default
  }

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
          <Link href="#pricing" className="text-sm text-white/60 hover:text-white">Pricing</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white">Log in</Link>
          <Link href="/login?mode=signup" className="cta-glow rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
            Start free →
          </Link>
        </div>
      </nav>

      {/* ═══════════════ HERO — NEGATIVE HOOK ═══════════════ */}
      <section className="hero-product-stage relative overflow-hidden px-6 pb-20 pt-16 sm:px-10 sm:pt-20">

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
          <BetaBar count={betaCount} />
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

      {/* ═══════════════ PRODUCT SHOWCASE ═══════════════ */}

      {/* Showcase 1: Dashboard — text left, mockup right */}
      <section className="px-6 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/8 px-3 py-1 text-[11px] font-semibold text-violet-200">
              Dashboard
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Your trading story,<br />told in numbers</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Win rate, profit factor, average R, equity curve — all computed automatically from your trades. No spreadsheets. No guessing.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Real-time equity curve tracks your growth', 'Weekly discipline score keeps you honest', 'Achievement badges reward consistency'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake dashboard mockup */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Dashboard overview</span>
              <span className="text-xs text-emerald-300">June 2026</span>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Win rate', val: '62%', color: 'text-emerald-400' },
                { label: 'Profit factor', val: '1.84', color: 'text-emerald-400' },
                { label: 'Avg R', val: '+0.72R', color: 'text-cyan-300' },
                { label: 'Total P&L', val: '+$2,847', color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-white/30">{s.label}</div>
                  <div className={`mt-1 font-display text-sm font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Fake equity curve */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/30 mb-3">Equity curve</div>
              <svg viewBox="0 0 400 80" className="w-full h-16" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(52,211,153,0.3)" />
                    <stop offset="100%" stopColor="rgba(52,211,153,0)" />
                  </linearGradient>
                </defs>
                <path d="M0,65 L30,60 L60,55 L90,58 L120,45 L150,48 L180,38 L210,42 L240,30 L270,28 L300,22 L330,18 L360,15 L400,10" fill="none" stroke="#34d399" strokeWidth="2" />
                <path d="M0,65 L30,60 L60,55 L90,58 L120,45 L150,48 L180,38 L210,42 L240,30 L270,28 L300,22 L330,18 L360,15 L400,10 L400,80 L0,80Z" fill="url(#eq)" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase 2: AI Coach — mockup left, text right */}
      <section className="px-6 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake AI coach report */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">AI Coach Report</span>
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200">2 patterns found</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-red-300/60">Recurring mistake #1</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">Revenge trading after back-to-back losses during London close. Cost you -3.8R this week.</p>
                </div>
                <span className="shrink-0 rounded-lg bg-red-400/12 px-2 py-1 text-xs font-bold text-red-300">-3.8R</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300/60">Recurring mistake #2</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">Moving stop loss on XAU/USD scalps. 4 of 6 losses this week had SL adjustments.</p>
                </div>
                <span className="shrink-0 rounded-lg bg-amber-400/12 px-2 py-1 text-xs font-bold text-amber-300">-1.6R</span>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/8 p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/60 mb-1">AI recommendation</div>
              <p className="text-xs leading-relaxed text-emerald-50/75">Set a hard rule: no new trades for 20 minutes after 2 consecutive losses. Your win rate after cool-down is 71% vs 34% without.</p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[11px] font-semibold text-cyan-200">
              AI Coach
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">The AI finds what<br />you can&apos;t see</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Every week, the AI analyzes your trades, finds recurring mistakes, ranks them by R lost, and tells you exactly how to fix them. No generic advice — just your data.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Per-trade grading with execution score', 'Weekly recurring mistake detection', 'Psychology insights with concrete guardrails'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Showcase 3: P&L Calendar — text left, mockup right */}
      <section className="px-6 py-20 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              P&L Calendar
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">See your patterns<br />at a glance</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">A visual monthly grid with daily P&L, weekly totals, and session tracking. Spot losing streaks, revenge days, and your best sessions instantly.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Color-coded daily P&L — green wins, red losses', 'Weekly summary totals on every row', 'Click any day to see all trades and journal entries'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake P&L calendar */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">June 2026</span>
              <span className="text-xs text-emerald-300">+$2,847</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['M','T','W','T','F','S','S'].map((d, i) => (
                <div key={i} className="text-center font-mono text-[9px] text-white/25 pb-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[
                null, null, '+$185', '-$90', '+$340', null, null,
                '+$220', '+$165', '-$45', '+$410', '-$120', null, null,
                '+$280', '-$195', '+$95', '+$375', '+$190', null, null,
                '+$145', '+$320', '-$80', '+$260', null, null, null,
              ].map((day, i) => {
                if (day === null) return <span key={i} className="h-10 rounded-lg bg-white/[0.02]" />;
                const isWin = day.startsWith('+');
                return (
                  <span key={i} className={`flex h-10 items-center justify-center rounded-lg text-[10px] font-mono font-semibold ${isWin ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
                    {day}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs">
              <span className="text-white/40">16 trades · 11 wins · 5 losses</span>
              <span className="font-mono font-semibold text-emerald-300">68.7% WR</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ USP: WHAT MAKES US DIFFERENT ═══════════════ */}
      <section className="px-6 pt-20 pb-6 sm:px-10" data-reveal>
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/8 px-4 py-1.5 text-xs font-semibold text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.85)]" />
            Features no other journal has
          </div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
            Built for <span style={gradientText}>prop firm traders</span> — not day traders
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/55">
            Generic journals track P&L. PropJournal tracks your entire prop firm journey — the costs, the wins, and the proof.
          </p>
        </div>
      </section>

      {/* Showcase 4: Expense Tracker — mockup left, text right */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake expense tracker mockup */}
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">Expense Tracker</span>
              <div className="flex gap-1.5">
                {['Dashboard', 'Accounts', 'Payouts'].map((tab, i) => (
                  <span key={tab} className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? 'bg-white/10 text-white/80' : 'text-white/30'}`}>{tab}</span>
                ))}
              </div>
            </div>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total invested', val: '$4,470', color: 'text-white' },
                { label: 'Total payouts', val: '$8,240', color: 'text-emerald-400' },
                { label: 'Net ROI', val: '+84.3%', color: 'text-emerald-400' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/8 bg-black/30 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-white/30">{s.label}</div>
                  <div className={`mt-1 font-display text-sm font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Accounts list */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-4">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/30 mb-3">Accounts</div>
              <div className="space-y-2.5">
                {[
                  { firm: 'FTMO', size: '$200K', cost: '$1,080', status: 'Funded', sc: 'text-emerald-300 bg-emerald-400/12 border-emerald-400/20' },
                  { firm: 'TFT', size: '$100K', cost: '$590', status: 'Phase 2', sc: 'text-cyan-300 bg-cyan-400/12 border-cyan-400/20' },
                  { firm: 'MyFundedFx', size: '$50K', cost: '$350', status: 'Breached', sc: 'text-red-300 bg-red-400/12 border-red-400/20' },
                  { firm: 'FTMO', size: '$100K', cost: '$540', status: 'Funded', sc: 'text-emerald-300 bg-emerald-400/12 border-emerald-400/20' },
                ].map((acc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-white/80">{acc.firm}</span>
                      <span className="font-mono text-[10px] text-white/30">{acc.size}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-white/40">{acc.cost}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${acc.sc}`}>{acc.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Latest payout */}
            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-300/15 bg-emerald-300/8 p-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/60">Latest payout</div>
                <div className="mt-0.5 text-sm font-bold text-emerald-300">$3,420 from FTMO</div>
              </div>
              <span className="text-xs text-emerald-300/50">Jun 15</span>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/8 px-3 py-1 text-[11px] font-semibold text-amber-200">
              Exclusive Feature
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Know your real ROI<br />across all prop firms</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Most traders have no idea how much they've actually spent on challenges. PropJournal tracks every fee, renewal, activation, and payout — so you always know if prop trading is profitable for you.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Track challenge fees, activations & renewals per firm', 'Log payouts with dates and notes', 'See per-firm ROI — know which firms actually pay', 'No other trading journal does this'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-amber-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Showcase 5: Verified Trading Story — text left, mockup right */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[11px] font-semibold text-cyan-200">
              Unique to PropJournal
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Your verified<br />trading story</h2>
            <p className="mt-4 text-sm leading-relaxed text-white/55">Share a public profile that proves your trading results with real data — not screenshots that could be faked. P&L calendar, trade history, payouts, and certificates. All verifiable.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/60">
              {['Public P&L calendar shows your consistency', 'Verified trade history with real numbers', 'Payout log proves you actually get paid', 'Trophy wall with payout certificates', 'You control exactly what\'s visible'].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" data-reveal style={{ '--reveal-delay': '120ms' }}>
            {/* Fake public profile mockup */}
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-[#08080f]" style={gradientBtn}>M</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">TraderMike</span>
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-300">Verified</span>
                </div>
                <span className="font-mono text-[10px] text-white/30">propjournal.com/profile/tmike</span>
              </div>
            </div>
            {/* Profile stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Win rate', val: '64%' },
                { label: 'Total P&L', val: '+$12.4K' },
                { label: 'Trades', val: '247' },
                { label: 'Payouts', val: '$8.2K' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/8 bg-black/30 p-2 text-center">
                  <div className="font-mono text-[8px] uppercase tracking-wider text-white/25">{s.label}</div>
                  <div className="mt-0.5 font-display text-[11px] font-bold text-emerald-300">{s.val}</div>
                </div>
              ))}
            </div>
            {/* Mini calendar */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-3 mb-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">P&L Calendar</span>
                <span className="font-mono text-[9px] text-emerald-300">+$2,847</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[
                  'g','r','g','g','','g','',
                  'g','g','r','g','r','','',
                  'g','g','g','r','g','','',
                ].map((d, i) => (
                  <span key={i} className={`h-4 rounded ${d === 'g' ? 'bg-emerald-400/30' : d === 'r' ? 'bg-red-400/30' : 'bg-white/[0.04]'}`} />
                ))}
              </div>
            </div>
            {/* Trophies */}
            <div className="rounded-xl border border-white/8 bg-black/20 p-3 mb-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-white/30 mb-2">Trophies</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { icon: '🏆', label: 'FTMO Funded' },
                  { icon: '💰', label: '$3.4K Payout' },
                  { icon: '🏆', label: 'TFT Phase 2' },
                ].map((t, i) => (
                  <span key={i} className="rounded-lg border border-amber-400/15 bg-amber-400/8 px-2 py-1 text-[9px] text-amber-200">{t.icon} {t.label}</span>
                ))}
              </div>
            </div>
            {/* Verified payouts */}
            <div className="rounded-xl border border-emerald-300/12 bg-emerald-300/6 p-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-emerald-300/50 mb-2">Verified Payouts</div>
              <div className="space-y-1.5">
                {[
                  { firm: 'FTMO', amount: '+$3,420', date: 'Jun 15' },
                  { firm: 'TFT', amount: '+$2,180', date: 'May 28' },
                  { firm: 'FTMO', amount: '+$2,640', date: 'May 10' },
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50">{p.firm}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-emerald-300">{p.amount}</span>
                      <span className="text-white/25">{p.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

      {/* ═══════════════ WHY MANUAL ENTRY ═══════════════ */}
      <section className="px-6 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/70">
              Our philosophy
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Why we don&apos;t connect to your broker
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/55">
              Every other journal wants to auto-import your trades. We deliberately don&apos;t. Here&apos;s why that makes PropJournal more effective.
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

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="px-6 py-20 sm:px-10" data-reveal>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
              Beta — all Pro features free for early adopters
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Simple pricing for <span style={gradientText}>serious traders</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-white/55">
              Start free. Upgrade when the AI becomes indispensable — and it will.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free tier */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <div className="font-mono text-xs uppercase tracking-wider text-white/40">Free</div>
              <div className="mt-2 font-display text-3xl font-bold">$0</div>
              <div className="mt-1 text-sm text-white/40">Forever</div>
              <Link href="/login?mode=signup" className="mt-6 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
                Start free →
              </Link>
              <ul className="mt-8 space-y-3">
                {['Unlimited trade logging', 'Journal entries with emotions & 1 screenshot/trade', 'P&L calendar (full)', 'Dashboard with basic stats', 'Playbook — up to 3 custom setups', 'Prop firm expense tracker', 'Public trader profile', 'Referral rewards', '3 AI trade analyses / month', '1 AI coach report / month'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                    <span className="mt-0.5 text-white/30">✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro tier */}
            <div className="relative rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.08] to-cyan-500/[0.03] p-8">
              <div className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold text-[#08080f]" style={gradientBtn}>MOST POPULAR</div>
              <div className="font-mono text-xs uppercase tracking-wider text-violet-300/60">Pro</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold" style={gradientText}>$9.99</span>
                <span className="text-sm text-white/40">/month</span>
              </div>
              <div className="mt-1 text-sm text-white/40">or $7.99/mo billed yearly ($95.88/yr)</div>
              <Link href="/login?mode=signup" className="cta-glow mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
                Start free — upgrade anytime →
              </Link>
              <ul className="mt-8 space-y-3">
                {['Everything in Free', 'Unlimited AI trade analysis', 'Unlimited AI coach reports', 'Email coach reports', 'CSV trade export', 'Shareable P&L cards', 'Advanced discipline stats & achievements', 'Trophy wall (unlimited uploads)', 'Unlimited screenshots per trade', 'Unlimited custom setups'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="mt-0.5 text-violet-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/30 mb-2">Coming soon</div>
                <ul className="space-y-2">
                  {['Telegram bot trade logging', 'Cross-user pattern intelligence'].map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-white/40">
                      <span className="mt-0.5 text-amber-400/50">◇</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Beta banner */}
          <div className="mt-10 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-6 text-center">
            <h3 className="font-display text-lg font-bold text-emerald-300">Early adopter? Everything is free right now.</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
              During the beta, all Pro features are unlocked for every user. Sign up now and you&apos;ll get early-adopter pricing when Pro launches.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="px-6 py-16 sm:px-10" data-reveal>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-2xl font-bold sm:text-3xl">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is the beta really free?', a: 'Yes. Every feature — including AI coaching — is free during the beta. No credit card required.' },
              { q: 'What happens when Pro launches?', a: 'Free tier stays free forever with the limits shown above. Beta users get early-adopter pricing on Pro.' },
              { q: 'Why no broker auto-import?', a: 'Deliberate choice. Manual logging forces you to reflect on every trade — the emotion, the setup, the decision. That reflection is where discipline is built. Auto-import skips it.' },
              { q: 'Is my trading data secure?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). We never ask for broker credentials and never sell your data.' },
              { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no commitments. Downgrade to Free anytime and keep all your trade data.' },
              { q: 'How is the AI coaching different from ChatGPT?', a: 'PropJournal\'s AI analyzes YOUR trades specifically — your patterns, your emotions, your setups. It\'s not generic advice. It finds the one mistake that keeps costing you money.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-display text-sm font-semibold">{faq.q}</h3>
                <p className="mt-1.5 text-sm text-white/50">{faq.a}</p>
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
          <BetaBar count={betaCount} />
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
