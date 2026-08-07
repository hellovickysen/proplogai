'use client';

import Link from 'next/link';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';
import AccountSurvivalCalculatorNext from '@/components/tools/AccountSurvivalCalculatorNext';

export default function PublicAccountSurvivalCalculatorPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-[#07070b]">
        <div className="mx-auto max-w-5xl p-4 md:p-8">
          <Link href="/tools" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-white/55 transition-colors hover:text-white/90">← Tools</Link>
          <div className="mt-4"><AccountSurvivalCalculatorNext /></div>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
