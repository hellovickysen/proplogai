'use client';

import { useState, useEffect, useCallback } from 'react';
import { ELITE_FEATURES } from '@/lib/plans';

const gradientBtn = { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' };
const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) { setLoaded(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => setLoaded(true);
    document.body.appendChild(s);
  }, []);
  return loaded;
}

function money(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}

export default function CheckoutClient({ priceMonthly, priceYearly, yearlyTotal, initialCoupon, isTrialing = false, trialEndsAt = null, trialAutoPct = 0, trialAutoConfigured = false, trialAutoCode = 'TRIAL10' }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [code, setCode] = useState(initialCoupon || '');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(null); // explicit code result: { discountPct, methods, label }
  const [couponMsg, setCouponMsg] = useState('');
  const [couponErr, setCouponErr] = useState('');
  const [loading, setLoading] = useState(false);
  const razorpayReady = useRazorpayScript();

  const trialDaysLeft = isTrialing && trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const chargeNow = billingCycle === 'yearly' ? yearlyTotal : priceMonthly;
  const cycleLabel = billingCycle === 'yearly' ? '/year' : '/month';

  // Effective discount:
  // - an explicit code (once validated) wins, at whatever rate the server returns
  //   (already includes the +trial bonus during the trial);
  // - otherwise, during the trial the auto-bonus applies on its own (if configured);
  // - otherwise full price.
  const explicitApplied = !!applied;
  const codePct = applied?.discountPct || 0;
  const useAuto = !explicitApplied && isTrialing && trialAutoConfigured && trialAutoPct > 0;
  const effPct = explicitApplied ? codePct : (useAuto ? trialAutoPct : 0);
  const discountActive = effPct > 0;

  // Display name for the trial auto-bonus, e.g. "TRIAL BONUS (TRIAL10) — 10%".
  const trialBonusName = `TRIAL BONUS (${trialAutoCode})`;
  const trialBonusLabel = `${trialBonusName} — ${trialAutoPct}%`;

  const discounted = Math.round(chargeNow * (1 - effPct / 100) * 100) / 100;
  const dueToday = discounted; // always charged today

  const applyCoupon = useCallback(async () => {
    setCouponErr('');
    setCouponMsg('');
    const clean = code.trim();
    if (!clean) { setApplied(null); return; }
    setApplying(true);
    try {
      const res = await fetch('/api/partner/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });
      const data = await res.json();
      if (!data.valid) {
        setApplied(null);
        setCouponErr(data.error || 'That code is invalid.');
        return;
      }
      const m = Array.isArray(data.methods) ? data.methods : [];
      setApplied({ discountPct: data.discountPct || 0, methods: m, label: data.label || '' });
      setCouponMsg(data.label || (data.discountPct > 0 ? `${data.discountPct}% off applied.` : 'Code applied.'));
    } catch {
      setCouponErr('Could not validate the code. Try again.');
    } finally {
      setApplying(false);
    }
  }, [code]);

  // Auto-apply a code passed in the URL.
  useEffect(() => {
    if (initialCoupon) applyCoupon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payDisabled = loading;
  const payLabel = loading ? 'Opening checkout…' : `Pay $${money(discounted)} now`;

  async function handlePay() {
    if (payDisabled) return;
    setLoading(true);
    try {
      // Discount offers are UPI; restrict the modal to UPI so the offer applies.
      const useMethod = discountActive ? 'upi' : undefined;
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle, couponCode: applied ? code.trim() : undefined, method: useMethod }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); setLoading(false); return; }

      const { subscriptionId, keyId, shortUrl } = data;
      if (!razorpayReady || !keyId || !window.Razorpay) {
        if (shortUrl) window.location.href = shortUrl;
        return;
      }

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'PropLogAI',
        description: `Elite Plan (${billingCycle})`,
        theme: { color: '#a78bfa', backdrop_color: 'rgba(0,0,0,0.85)' },
        modal: { confirm_close: true, ondismiss: () => setLoading(false) },
        handler: function (response) {
          const params = new URLSearchParams({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          });
          window.location.href = `/api/razorpay/callback?${params.toString()}`;
        },
      };

      // A discount offer is UPI-only — restrict the modal so it actually applies.
      if (useMethod === 'upi') {
        options.config = {
          display: {
            blocks: {
              chosen: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
            },
            sequence: ['block.chosen'],
            preferences: { show_default_blocks: false },
          },
        };
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (r) {
        alert('Payment failed: ' + (r.error?.description || 'Please try again.'));
        setLoading(false);
      });
      rzp.open();
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
          ✦ Elite
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold text-white">Upgrade to Elite</h1>
        <p className="mt-1 text-sm text-white/50">Unlock AI coaching, calendar insights, exports, and more.</p>
      </div>

      {/* Trial-in-progress prompt */}
      {isTrialing && (
        <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.06] px-5 py-4">
          <p className="text-sm font-semibold text-cyan-300">
            You're on a free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Subscribe any time — you'll be charged today and your plan starts now.
            {trialAutoConfigured && trialAutoPct > 0
              ? ` ${trialBonusLabel} is applied automatically — add a partner or promo code to stack even more off.`
              : ''}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: plan + features */}
        <div className="space-y-4">
          {/* Billing toggle */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-white/55">Billing cycle</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'monthly', label: 'Monthly', sub: `$${money(priceMonthly)}/mo` },
                { id: 'yearly', label: 'Yearly', sub: `$${money(priceYearly)}/mo · billed $${money(yearlyTotal)}` },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBillingCycle(opt.id)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    billingCycle === opt.id
                      ? 'border-cyan-400/50 bg-white/[0.06]'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{opt.label}</span>
                    {opt.id === 'yearly' && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">SAVE 20%</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/45">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-white/55">What's included</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {ELITE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm">
                  <span className="text-base">{f.icon}</span>
                  <span className="text-white/70">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: order summary */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-display text-lg font-semibold text-white">Order summary</h2>

          {/* Coupon */}
          <div className="mt-4">
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/45">Have a code? (optional)</label>
            <div className="flex items-center gap-2">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)); setApplied(null); setCouponMsg(''); setCouponErr(''); }}
                placeholder="Partner or promo code"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-white/90 outline-none focus:border-cyan-400/50"
              />
              <button
                onClick={applyCoupon}
                disabled={applying || !code.trim()}
                className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.1] disabled:opacity-50"
              >
                {applying ? '…' : 'Apply'}
              </button>
            </div>
            {couponErr && <p className="mt-1.5 text-[11px] text-red-300">{couponErr}</p>}
            {couponMsg && <p className="mt-1.5 text-[11px] text-emerald-300">{couponMsg}</p>}
            {!explicitApplied && useAuto && (
              <p className="mt-1.5 text-[11px] text-cyan-300">{trialBonusLabel} applied automatically.</p>
            )}
          </div>

          {/* Breakdown */}
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
            <Row label={`Elite (${billingCycle})`} value={`$${money(chargeNow)}`} />
            {discountActive && (
              <Row
                label={useAuto ? `${trialBonusName} — ${effPct}%` : `Discount (${effPct}%)`}
                value={`-$${money(chargeNow - discounted)}`}
                accent
              />
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="font-semibold text-white">Due today</span>
              <span className="font-display text-2xl font-bold" style={gradientText}>
                ${money(dueToday)}
              </span>
            </div>
          </div>

          {/* Charge note */}
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            {discountActive
              ? `Billed today${useAuto ? ` with your ${trialBonusLabel}` : ' at the discounted rate'} via UPI. Renews at $${money(chargeNow)} ${cycleLabel}. Cancel anytime.`
              : `Billed today. Renews at $${money(chargeNow)} ${cycleLabel}. Cancel anytime.`}
          </p>

          {/* Pay */}
          <button
            onClick={handlePay}
            disabled={payDisabled}
            className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-[#08080f] shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            style={gradientBtn}
          >
            {payLabel}
          </button>
          <p className="mt-3 text-center text-[11px] text-white/30">Secure payment via Razorpay · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{label}</span>
      <span className={accent ? 'font-mono text-emerald-400' : 'font-mono text-white/80'}>{value}</span>
    </div>
  );
}
