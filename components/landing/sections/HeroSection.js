import Link from 'next/link';
import { gradientBtn, BETA_LIMIT } from '@/components/landing/LandingData';

function BetaBar({ count }) {
  const pct = Math.min(100, (count / BETA_LIMIT) * 100);
  const remaining = Math.max(0, BETA_LIMIT - count);
  const barColor = count >= 480 ? 'linear-gradient(120deg, #f87171, #ef4444)'
    : count >= 400 ? 'linear-gradient(120deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(120deg, #a78bfa, #22d3ee)';
  const dotColor = count >= 480 ? 'bg-red-400' : count >= 400 ? 'bg-amber-400' : 'bg-emerald-300';
  const textColor = count >= 480 ? 'text-red-300' : count >= 400 ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-6">
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
    <section className="hero-product-stage relative overflow-hidden px-4 pb-24 pt-12 sm:px-10 sm:pt-16">

      <div className="relative z-10 mx-auto max-w-5xl">

        {/* Eyebrow */}
        <div className="mb-7 flex justify-center" data-reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/[0.06] px-4 py-1.5 text-xs font-semibold text-red-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.85)]" />
            85% of prop challenges fail for the same reason
          </div>
        </div>

        {/* Headline — discipline framing, no profitability claim */}
        <h1 className="mx-auto max-w-4xl text-center font-display text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]" data-reveal style={{ '--reveal-delay': '60ms' }}>
          It&apos;s not your strategy.
          <br />
          <span className="gradient-shimmer">It&apos;s your discipline.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-center text-base leading-relaxed text-white/60 sm:text-lg" data-reveal style={{ '--reveal-delay': '120ms' }}>
          PropLogAI turns your trade logs into evidence of <strong className="text-white/90">how disciplined you actually are</strong> — then your AI coach, Propol, finds the recurring breaches costing you funded accounts. No signals. No advice. Just the pattern you keep repeating.
        </p>

        {/* Dual CTA */}
        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" data-reveal style={{ '--reveal-delay': '180ms' }}>
          <Link href="/login?mode=signup" className="cta-glow rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
            Start free — find your breach →
          </Link>
          <Link href="#how-it-works" className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/72 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
            See how it works ↓
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-white/35" data-reveal style={{ '--reveal-delay': '220ms' }}>No credit card. No commitment. Log a trade in 30 seconds.</p>

        {/* Hero video — autoplay muted loop of the quick-add trade flow */}
        <div className="relative mx-auto mt-14 max-w-4xl" data-reveal style={{ '--reveal-delay': '280ms' }}>
          <div className="story-video-frame relative overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b14]/80 shadow-2xl shadow-cyan-950/30">
            {/* Faux browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/8 bg-black/30 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/50" />
              <span className="ml-3 font-mono text-[11px] text-white/30">proplogai.com/dashboard</span>
              <span className="ml-auto rounded-full border border-emerald-300/20 bg-emerald-300/8 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">⚡ Quick Log</span>
            </div>
            {/* Video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/landing/dashboard.png"
              className="block w-full"
              style={{ aspectRatio: '16 / 9' }}
            >
              <source src="/landing/quick-add.mp4" type="video/mp4" />
            </video>
          </div>
          {/* Caption */}
          <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-white/30">
            Tap + &nbsp;→&nbsp; Quick Log &nbsp;→&nbsp; Pair · Direction · P&amp;L &nbsp;→&nbsp; Done
          </p>
        </div>

        <BetaBar count={betaCount} />
      </div>
    </section>
  );
}
