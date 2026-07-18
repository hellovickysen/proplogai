"use client";

import { useState } from 'react';
import { saveDiscountSettings } from './actions';

const gradientBtn = { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' };
const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none focus:border-cyan-400/50';
const labelCls = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/45';

export default function DiscountSettingsClient({ settings }) {
  const [partnerPct, setPartnerPct] = useState(String(settings?.partnerTrialPct ?? 30));
  const [partnerOffer, setPartnerOffer] = useState(settings?.partnerTrialOfferIdUpi || '');
  const [defaultPct, setDefaultPct] = useState(String(settings?.defaultPct ?? 15));
  const [defaultOffer, setDefaultOffer] = useState(settings?.defaultOfferIdUpi || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function handleSave() {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await saveDiscountSettings({
        partner_trial_pct: partnerPct,
        partner_trial_offer_id_upi: partnerOffer,
        default_pct: defaultPct,
        default_offer_id_upi: defaultOffer,
      });
      if (res?.error) setErr(res.error);
      else setMsg('Saved.');
    } catch {
      setErr('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Partner (trial) rate */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-display text-base font-semibold text-white">Partner rate — during trial</h2>
        <p className="mt-1 text-xs text-white/45">
          What a partner (influencer) code gives while the buyer is still in their free trial. Allowed range 30–50%.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Discount %</label>
            <input type="number" min="30" max="50" value={partnerPct} onChange={(e) => setPartnerPct(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Razorpay UPI Offer Id</label>
            <input value={partnerOffer} onChange={(e) => setPartnerOffer(e.target.value)} placeholder="offer_XXXXXXXX" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Default (post-trial) rate */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-display text-base font-semibold text-white">Default rate — after trial</h2>
        <p className="mt-1 text-xs text-white/45">
          What partner codes fall back to once the trial has ended (the FOMO floor). Applies to any partner code post-trial.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Discount %</label>
            <input type="number" min="1" max="100" value={defaultPct} onChange={(e) => setDefaultPct(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Razorpay UPI Offer Id</label>
            <input value={defaultOffer} onChange={(e) => setDefaultOffer(e.target.value)} placeholder="offer_XXXXXXXX" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
        Create each offer in the Razorpay Dashboard first (Subscriptions → Offers, UPI), then paste its Offer Id here.
        If an Offer Id is blank, that tier shows no discount at checkout (so the price shown always matches the charge).
      </div>

      {err && <p className="text-sm text-red-300">{err}</p>}
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#08080f] disabled:opacity-50"
        style={gradientBtn}
      >
        {saving ? 'Saving…' : 'Save discount settings'}
      </button>
    </div>
  );
}
