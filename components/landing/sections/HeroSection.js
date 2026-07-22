import Link from 'next/link';
import { gradientBtn, redGlow } from '@/components/landing/LandingData';
import HeroProductPreview from '@/components/landing/sections/HeroProductPreview';

export default function HeroSection() {
  return (
    <section className="hero-product-stage relative overflow-hidden px-4 pb-20 pt-12 sm:px-10 sm:pb-24 sm:pt-16">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
        <div className="text-center lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/8 px-4 py-1.5 text-xs font-semibold text-red-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.85)]" />
            30-day trader discipline system
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.55rem]">
            Become a disciplined prop trader{' '}
            <span className="text-red-400" style={redGlow}>in 30 days.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm font-semibold leading-relaxed text-white/75 sm:text-base lg:mx-0">
            Built specifically for prop firm traders who want consistency — not signals.
          </p>

          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg lg:mx-0">
            Your AI coach learns from every trade you log, finds recurring mistakes, and helps you stop repeating them.
            <span className="mt-1 block font-semibold text-white/70">No signals. No predictions. Just better trading habits.</span>
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/login?mode=signup" className="cta-glow whitespace-nowrap rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5 sm:text-base" style={gradientBtn}>
              Start my discipline system →
            </Link>
            <Link href="#the-pattern" className="whitespace-nowrap rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/72 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:text-base">
              See how it works ↓
            </Link>
          </div>

          <p className="mt-3 text-[10px] text-white/35 sm:text-xs lg:text-left">
            14-day trial · No credit card
          </p>
        </div>

        <HeroProductPreview />
      </div>
    </section>
  );
}
