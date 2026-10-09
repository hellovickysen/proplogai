import Link from 'next/link';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';
import PositionSizeCalculator from '@/components/tools/PositionSizeCalculator';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Forex Position Size Calculator',
  url: 'https://proplogai.com/tools/position-size-calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'A free calculator that estimates forex lot size from planned USD risk, stop distance and user-confirmed platform values.',
};

export default function PublicPositionSizeCalculatorPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#07070b]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
          <Link href="/tools" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-white/50 hover:text-white">
            ← Tools
          </Link>

          <div className="mt-5"><PositionSizeCalculator /></div>

          <section className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-display text-lg font-semibold text-white">How the estimate works</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Your <Link className="text-cyan-300 hover:text-cyan-200" href="/glossary/risk-per-trade">planned USD risk</Link> is divided by the estimated loss for 1.00 lot at your <Link className="text-cyan-300 hover:text-cyan-200" href="/glossary/stop-loss">stop loss</Link>. Read the <Link className="text-cyan-300 hover:text-cyan-200" href="/blogs/how-to-calculate-position-size-forex">step-by-step guide</Link> for complete examples.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="font-display text-lg font-semibold text-white">What this result does not check</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                This estimate does not check margin, combined exposure, your <Link className="text-cyan-300 hover:text-cyan-200" href="/glossary/daily-drawdown-limit">daily drawdown limit</Link>, your <Link className="text-cyan-300 hover:text-cyan-200" href="/glossary/overall-drawdown-limit">overall drawdown limit</Link>, or official account status.
              </p>
            </div>
          </section>

          <aside className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-400/[0.05] p-5 text-sm leading-relaxed text-white/60">
            <strong className="text-white">Educational estimate:</strong> the calculator does not recommend a risk percentage or trade. Confirm the values in your own platform and compare the result with your written plan and exact account rules.
          </aside>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
