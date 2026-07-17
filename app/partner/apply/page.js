import Link from 'next/link';
import { DEFAULT_COMMISSION_RATE, MAX_COMMISSION_RATE } from '@/lib/affiliate';

export const dynamic = 'force-dynamic';

const APP_APPLY_URL = 'https://proplogai.com/dashboard/rewards?tab=partners';

/**
 * Applications happen inside the main app (Rewards → Partners), where the user
 * is already authenticated. This page is a signpost that sends people there.
 */
export default function ApplySignpost() {
  const pct = Math.round(DEFAULT_COMMISSION_RATE * 100);
  const maxPct = Math.round(MAX_COMMISSION_RATE * 100);

  return (
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/45">Affiliate application</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">Apply from your PropLogAI app</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Partner applications happen inside PropLogAI, where you&apos;re already signed in. Open the app, go to{' '}
        <strong className="text-white">Rewards → Partners</strong>, and submit the form there. Earn {pct}%–{maxPct}%
        lifetime recurring commission once approved.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <ol className="space-y-3 text-sm text-white/70">
          <li className="flex gap-3"><Step n="1" /> Open PropLogAI and sign in.</li>
          <li className="flex gap-3"><Step n="2" /> Go to <strong className="text-white">Rewards</strong> in the sidebar.</li>
          <li className="flex gap-3"><Step n="3" /> Open the <strong className="text-white">Partners</strong> tab and apply.</li>
        </ol>
        <a
          href={APP_APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          Open Rewards → Partners
        </a>
        <p className="mt-3 text-center text-xs text-white/40">
          Don&apos;t have an account?{' '}
          <a href="https://proplogai.com/login" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            Create one free
          </a>
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-white/50">
        Already approved?{' '}
        <Link href="/login" className="text-cyan-400 hover:underline">Log in to your partner portal</Link>
      </p>
    </div>
  );
}

function Step({ n }) {
  return (
    <span
      className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold text-[#08080f]"
      style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
    >
      {n}
    </span>
  );
}
