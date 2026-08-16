'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { gradientBtn } from '@/components/landing/LandingData';
import { Reveal } from '@/components/landing/motion';

const WORDS = ['PATTERN', 'DATA', 'BEHAVIOR', 'DISCIPLINE', 'CONSISTENCY'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function CyclingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <span
        key={WORDS[i]}
        className="gradient-shimmer inline-block"
        style={{ animation: 'word-cycle 2.2s ease-in-out' }}
      >
        {WORDS[i]}.
      </span>
    </span>
  );
}

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden px-4 pt-24 sm:px-10">
      <div className="absolute inset-0 -z-10 bg-[#050507]" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.26em] text-white/50 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.9)]" />
            Trading performance intelligence
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="mt-7 font-display text-[3rem] font-extrabold leading-[0.98] tracking-tight sm:text-7xl lg:text-[6.2rem]">
            <span className="text-[#f5f5f2]">YOUR TRADING</span>
            <br />
            <span className="text-[#f5f5f2]">HAS A </span>
            <CyclingWord />
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-[#858995] sm:text-lg">
            PropLogAI turns every trade into evidence of how you actually trade —
            and coaches you out of the mistakes you keep repeating.
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login?mode=signup"
              className="cta-glow whitespace-nowrap rounded-xl px-8 py-3.5 text-sm font-semibold text-[#050507] transition-transform hover:-translate-y-0.5 sm:text-base"
              style={gradientBtn}
            >
              Start tracking free →
            </Link>
            <Link
              href="#story"
              className="whitespace-nowrap rounded-xl border border-white/12 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-white/70 backdrop-blur transition hover:border-lime-300/40 hover:text-white sm:text-base"
            >
              See how it works ↓
            </Link>
          </div>
        </Reveal>

        <Reveal delay={480}>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            No credit card · Start in 60 seconds
          </p>
        </Reveal>

        {/* Live event ticker — monospace metadata texture */}
        <Reveal delay={600}>
          <div className="mt-14 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/[0.06] pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            <span>XAUUSD / LONDON</span>
            <span>TRADE #092</span>
            <span>RISK: 0.5R</span>
            <span className="text-lime-300/70">DISCIPLINE INDEX 82.4</span>
            <span className="text-rose-300/70">RULE BREAK ×1</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
