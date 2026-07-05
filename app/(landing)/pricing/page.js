import Link from 'next/link';
import { PLANS, FEATURES, ELITE_FEATURES } from '@/lib/plans';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';

export const metadata = {
  title: 'Pricing — PropLogAI',
  description: 'Simple pricing for serious traders. Start free, upgrade to Elite for unlimited AI coaching.',
};

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

const BASIC_FEATURES = [
  'Unlimited trade logging',
  'Journal entries with emotions',
  '1 screenshot per trade',
  'P&L calendar (full)',
  'Dashboard with stats & equity chart',
  'Up to 3 custom setups',
  'Prop firm expense tracker',
  'Public trader profile',
  'Referral rewards',
  'Trophy wall (5 uploads)',
  '3 AI trade analyses / month',
  '1 AI coach review / month',
];

const ELITE_FULL = [
  'Everything in Basic, plus:',
  '100 AI trade analyses / month',
  '4 AI coach reviews / month (weekly)',
  'Calendar insights & analytics',
  'Up to 10 screenshots per trade',
  'Unlimited custom setups',
  'Unlimited trophy uploads',
  'CSV export',
  'Shareable P&L cards',
  'Email coach reports',
];

const FAQ = [
  {
    q: 'Can I try Elite for free?',
    a: 'Yes! Every Elite subscription starts with a 14-day free trial. No charge until the trial ends, and you can cancel anytime.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'If you don\'t cancel during the trial, your subscription starts at $9.99/mo (or $7.99/mo yearly). You\'ll get an email reminder before the trial ends.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Settings → Billing. You keep Elite access until the end of your current billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept cards (Visa, Mastercard, Amex), UPI, netbanking, and wallets through our payment partner Razorpay.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We never store your card details.',
  },
  {
    q: 'What if I\'m on the beta?',
    a: 'Beta users get full Elite access for free while the beta lasts. When we launch pricing, you\'ll have the option to subscribe or move to the Basic plan.',
  },
];

export default function PricingPage() {
  return (
    <>
    <LandingNav />
    <div className="min-h-screen bg-[#07070b] text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold" style={gradientText}>PropLogAI</Link>
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 border border-white/15 hover:bg-white/5 transition-colors">
            Sign in
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="px-4 pt-16 pb-10 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Simple pricing for <span style={gradientText}>serious traders</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-white/55">
          Start free. Upgrade when the AI becomes indispensable — and it will.
        </p>
      </div>

      {/* Plans */}
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Basic */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="font-mono text-xs uppercase tracking-wider text-white/40">Basic</div>
            <div className="mt-2 font-display text-3xl font-bold">$0</div>
            <div className="mt-1 text-sm text-white/40">Forever</div>
            <Link href="/login?mode=signup" className="mt-6 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white">
              Start free →
            </Link>
            <ul className="mt-8 space-y-3">
              {BASIC_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                  <span className="mt-0.5 text-white/30">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          {/* Elite */}
          <div className="relative rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.08] to-cyan-500/[0.03] p-8">
            <div className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold text-[#08080f]" style={gradientBtn}>MOST POPULAR</div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-300/60">Elite</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold" style={gradientText}>$9.99</span>
              <span className="text-sm text-white/40">/month</span>
            </div>
            <div className="mt-1 text-sm text-white/40">or $7.99/mo billed yearly ($95.88/yr)</div>
            <Link href="/login?mode=signup" className="mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold text-[#08080f]" style={gradientBtn}>
              Start 14-day free trial →
            </Link>
            <ul className="mt-8 space-y-3">
              {ELITE_FULL.map((f, i) => (
                <li key={i} className={`flex items-start gap-2.5 text-sm ${i === 0 ? 'text-white/80 font-semibold' : 'text-white/60'}`}>
                  {i === 0 ? null : <span className="mt-0.5 text-violet-400">✓</span>}{f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="text-center font-display text-xl font-bold mb-8">Feature comparison</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/50 font-mono text-xs uppercase tracking-wider">Feature</th>
                  <th className="text-center px-6 py-4 text-white/50 font-mono text-xs uppercase tracking-wider">Basic</th>
                  <th className="text-center px-6 py-4 text-violet-300/70 font-mono text-xs uppercase tracking-wider">Elite</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Trade logging', 'Unlimited', 'Unlimited'],
                  ['Journal entries', '✓', '✓'],
                  ['P&L Calendar', '✓', '✓'],
                  ['Dashboard & stats', '✓', '✓'],
                  ['AI trade analyses', '3/month', '100/month'],
                  ['AI coach reviews', '1/month', '4/month'],
                  ['Calendar insights', '—', '✓'],
                  ['Screenshots/trade', '1', '10'],
                  ['Custom setups', '3', 'Unlimited'],
                  ['Trophy uploads', '5', 'Unlimited'],
                  ['CSV export', '—', '✓'],
                  ['Shareable P&L cards', '—', '✓'],
                  ['Email coach reports', '—', '✓'],
                  ['Expense tracker', '✓', '✓'],
                  ['Public profile', '✓', '✓'],
                  ['Referral rewards', '✓', '✓'],
                ].map(([feature, basic, elite], i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-6 py-3 text-white/70">{feature}</td>
                    <td className="px-6 py-3 text-center text-white/50">{basic}</td>
                    <td className="px-6 py-3 text-center text-white/80">{elite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-center font-display text-xl font-bold mb-8">Frequently asked questions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Ready to level up?</h2>
          <p className="text-white/50 text-sm mb-6">Start your 14-day free trial. No credit card required upfront.</p>
          <Link href="/login?mode=signup" className="inline-block rounded-xl px-8 py-3 text-sm font-bold text-[#08080f]" style={gradientBtn}>
            Get started free →
          </Link>
        </div>
      </div>

<LandingFooter />
    </div>
  );
}
