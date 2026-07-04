import ToolCard from '@/components/tools/ToolCard';
import Link from 'next/link';

export const metadata = {
  title: 'Free Prop Trading Tools | PropLogAI',
  description:
    'Free calculators and utilities for prop firm traders. Check consistency rules, calculate payout eligibility, and more.',
  keywords: [
    'prop trading tools',
    'consistency calculator',
    'prop firm payout',
    'trading calculator',
    'funded trader tools',
  ],
  openGraph: {
    title: 'Free Prop Trading Tools | PropLogAI',
    description:
      'Free calculators and utilities for prop firm traders. Check consistency rules, calculate payout eligibility, and more.',
    url: 'https://proplogai.com/tools',
    siteName: 'PropLogAI',
    type: 'website',
    images: [
      {
        url: 'https://proplogai.com/og-consistency-calculator.png',
        width: 1344,
        height: 768,
        alt: 'PropLogAI — Free Prop Trading Tools',
      },
    ],
  },
  alternates: {
    canonical: 'https://proplogai.com/tools',
  },
};

const TOOLS = [
  {
    title: 'Consistency Calculator',
    subtitle:
      'Check if your largest winning trade satisfies the consistency rule before requesting a payout',
    icon: '📐',
    href: '/tools/consistency-calculator',
    color: 'linear-gradient(120deg, #a78bfa, #22d3ee)',
  },
];

export default function PublicToolsPage() {
  return (
    <div className="min-h-screen bg-[#07070b]">
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

      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
            Free Prop Trading Tools
          </h1>
          <p className="mt-2 text-sm text-white/55 md:text-base">
            Calculators &amp; utilities built for funded traders
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center md:p-10">
          <h2 className="font-display text-xl font-bold text-white md:text-2xl">
            Track your trades. Get AI coaching.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/55 md:text-base">
            PropLogAI is an AI-powered trading journal that helps prop firm
            traders log trades, track emotions, and get personalized coaching to
            improve consistency.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform active:scale-[0.98]"
            style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
          >
            Start journaling free →
          </Link>
        </div>
      </div>
    </div>
  );
}
