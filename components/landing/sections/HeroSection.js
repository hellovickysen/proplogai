import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';
import HeroProductPreview from '@/components/landing/sections/HeroProductPreview';

export default function HeroSection() {
  return (
    <section className="hero-product-stage relative overflow-hidden px-4 pb-16 pt-16 sm:px-10 sm:pb-20 sm:pt-24">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium tracking-wide text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
          The discipline system for prop traders
        </div>

        <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.6rem]">
          Stop repeating the{' '}
          <span className="text-rose-400">same mistake.</span>
          <br />
          <span className="bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] bg-clip-text text-transparent">
            Build discipline that holds.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
          TradingView charts it. TradeZella logs it. PropLogAI finds the pattern
          behind your rule breaks — and coaches you out of it in 30 days.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login?mode=signup"
            className="cta-glow whitespace-nowrap rounded-xl px-7 py-3.5 text-sm font-semibold text-[#070710] transition-transform hover:-translate-y-0.5 sm:text-base"
            style={gradientBtn}
          >
            Start free →
          </Link>
          <Link
            href="#the-loop"
            className="whitespace-nowrap rounded-xl border border-white/12 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:text-base"
          >
            See how it works ↓
          </Link>
        </div>

        <p className="mt-4 text-[11px] tracking-wide text-white/35">
          14-day Elite trial · No credit card
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-14 max-w-4xl sm:mt-16">
        <HeroProductPreview />
      </div>
    </section>
  );
}
