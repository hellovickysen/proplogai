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
            Built for prop firm traders
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.55rem]">
            Stop repeating the mistakes{' '}
            <span className="text-red-400" style={redGlow}>costing you funded accounts.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg lg:mx-0">
            PropLogAI turns your trade journal into an AI performance coach that finds recurring psychology and discipline patterns — then shows you what to fix next.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/login?mode=signup" className="cta-glow rounded-xl px-8 py-3.5 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
              Train your AI coach — free →
            </Link>
            <Link href="#the-pattern" className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/72 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
              See how it works ↓
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/40 lg:justify-start">
            <span>✓ 14-day Elite trial</span>
            <span>✓ No credit card</span>
            <span>✓ Your data stays private</span>
          </div>
        </div>

        <HeroProductPreview />
      </div>
    </section>
  );
}
