import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';
import BetaBar from '@/components/landing/BetaBar';

/* The data-flow pipeline that runs beside the hero video:
   TRADE DATA → BEHAVIOR → AI ANALYSIS → PATTERNS → DISCIPLINE → IMPROVEMENT */
const PIPELINE = ['Trade data', 'Behavior', 'AI analysis', 'Patterns', 'Discipline', 'Improvement'];

export default function HeroSection({ betaCount }) {
  return (
    <section className="hero-product-stage data-grid-bg relative overflow-hidden px-4 pb-20 pt-12 sm:px-10 sm:pt-16">
      {/* soft glows */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 glow-violet" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Eyebrow */}
        <div className="mb-7 flex justify-center" data-reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/[0.07] px-4 py-1.5 section-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
            Trading discipline, redefined
          </div>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-center font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl" data-reveal style={{ '--reveal-delay': '60ms' }}>
          Stop trading.
          <br />
          <span className="gradient-shimmer">Start becoming a trader.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-center text-base leading-relaxed text-white/60 sm:text-lg" data-reveal style={{ '--reveal-delay': '120ms' }}>
          PropLogAI turns your trades, behavior, emotions, and rules into a personal trading intelligence system — so you can spot the mistakes you keep repeating and build a process you can actually follow.
        </p>

        {/* Dual CTA */}
        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center" data-reveal style={{ '--reveal-delay': '180ms' }}>
          <Link href="/login?mode=signup" className="cta-glow rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
            Start trading smarter — free
          </Link>
          <Link href="#how-it-works" className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/72 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
            Explore PropLogAI ↓
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-white/35" data-reveal style={{ '--reveal-delay': '220ms' }}>
          No credit card. Log your first trade in 30 seconds.
        </p>

        {/* Hero visual — the quick-add video inside a floating dashboard frame */}
        <div className="relative mx-auto mt-14 max-w-4xl" data-reveal style={{ '--reveal-delay': '280ms' }}>

          <div className="story-video-frame relative overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b14]/80 shadow-2xl shadow-cyan-950/30">
            <div className="flex items-center gap-2 border-b border-white/8 bg-black/30 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/50" />
              <span className="ml-3 font-mono text-[11px] text-white/30">proplogai.com/dashboard</span>
              <span className="ml-auto rounded-full border border-emerald-300/20 bg-emerald-300/8 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">⚡ Quick Log</span>
            </div>
            <video autoPlay muted loop playsInline preload="metadata" poster="/landing/dashboard.png" className="block w-full" style={{ aspectRatio: '16 / 9' }}>
              <source src="/landing/quick-add.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Pipeline rail — a trade flows through the system */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3" aria-label="How a trade flows through PropLogAI">
            {PIPELINE.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
                  {step}
                </span>
                {i < PIPELINE.length - 1 && (
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true" className="text-violet-400/60">
                    <path d="M1 6h14m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </div>

        <BetaBar count={betaCount} />
      </div>
    </section>
  );
}
