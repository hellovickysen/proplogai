import Link from 'next/link';
import { gradientText, gradientBtn } from '@/components/landing/LandingData';
import { SectionLabel, Reveal } from '@/components/landing/motion';

export default function PricingSection() {
  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <Reveal><SectionLabel className="mx-auto w-fit">PRICING</SectionLabel></Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-[#f5f5f2] sm:text-5xl">
              Start free.{' '}
              <span style={gradientText}>Upgrade when it works.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-4 max-w-md text-sm text-[#858995]">
              14 days of Elite, no credit card. Then Basic stays free forever.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {/* Basic */}
          <Reveal delay={150}>
            <div className="h-full rounded-2xl border border-white/[0.08] bg-[#0c0d12]/60 p-8 backdrop-blur">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Basic</div>
              <div className="mt-3 font-display text-5xl font-extrabold text-[#f5f5f2]">$0</div>
              <div className="mt-1 text-sm text-white/40">Forever</div>
              <Link
                href="/login?mode=signup"
                className="mt-7 block w-full rounded-xl border border-white/12 bg-white/[0.03] py-3 text-center text-sm font-semibold text-white/75 transition hover:border-lime-300/40 hover:text-white"
              >
                Start free →
              </Link>
              <ul className="mt-8 space-y-3">
                {[
                  'Unlimited trade logging',
                  'Journal with emotions & screenshots',
                  'P&L calendar',
                  'Rulebook — up to 3 setups',
                  'Prop firm expense tracker',
                  'Public trader profile',
                  '3 AI trade analyses / month',
                  '1 AI coach report / month',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#858995]">
                    <span className="mt-0.5 text-white/25">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Elite */}
          <Reveal delay={250}>
            <div className="relative h-full rounded-2xl border border-lime-300/25 bg-gradient-to-b from-lime-300/[0.06] to-[#34d399]/[0.03] p-8 backdrop-blur">
              <div
                className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold text-[#050507]"
                style={gradientBtn}
              >
                MOST POPULAR
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-lime-300/80">Elite</div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-extrabold" style={gradientText}>$9.99</span>
                <span className="text-sm text-white/40">/month</span>
              </div>
              <div className="mt-1 text-sm text-white/40">or $7.99/mo billed yearly</div>
              <Link
                href="/login?mode=signup"
                className="cta-glow mt-7 block w-full rounded-xl py-3 text-center text-sm font-semibold text-[#050507] transition-transform hover:-translate-y-0.5"
                style={gradientBtn}
              >
                Start 14-day Elite trial →
              </Link>
              <ul className="mt-8 space-y-3">
                {[
                  'Everything in Basic',
                  'Unlimited AI trade analysis',
                  'Unlimited AI coach reports',
                  'Advanced discipline stats',
                  'CSV export & shareable cards',
                  'Unlimited screenshots & setups',
                  'Trophy wall — unlimited',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="mt-0.5 text-lime-300">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal delay={350}>
          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
            14-day Elite trial · No credit card · Cancel anytime
          </p>
        </Reveal>
      </div>
    </section>
  );
}
