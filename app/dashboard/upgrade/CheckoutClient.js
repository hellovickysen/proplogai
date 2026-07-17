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

export default function CheckoutClient({ priceMonthly, priceYearly, yearlyTotal, discountPct, initialCoupon }) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [code, setCode] = useState(initialCoupon || '');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(null); // { discountPct } once validated
  const [couponMsg, setCouponMsg] = useState('');
  const [couponErr, setCouponErr] = useState('');
  const [loading, setLoading] = useState(false);
  const razorpayReady = useRazorpayScript();

  const chargeNow = billingCycle === 'yearly' ? yearlyTotal : priceMonthly;
  const effPct = applied?.discountPct || 0;
  const discounted = Math.round(chargeNow * (1 - effPct / 100) * 100) / 100;
  const hasDiscount = !!applied && effPct > 0;

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
      setApplied({ discountPct: data.discountPct || 0 });
      setCouponMsg(data.discountPct > 0
        ? `Code applied — ${data.discountPct}% off, billed today (no free trial).`
        : 'Code applied.');
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

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle, couponCode: applied ? code.trim() : undefined }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); setLoading(false); return; }

      const { subscriptionId, keyId, shortUrl } = data;
      if (!razorpayReady || !keyId || !window.Razorpay) {
        if (shortUrl) window.location.href = shortUrl;
        return;
      }

      const rzp = new window.Razorpay({
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
      });
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
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/45">Partner code</label>
            <div className="flex items-center gap-2">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)); setApplied(null); setCouponMsg(''); setCouponErr(''); }}
                placeholder="Enter code for 5% off"
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
          </div>

          {/* Breakdown */}
          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
            <Row label={`Elite (${billingCycle})`} value={`$${money(chargeNow)}`} />
            {hasDiscount && (
              <Row label={`Partner discount (${effPct}%)`} value={`-$${money(chargeNow - discounted)}`} accent />
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="font-semibold text-white">{hasDiscount ? 'Total due today' : 'Due today'}</span>
              <span className="font-display text-2xl font-bold" style={gradientText}>
                ${hasDiscount ? money(discounted) : (billingCycle ? '0.00' : money(chargeNow))}
              </span>
            </div>
          </div>

          {/* Trial / charge note */}
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            {hasDiscount
              ? `Discounted plans are billed today — no free trial. Renews at $${money(chargeNow)} ${billingCycle === 'yearly' ? '/year' : '/month'}.`
              : `Start with a 14-day free trial — $0 today. You'll be charged $${money(chargeNow)} ${billingCycle === 'yearly' ? '/year' : '/month'} when it ends. Cancel anytime.`}
          </p>

          {/* Pay */}
          <button
            onClick={handlePay}
            disabled={loading}
            className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-[#08080f] shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
            style={gradientBtn}
          >
            {loading ? 'Opening checkout…' : hasDiscount ? `Pay $${money(discounted)} now` : 'Start 14-day free trial'}
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
