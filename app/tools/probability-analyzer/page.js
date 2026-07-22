'use client';

import AnalyzerPage from '@/app/dashboard/tools/probability-analyzer/AnalyzerPage';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

export default function PublicProbabilityAnalyzerPage() {
  return (
    <>
      <LandingNav />
      <div className="min-h-screen bg-[#07070b]">
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-white/55 transition-colors hover:text-white/90"
          >
            ← Tools
          </Link>
          <div className="mt-4">
            <AnalyzerPage />
          </div>
        </div>
      </div>
      <LandingFooter />
    </>
  );
}
