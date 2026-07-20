"use client";

import { useState } from 'react';
import { saveDiscountSettings } from './actions';

const gradientBtn = { background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' };
const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none focus:border-cyan-400/50';
const labelCls = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/45';

export default function DiscountSettingsClient({ settings }) {
  const [partnerPct, setPartnerPct] = useState(String(settings?.partnerPct ?? 30));
  const [trialAutoPct, setTrialAutoPct] = useState(String(settings?.trialAutoPct ?? 10));
  const [partnerOffer, setPartnerOffer] = useState(settings?.partnerOfferUpi || '');
  const [partnerTrialOffer, setPartnerTrialOffer] = useState(settings?.partnerTrialOfferUpi || '');
  const [trialAutoOffer, setTrialAutoOffer] = useState(settings?.trialAutoOfferUpi || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const pP = Math.round(Number(partnerPct)) || 0;
  const pT = Math.round(Number(trialAutoPct)) || 0;
  const partnerTrialTotal = pP + pT;

  async function handleSave() {
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await saveDiscountSettings({
        partner_pct: partnerPct,
        trial_auto_pct: trialAutoPct,
        partner_offer_upi: partnerOffer,
        partner_trial_offer_upi: partnerTrialOffer,
        trial_auto_offer_upi: trialAutoOffer,
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
      {/* Rates */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-display text-base font-semibold text-white">Rates</h2>
        <p className="mt-1 text-xs text-white/45">
          Partner (influencer) discount, and the trial auto-bonus that stacks on top while a user is still in their free trial.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Partner discount %</label>
            <input type="number" min="1" max="100" value={partnerPct} onChange={(e) => setPartnerPct(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Trial auto-bonus %</label>
            <input type="number" min="0" max="100" value={trialAutoPct} onChange={(e) => setTrialAutoPct(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Offer slots */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-display text-base font-semibold text-white">Razorpay UPI offers</h2>
        <p className="mt-1 text-xs text-white/45">
          Create each offer in the Razorpay Dashboard (Subscriptions → Offers, UPI) at the exact % shown, then paste its Offer Id. Blank = that path charges full price (so the price shown always matches the charge).
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Partner offer — {pP}% (used after trial)</label>
            <input value={partnerOffer} onChange={(e) => setPartnerOffer(e.target.value)} placeholder="offer_XXXXXXXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Partner-in-trial offer — {partnerTrialTotal}% (partner + trial bonus)</label>
            <input value={partnerTrialOffer} onChange={(e) => setPartnerTrialOffer(e.target.value)} placeholder="offer_XXXXXXXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Trial auto-bonus offer — {pT}% (no code, during trial)</label>
            <input value={trialAutoOffer} onChange={(e) => setTrialAutoOffer(e.target.value)} placeholder="offer_XXXXXXXX" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/80">
        Occasion / sitewide promo codes are managed under Promos — each promo also has its own in-trial offer (promo % + {pT}% trial bonus).
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
