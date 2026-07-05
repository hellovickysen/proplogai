'use client';

import { useState } from 'react';
import { FEATURES, ELITE_FEATURES, PLANS } from '@/lib/plans';

/**
 * BlurGate — wraps Elite-only content with a blur overlay + upgrade CTA for Basic users.
 *
 * Props:
 * feature    - feature key from FEATURES config (e.g. 'csv_export')
 * access     - serialized plan access object (from access.toJSON())
 * children   - the content to show/blur
 * className  - optional wrapper class
 * compact    - if true, renders a smaller inline blur (for buttons/small areas)
 * message    - custom message (optional, overrides default)
 */

const gradientBtn = { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' };

export default function BlurGate({ feature, access, children, className = '', compact = false, message }) {
  const [showModal, setShowModal] = useState(false);

  // No gate for admin, beta, or elite users
  if (!access || access.isAdmin || access.isBeta || access.effectivePlan === 'elite') {
    return <>{children}</>;
  }

  // Check if feature is gated
  const f = FEATURES[feature];
  if (!f) return <>{children}</>;
  const isGated = typeof f.basic === 'boolean' ? !f.basic : false;
  if (!isGated) return <>{children}</>;

  const featureLabel = f?.label || feature;
  const displayMessage = message || `${featureLabel} is available on the Elite plan`;

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <div className="blur-[6px] pointer-events-none select-none opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#08080f] shadow-lg hover:scale-105 transition-transform"
            style={gradientBtn}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Unlock
          </button>
        </div>
        {showModal && <UpgradeModal onClose={() => setShowModal(false)} feature={feature} />}
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {/* Blurred content preview */}
      <div className="blur-[8px] pointer-events-none select-none opacity-50">
        {children}
      </div>

      {/* Gradient fade overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/80 to-transparent" />

      {/* CTA overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <p className="text-white/80 text-sm font-medium mb-1">{displayMessage}</p>
        <p className="text-white/40 text-xs mb-4">Start your 14-day free trial</p>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-[#08080f] shadow-lg hover:scale-105 transition-transform"
          style={gradientBtn}
        >
          Upgrade to Elite
        </button>
      </div>

      {showModal && <UpgradeModal onClose={() => setShowModal(false)} feature={feature} />}
    </div>
  );
}

/**
 * Inline upgrade modal — shows plan comparison and triggers Razorpay checkout.
 */
function UpgradeModal({ onClose, feature }) {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  const price = billingCycle === 'yearly' ? PLANS.elite.priceYearly : PLANS.elite.priceMonthly;
  const priceLabel = billingCycle === 'yearly'
    ? `₹${PLANS.elite.priceYearly}/mo billed annually`
    : `₹${PLANS.elite.priceMonthly}/mo`;
  const savings = billingCycle === 'yearly'
    ? Math.round((1 - PLANS.elite.priceYearly / PLANS.elite.priceMonthly) * 100)
    : 0;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }
      // Redirect to Razorpay hosted page
      if (data.shortUrl) {
        window.location.href = data.shortUrl;
      }
    } catch (err) {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b14] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-400/30 bg-violet-500/10 mb-3">
            ✦ Elite
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Upgrade to Elite</h2>
          <p className="text-white/50 text-sm">14-day free trial · Cancel anytime</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Yearly
            {savings > 0 && (
              <span className="ml-1.5 text-emerald-400 text-[10px] font-bold">-{savings}%</span>
            )}
          </button>
        </div>

        {/* Price */}
        <div className="text-center mb-5">
          <div className="text-3xl font-bold text-white">
            ₹{price}<span className="text-base font-normal text-white/40">/mo</span>
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-white/40 text-xs mt-1">₹{PLANS.elite.priceYearly * 12}/year</p>
          )}
        </div>

        {/* Feature list */}
        <div className="space-y-2.5 mb-6">
          {ELITE_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-base">{f.icon}</span>
              <span className="text-white/70">{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-bold text-[#08080f] shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          style={gradientBtn}
        >
          {loading ? 'Redirecting...' : 'Start 14-day free trial'}
        </button>
        <p className="text-center text-white/30 text-[11px] mt-3">
          No charge for 14 days · Cancel anytime · Secure payment via Razorpay
        </p>
      </div>
    </div>
  );
}

export { UpgradeModal };
