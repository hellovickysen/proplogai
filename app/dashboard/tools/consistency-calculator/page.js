'use client';
import ConsistencyCalculator from '@/components/tools/ConsistencyCalculator';
import Link from 'next/link';

export default function ConsistencyCalculatorPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/tools"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-white/55 transition-colors hover:text-white/90"
      >
        ← Tools
      </Link>
      <div className="mt-4">
        <ConsistencyCalculator />
      </div>
    </div>
  );
}
