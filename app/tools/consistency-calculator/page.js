'use client';
import ConsistencyCalculator from '@/components/tools/ConsistencyCalculator';
import Link from 'next/link';
import Head from 'next/head';

export default function PublicConsistencyCalculatorPage() {
  return (
    <div className="min-h-screen bg-[#07070b]">
      {/* Structured data for SEO */}
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Prop Firm Consistency Calculator',
              url: 'https://proplogai.com/tools/consistency-calculator',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              description:
                'Free calculator to check if your largest winning trade satisfies the prop firm consistency rule (20%, 25%, 30%) before requesting a payout.',
            }),
          }}
        />
      </Head>

      {/* Nav bar */}
      <nav className="border-b border-white/10 bg-[#0b0b14]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" className="font-display text-lg font-bold text-white">
            PropLogAI
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#08080f] transition-transform active:scale-[0.98]"
              style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
            >
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-white/55 transition-colors hover:text-white/90"
        >
          ← Tools
        </Link>
        <div className="mt-4">
          <ConsistencyCalculator />
        </div>

        {/* CTA Banner */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center md:p-8">
          <p className="font-display text-base font-semibold text-white md:text-lg">
            Want to track your consistency automatically?
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            PropLogAI logs your trades, tracks emotions, and gives you AI
            coaching to improve your trading discipline.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform active:scale-[0.98]"
            style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
          >
            Start journaling free →
          </Link>
        </div>
      </div>
    </div>
  );
}
