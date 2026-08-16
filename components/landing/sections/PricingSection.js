import Link from 'next/link';
import { gradientText, gradientBtn } from '@/components/landing/LandingData';

export default function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-20 sm:px-10 sm:py-24" data-reveal>
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/40">
            Pricing
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Start free.{' '}
            <span className="bg-gradient-to-r from-[#8b7cf6] to-[#22d3ee] bg-clip-text text-transparent">
              Upgrade when it works.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/55">
            14 days of Elite, no credit card. Then Basic stays free forever.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {/* Basic */}
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.028] p-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Basic</div>
            <div className="mt-3 font-display text-4xl font-extrabold text-white">$0</div>
            <div className="mt-1 text-sm text-white/40">Forever</div>
            <Link
              href="/login?mode=signup"
              className="mt-7 block w-full rounded-xl border border-white/12 bg-white/[0.04] py-3 text-center text-sm font-semibold text-white/75 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
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
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                  <span className="mt-0.5 text-white/30">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Elite */}
          <div className="relative rounded-3xl border border-[#8b7cf6]/25 bg-gradient-to-b from-[#8b7cf6]/[0.07] to-[#22d3ee]/[0.03] p-8">
            <div
              className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold text-[#070710]"
              style={gradientBtn}
            >
              MOST POPULAR
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8b7cf6]">Elite</div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-extrabold" style={gradientText}>$9.99</span>
              <span className="text-sm text-white/40">/month</span>
            </div>
            <div className="mt-1 text-sm text-white/40">or $7.99/mo billed yearly</div>
            <Link
              href="/login?mode=signup"
              className="cta-glow mt-7 block w-full rounded-xl py-3 text-center text-sm font-semibold text-[#070710] transition-transform hover:-translate-y-0.5"
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
                  <span className="mt-0.5 text-[#8b7cf6]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/35">
          14-day Elite trial · No credit card · Cancel anytime
        </p>
      </div>
    </section>
  );
}
