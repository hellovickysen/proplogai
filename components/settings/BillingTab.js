'use client';

import { useState } from 'react';
import { PLANS, ELITE_FEATURES } from '@/lib/plans';
import { UpgradeModal } from '@/components/ui/BlurGate';

const gradientBtn = { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' };

/**
 * Billing tab for Settings page.
 * Shows current plan, subscription status, and upgrade/cancel options.
 *
 * Props:
 * planAccess - serialized access object from access.toJSON()
 * subscription - { plan, status, billing_cycle, trial_ends_at, renews_at, cancelled_at } or null
 * paymentStatus - 'success' | 'failed' | 'cancelled' | null (from Razorpay callback redirect)
 */
export default function BillingTab({ planAccess, subscription, paymentStatus }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelled, setCancelled] = useState(false);

  const isElite = planAccess?.effectivePlan === 'elite';
  const isAdmin = planAccess?.isAdmin;
  const isTrialing = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();
  const isActive = subscription?.status === 'active' || subscription?.status === 'authenticated';
  const isCancelled = subscription?.status === 'cancelled' || cancelled;

  const trialDaysLeft = isTrialing
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/razorpay/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) {
        setCancelError(data.error);
      } else {
        setCancelled(true);
        setShowCancelConfirm(false);
      }
    } catch {
      setCancelError('Something went wrong. Please try again.');
    }
    setCancelling(false);
  }

  return (
    <div className="space-y-6">
      {/* Payment status banner from Razorpay redirect */}
      {paymentStatus === 'success' && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 flex items-center gap-3">
          <span className="text-emerald-400 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Payment successful!</p>
            <p className="text-xs text-white/50">Your Elite subscription is being activated. It may take a moment to update.</p>
          </div>
        </div>
      )}
      {paymentStatus === 'failed' && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 flex items-center gap-3">
          <span className="text-red-400 text-lg">✕</span>
          <div>
            <p className="text-sm font-semibold text-red-300">Payment failed</p>
            <p className="text-xs text-white/50">Please try again or contact support.</p>
          </div>
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Current Plan</h3>
          {isAdmin ? (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30 bg-amber-500/10">Admin</span>
          ) : isTrialing ? (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-400/30 bg-cyan-500/10">Trial · {trialDaysLeft}d</span>
          ) : isElite ? (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-400/30 bg-violet-500/10">Elite</span>
          ) : (
            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white/60 border border-white/15 bg-white/5">Basic</span>
          )}
        </div>

        {isAdmin ? (
          <p className="text-sm text-white/50">You have unrestricted admin access to all features.</p>
        ) : isElite && (isActive || isTrialing) ? (
          <div className="space-y-3">
            {isTrialing && (
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3">
                <p className="text-sm text-cyan-300 font-medium">
                  Free trial · {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
                </p>
                <p className="text-xs text-white/40 mt-1">
                  First charge on {fmtDate(subscription.trial_ends_at)}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">Billing</p>
                <p className="text-sm text-white/80">
                  {subscription?.billing_cycle === 'yearly' ? '$7.99/mo (yearly)' : '$9.99/mo'}
                </p>
              </div>
              {subscription?.renews_at && !isCancelled && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">Next billing</p>
                  <p className="text-sm text-white/80">
                    {fmtDate(subscription.renews_at)}
                  </p>
                </div>
              )}
            </div>
            {isCancelled ? (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 mt-2">
                <p className="text-sm text-amber-300">Subscription cancelled</p>
                <p className="text-xs text-white/40 mt-1">
                  You'll keep Elite access until {subscription?.renews_at ? fmtDate(subscription.renews_at) : 'the end of your billing period'}.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-white/30 hover:text-red-400 transition-colors mt-2"
              >
                Cancel subscription
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-white/50 mb-1">You're on the Basic plan (free).</p>
            <p className="text-xs text-white/30 mb-4">Upgrade to Elite to unlock AI coaching, exports, and more.</p>
            <button
              onClick={() => setShowUpgrade(true)}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]"
              style={gradientBtn}
            >
              Upgrade to Elite — 14-day free trial
            </button>
          </div>
        )}
      </div>

      {/* Feature comparison (shown for Basic users) */}
      {!isElite && !isAdmin && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="font-semibold text-white mb-4">What you get with Elite</h3>
          <div className="space-y-3">
            {ELITE_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-base">{f.icon}</span>
                <span className="text-white/70">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={() => setShowCancelConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0b0b14] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Cancel subscription?</h3>
            <p className="text-sm text-white/50 mb-4">
              You'll keep Elite access until the end of your current billing period. After that, you'll be downgraded to Basic.
            </p>
            {cancelError && <p className="text-xs text-red-400 mb-3">{cancelError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5"
              >
                Keep Elite
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 rounded-xl bg-red-500/20 border border-red-400/20 px-4 py-2.5 text-sm text-red-400 font-semibold hover:bg-red-500/30 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
