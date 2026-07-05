'use client';

import { useState } from 'react';
import { UpgradeModal } from '@/components/ui/BlurGate';

/**
 * SubscriptionBanner — shows contextual subscription state messages on the dashboard.
 *
 * States:
 * - Trial expiring (≤3 days left): amber "Trial ending" + subscribe CTA
 * - Subscription expired/halted/completed: red "Access ended" + re-subscribe CTA
 * - Cancelled but still active: amber "Cancels on [date]" + resubscribe option
 *
 * Props:
 * subscription - { status, trial_ends_at, renews_at, cancelled_at, billing_cycle } or null
 * planAccess - serialized access object (effectivePlan, isBeta, isAdmin)
 */
export default function SubscriptionBanner({ subscription, planAccess }) {
  const [dismissed, setDismissed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Don't show for admin, beta, or if no relevant state
  if (!planAccess || planAccess.isAdmin || planAccess.isBeta) return null;
  if (!subscription) return null;
  if (dismissed) return null;

  const status = subscription.status;
  const now = new Date();

  // Trial expiring (≤3 days left)
  if (subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 3 && status !== 'cancelled') {
      return (
        <>
          <div className="mx-3 mb-4 sm:mx-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-amber-400 text-lg shrink-0">⏳</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-300">
                  Trial ending in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  Subscribe now to keep your Elite features after {trialEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowUpgrade(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080f] whitespace-nowrap"
                style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
              >
                Subscribe
              </button>
              <button onClick={() => setDismissed(true)} className="text-white/30 hover:text-white/50 text-xs">✕</button>
            </div>
          </div>
          {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </>
      );
    }
  }

  // Subscription expired / halted / completed — user lost Elite access
  if (['halted', 'completed', 'expired'].includes(status)) {
    return (
      <>
        <div className="mx-3 mb-4 sm:mx-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-red-400 text-lg shrink-0">⚠</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-300">Your Elite access has ended</p>
              <p className="text-xs text-white/50 mt-0.5">
                Re-subscribe to unlock AI coaching, exports, and all Elite features.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080f] whitespace-nowrap shrink-0"
            style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
          >
            Re-subscribe
          </button>
        </div>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      </>
    );
  }

  // Cancelled but still active until period end
  if (status === 'cancelled' && subscription.renews_at) {
    const endsAt = new Date(subscription.renews_at);
    if (endsAt > now) {
      return (
        <>
          <div className="mx-3 mb-4 sm:mx-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-amber-400 text-lg shrink-0">📋</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-300">Subscription cancelled</p>
                <p className="text-xs text-white/50 mt-0.5">
                  Elite access until {endsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Resubscribe to keep your features.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowUpgrade(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#08080f] whitespace-nowrap"
                style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
              >
                Resubscribe
              </button>
              <button onClick={() => setDismissed(true)} className="text-white/30 hover:text-white/50 text-xs">✕</button>
            </div>
          </div>
          {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
        </>
      );
    }
  }

  return null;
}
