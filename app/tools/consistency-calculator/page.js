'use client';
import ConsistencyCalculator from '@/components/tools/ConsistencyCalculator';
import Link from 'next/link';
import Head from 'next/head';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export default function PublicConsistencyCalculatorPage() {
  return (
    <>
    <LandingNav />
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
    <LandingFooter />
    </>
  );
}
