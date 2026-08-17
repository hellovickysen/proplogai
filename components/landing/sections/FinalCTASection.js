import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';
import BetaBar from '@/components/landing/BetaBar';

const JOURNEY = ['Trade', 'Data', 'Insight', 'Discipline', 'Improvement'];

export default function FinalCTASection({ betaCount }) {
  return (
    <section className="data-grid-bg relative overflow-hidden px-4 py-24 sm:px-10 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2 glow-violet" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl text-center" data-reveal>
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
          Your next trade is another data point.
          <br />
          <span className="gradient-shimmer">Make sure it makes you a better trader.</span>
        </h2>

        {/* The journey, resolved */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-3" aria-hidden="true">
          {JOURNEY.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] ${i === JOURNEY.length - 1 ? 'border border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200' : 'border border-white/10 bg-white/[0.04] text-white/55'}`}>
                {step}
              </span>
              {i < JOURNEY.length - 1 && (
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="text-violet-400/60">
                  <path d="M1 6h14m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/login?mode=signup" className="cta-glow rounded-xl px-9 py-4 text-base font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
            Start using PropLogAI
          </Link>
          <Link href="#how-it-works" className="rounded-xl border border-white/15 bg-white/5 px-9 py-4 text-base font-semibold text-white/72 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
            Explore the platform
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/35">Free during beta. No credit card. Your process starts with your next logged trade.</p>

        <BetaBar count={betaCount} />
      </div>
    </section>
  );
}
