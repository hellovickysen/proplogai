import Link from 'next/link';
import { gradientText, gradientBtn, redGlow, BETA_LIMIT } from '@/components/landing/LandingData';

function BetaBar({ count }) {
  const pct = Math.min(100, (count / BETA_LIMIT) * 100);
  const remaining = Math.max(0, BETA_LIMIT - count);
  const barColor = count >= 480 ? 'linear-gradient(120deg, #f87171, #ef4444)'
    : count >= 400 ? 'linear-gradient(120deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(120deg, #a78bfa, #22d3ee)';
  const dotColor = count >= 480 ? 'bg-red-400' : count >= 400 ? 'bg-amber-400' : 'bg-emerald-300';
  const textColor = count >= 480 ? 'text-red-300' : count >= 400 ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-6">
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

export default function HeroSection({ betaCount }) {
  return (
    <section className="hero-product-stage relative overflow-hidden px-4 pb-20 pt-16 sm:px-10 sm:pt-20">

      <div className="relative z-10 mx-auto max-w-4xl text-center" data-reveal>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/8 px-4 py-1.5 text-xs font-semibold text-red-200/90">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.85)]" />
          85% of prop challenges fail for the same reason
        </div>

        <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.6rem]">
          Still losing funded accounts{' '}
          <br className="hidden sm:block" />
          to the{' '}
          <span className="text-red-400" style={redGlow}>same three mistakes?</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          You don&apos;t have a strategy problem. You have a <strong className="text-white/90">psychology problem</strong> — and it&apos;s invisible until you track it. Propol, your AI Trading Performance Coach, finds the patterns costing you funded accounts — using only your own journal data.
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
  );
}
