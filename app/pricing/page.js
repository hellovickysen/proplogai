import Link from 'next/link';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

const FREE_FEATURES = [
  'Unlimited trade logging',
  'Journal entries with emotions & screenshots (3/trade)',
  'P&L calendar (full)',
  'Dashboard with basic stats',
  'Playbook — up to 5 custom setups',
  'Prop firm expense tracker',
  'Public trader profile',
  'Referral rewards',
  '5 AI trade analyses / month',
  '1 AI coach report / month',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited AI trade analysis',
  'Unlimited AI coach reports',
  'Email coach reports',
  'CSV trade export',
  'Shareable P&L cards',
  'Advanced discipline stats & achievements',
  'Trophy wall (unlimited uploads)',
  'Unlimited screenshots per trade',
  'Unlimited custom setups',
];

const COMING_SOON = [
  'MT5 auto-sync',
  'Telegram bot trade logging',
  'Cross-user pattern intelligence',
];

export default function PricingPage() {
  return (
    <div className="min-h-screen px-6 py-16" style={{ background: '#07070b', fontFamily: 'Poppins, sans-serif' }}>
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-cyan-400 transition-opacity hover:opacity-80">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to PropJournal
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
            Beta — all Pro features free for early adopters
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Simple pricing for <span style={gradientText}>serious traders</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/55">
            Start free. Upgrade when the AI becomes indispensable — and it will.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <div className="font-mono text-xs uppercase tracking-wider text-white/40">Free</div>
            <div className="mt-2 font-display text-3xl font-bold">$0</div>
            <div className="mt-1 text-sm text-white/40">Forever</div>

            <Link
              href="/login?mode=signup"
              className="mt-6 block w-full rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              Start free →
            </Link>

            <ul className="mt-8 space-y-3">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                  <span className="mt-0.5 text-white/30">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-2xl border border-violet-400/25 bg-gradient-to-b from-violet-500/[0.08] to-cyan-500/[0.03] p-8">
            <div className="absolute -top-3 right-6 rounded-full px-3 py-1 text-[10px] font-bold text-[#08080f]" style={gradientBtn}>
              MOST POPULAR
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-violet-300/60">Pro</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold" style={gradientText}>$12</span>
              <span className="text-sm text-white/40">/month</span>
            </div>
            <div className="mt-1 text-sm text-white/40">or $99/year (save 31%)</div>

            <Link
              href="/login?mode=signup"
              className="cta-glow mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold text-[#08080f] transition-transform hover:-translate-y-0.5"
              style={gradientBtn}
            >
              Start free — upgrade anytime →
            </Link>

            <ul className="mt-8 space-y-3">
              {PRO_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                  <span className="mt-0.5 text-violet-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/30 mb-2">Coming soon</div>
              <ul className="space-y-2">
                {COMING_SOON.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/40">
                    <span className="mt-0.5 text-amber-400/50">◇</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Beta banner */}
        <div className="mt-12 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-6 text-center">
          <h3 className="font-display text-lg font-bold text-emerald-300">Early adopter? Everything is free right now.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            During the beta, all Pro features are unlocked for every user. Sign up now and you&apos;ll get early-adopter pricing when Pro launches.
          </p>
          <Link href="/login?mode=signup" className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]" style={gradientBtn}>
            Join the beta — it&apos;s free →
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-8 text-center font-display text-xl font-bold">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is the beta really free?', a: 'Yes. Every feature — including AI coaching — is free during the beta. No credit card required.' },
              { q: 'What happens when Pro launches?', a: 'Free tier stays free forever with the limits shown above. Beta users get early-adopter pricing on Pro.' },
              { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no commitments. Downgrade to Free anytime and keep all your trade data.' },
              { q: 'Is my trading data secure?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). We never sell your data or use it to train AI models.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-display text-sm font-semibold">{faq.q}</h3>
                <p className="mt-1.5 text-sm text-white/50">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-white/[0.06] pt-8 text-center text-xs text-white/30">
          <p>© 2026 PropJournal. All rights reserved. <Link href="/privacy" className="text-cyan-400 hover:opacity-80">Privacy</Link> · <Link href="/terms" className="text-cyan-400 hover:opacity-80">Terms</Link></p>
        </div>
      </div>
    </div>
  );
}
