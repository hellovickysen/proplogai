'use client';

import Link from 'next/link';

/**
 * "Upgrade to Elite" CTA card for Basic (non-beta) users.
 * Shown inline where gated features would appear.
 *
 * Props:
 *   feature - feature key (e.g. 'ai_analysis')
 *   featureLabel - human-readable label
 *   compact - if true, renders as a small inline banner instead of a full card
 */
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function UpgradeCard({ feature, featureLabel, compact = false }) {
  if (compact) {
    return (
      <div className="rounded-lg border border-violet-400/20 bg-violet-500/[0.05] px-3 py-2 flex items-center justify-between gap-3">
        <p className="text-xs text-violet-200/80">
          <span className="font-semibold">{featureLabel || feature}</span> requires the Elite plan.
        </p>
        <Link
          href="/#pricing"
          className="shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-[#08080f]"
          style={gradientBtn}
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-b from-violet-500/[0.06] to-cyan-500/[0.02] p-6 text-center">
      <div
        className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl text-xl"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(34,211,238,0.15))', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        ✦
      </div>
      <h3 className="font-display text-base font-bold">Upgrade to Elite</h3>
      <p className="mx-auto mt-2 max-w-xs text-xs text-white/50">
        {featureLabel || feature} is available on the Elite plan. Unlock unlimited AI coaching, exports, and more.
      </p>
      <Link
        href="/#pricing"
        className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]"
        style={gradientBtn}
      >
        View Elite plan — $9.99/mo
      </Link>
    </div>
  );
}
