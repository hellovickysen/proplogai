import Link from 'next/link';
import { gradientText, gradientBtn } from '@/components/landing/LandingData';

export default function PricingSection() {
  return (
    <section id="pricing" className="px-4 py-20 sm:px-10" data-reveal>
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
            14-day Elite trial · No credit card
          </div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Simple pricing for <span style={gradientText}>disciplined traders</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/55">
            Start with Elite free for 14 days. Continue on Basic or upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="font-mono text-xs uppercase tracking-wider text-white/40">Basic</div>
            <div className="mt-2 font-display text-3xl font-bold">$0</div>
            <div className="mt-1 text-sm text-white/40">Forever</div>
            <Link href="/login?mode=signup" className="mt-6 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
              Start free →
            </Link>
            <ul className="mt-8 space-y-3">
              {['Unlimited trade logging', 'Journal entries with emotions & 1 screenshot/trade', 'P&L calendar (full)', 'Dashboard with basic stats', 'Rulebook — up to 3 custom setups', 'Prop firm expense tracker', 'Public trader profile', 'Referral rewards', 'Trophy wall (5 uploads)', '3 AI trade analyses / month', '1 AI coach report / month'].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                  <span className="mt-0.5 text-white/35">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.08] to-cyan-500/[0.03] p-8">
            <div className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold text-[#08080f]" style={gradientBtn}>MOST POPULAR</div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-300/60">Elite</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold" style={gradientText}>$9.99</span>
              <span className="text-sm text-white/40">/month</span>
            </div>
            <div className="mt-1 text-sm text-white/40">or $7.99/mo billed yearly ($95.88/yr)</div>
            <Link href="/login?mode=signup" className="cta-glow mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5" style={gradientBtn}>
              Start 14-day Elite trial →
            </Link>
            <ul className="mt-8 space-y-3">
              {['Everything in Basic', 'Unlimited AI trade analysis', 'Unlimited AI coach reports', 'Email coach reports', 'CSV trade export', 'Shareable P&L cards', 'Advanced discipline stats & achievements', 'Trophy wall (unlimited uploads)', 'Unlimited screenshots per trade', 'Unlimited custom setups'].map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 text-violet-400">✓</span>{f}
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/35 mb-2">Coming soon</div>
              <ul className="space-y-2">
                {['Telegram bot trade logging', 'Cross-user pattern intelligence'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/40">
                    <span className="mt-0.5 text-amber-400/50">◇</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          14-day Elite trial · No credit card · Basic remains free
        </p>
      </div>
    </section>
  );
}
