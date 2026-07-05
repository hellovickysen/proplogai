'use client';

import { useState } from 'react';
import { UpgradeModal } from '@/components/ui/BlurGate';

/**
 * "Upgrade to Elite" CTA card for Basic (non-beta) users.
 * Shown inline where gated features would appear.
 *
 * Props:
 * feature - feature key (e.g. 'ai_analysis')
 * featureLabel - human-readable label
 * compact - if true, renders as a small inline banner instead of a full card
 */
const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

export default function UpgradeCard({ feature, featureLabel, compact = false }) {
  const [showModal, setShowModal] = useState(false);

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
          <p className="text-xs text-white/50">
            {featureLabel || feature} requires the Elite plan.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-[#08080f] whitespace-nowrap"
            style={gradientBtn}
          >
            Upgrade
          </button>
        </div>
        {showModal && <UpgradeModal onClose={() => setShowModal(false)} feature={feature} />}
      </>
    );
  }

  return (
    <>
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="text-2xl mb-2">✦</div>
        <h3 className="text-lg font-bold text-white mb-1">Upgrade to Elite</h3>
        <p className="text-sm text-white/50 mb-4">
          {featureLabel || feature} is available on the Elite plan. Unlock unlimited AI coaching, exports, and more.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f]"
          style={gradientBtn}
        >
          View Elite plan — ₹799/mo
        </button>
      </div>
      {showModal && <UpgradeModal onClose={() => setShowModal(false)} feature={feature} />}
    </>
  );
}
