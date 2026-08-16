import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gradientBtn } from '@/components/landing/LandingData';
import HeroDashboardMock from '@/components/landing/sections/HeroDashboardMock';

const HeroParticles = dynamic(() => import('./HeroParticles'), { ssr: false });

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-10 sm:pt-24">
      {/* Deep navy base + grid + glows */}
      <div className="absolute inset-0 -z-20 bg-[#05070f]" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10 opacity-[0.16]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,124,246,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(139,124,246,0.16) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 20%, black 30%, transparent 75%)',
        }}
      />
      <div
        className="absolute -top-40 left-1/2 -z-10 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,124,246,0.16),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />
      <div
        className="absolute right-[-10rem] top-40 -z-10 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_65%)] blur-2xl"
        aria-hidden="true"
      />

      <HeroParticles />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/55 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
          The discipline system for prop traders
        </div>

        <h1 className="font-display text-[2.7rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.8rem]">
          Stop repeating the{' '}
          <span className="text-rose-400">same mistake.</span>
          <br />
          <span className="gradient-shimmer">Build discipline that holds.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
          Your journal logs the trades. PropLogAI finds the pattern behind your
          rule breaks — and coaches you out of it in 30 days.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/login?mode=signup"
            className="cta-glow whitespace-nowrap rounded-xl px-8 py-3.5 text-sm font-semibold text-[#070710] transition-transform hover:-translate-y-0.5 sm:text-base"
            style={gradientBtn}
          >
            Start free →
          </Link>
          <Link
            href="#the-loop"
            className="whitespace-nowrap rounded-xl border border-white/12 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/70 backdrop-blur transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white sm:text-base"
          >
            See how it works ↓
          </Link>
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
          14-day Elite trial · No credit card
        </p>
      </div>

      {/* Floating dashboard mockup */}
      <div className="relative z-10 mx-auto mt-16 max-w-5xl sm:mt-20" data-reveal>
        <HeroDashboardMock />
        {/* Floating evidence cards */}
        <div className="floating-card floating-card-one hidden rounded-2xl border border-rose-300/20 bg-[#0b0b16]/90 px-4 py-3 text-xs shadow-2xl shadow-rose-950/30 backdrop-blur-xl lg:block">
          <span className="font-mono uppercase tracking-wider text-rose-300/70">Pattern found</span>
          <div className="mt-0.5 font-semibold text-rose-100">Revenge re-entry · 6× in 3 weeks</div>
        </div>
        <div className="floating-card floating-card-two hidden rounded-2xl border border-emerald-300/20 bg-[#0b0b16]/90 px-4 py-3 text-xs shadow-2xl shadow-emerald-950/30 backdrop-blur-xl lg:block">
          <span className="font-mono uppercase tracking-wider text-emerald-300/70">Rule streak</span>
          <div className="mt-0.5 font-semibold text-emerald-100">✓ No revenge trading · 8 days</div>
        </div>
      </div>
    </section>
  );
}
