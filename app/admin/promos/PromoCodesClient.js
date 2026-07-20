"use client";

import { useState, useTransition } from 'react';
import { createPromo, updatePromo, togglePromo, deletePromo } from './actions';

const FIELD = 'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50';

export default function PromoCodesClient({ promos, trialAutoPct = 0 }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {showCreate ? 'Close' : '+ New promo code'}
        </button>
      </div>

      {showCreate && (
        <PromoForm
          mode="create"
          trialAutoPct={trialAutoPct}
          onDone={() => setShowCreate(false)}
        />
      )}

      <div className="space-y-3">
        {promos.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-white/45">
            No promo codes yet. Create one above.
          </p>
        ) : (
          promos.map((p) => <PromoRow key={p.id} promo={p} trialAutoPct={trialAutoPct} />)
        )}
      </div>
    </div>
  );
}

function PromoRow({ promo, trialAutoPct }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');

  function act(fn) {
    setMsg('');
    start(async () => {
      const res = await fn();
      if (res?.error) setMsg(res.error);
    });
  }

  function onDelete() {
    if (!window.confirm(`Delete promo code "${promo.code}"? This cannot be undone.`)) return;
    act(() => deletePromo(promo.id));
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-cyan-400/25 bg-white/[0.03] p-5">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-white/55">Edit {promo.code}</p>
        <PromoForm mode="edit" promo={promo} trialAutoPct={trialAutoPct} onDone={() => setEditing(false)} />
      </div>
    );
  }

  const now = Date.now();
  const notStarted = promo.starts_at && new Date(promo.starts_at).getTime() > now;
  const expired = promo.expires_at && new Date(promo.expires_at).getTime() < now;
  const maxedOut = promo.max_redemptions != null && (promo.redeemed_count || 0) >= promo.max_redemptions;
  const hasOffer = !!(promo.razorpay_offer_id || promo.razorpay_offer_id_upi);
  const methods = [promo.razorpay_offer_id ? 'Card' : null, promo.razorpay_offer_id_upi ? 'UPI' : null].filter(Boolean);
  const live = promo.active && !notStarted && !expired && !maxedOut && hasOffer;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-base font-bold tracking-wider text-white">{promo.code}</span>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
              {Math.round(Number(promo.discount_pct) || 0)}% off
            </span>
            <Status live={live} active={promo.active} notStarted={notStarted} expired={expired} maxedOut={maxedOut} hasOffer={hasOffer} />
          </div>
          {promo.label && <p className="mt-1 text-sm text-white/55">{promo.label}</p>}
          <p className="mt-1 font-mono text-[11px] text-white/40">
            Methods: {methods.length ? methods.join(' + ') : '— none —'}
            {promo.razorpay_offer_id_upi_trial ? ' · in-trial UPI ✓' : ' · in-trial UPI —'}
            {' '}· Used {promo.redeemed_count || 0}{promo.max_redemptions != null ? ` / ${promo.max_redemptions}` : ''}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-white/35">
            {fmtWindow(promo.starts_at, promo.expires_at)}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => act(() => togglePromo(promo.id, !promo.active))}
            disabled={pending}
            className={'rounded-xl border px-3 py-2 text-xs font-medium disabled:opacity-60 ' +
              (promo.active
                ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300')}
          >
            {promo.active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setEditing(true)}
            disabled={pending}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            disabled={pending}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
    </div>
  );
}

function PromoForm({ mode, promo, trialAutoPct = 0, onDone }) {
  const [form, setForm] = useState({
    code: promo?.code || '',
    label: promo?.label || '',
    discount_pct: promo?.discount_pct != null ? String(Math.round(Number(promo.discount_pct))) : '',
    razorpay_offer_id: promo?.razorpay_offer_id || '',
    razorpay_offer_id_upi: promo?.razorpay_offer_id_upi || '',
    razorpay_offer_id_upi_trial: promo?.razorpay_offer_id_upi_trial || '',
    starts_at: promo?.starts_at ? String(promo.starts_at).slice(0, 10) : '',
    expires_at: promo?.expires_at ? String(promo.expires_at).slice(0, 10) : '',
    max_redemptions: promo?.max_redemptions != null ? String(promo.max_redemptions) : '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function u(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const basePct = Math.round(Number(form.discount_pct)) || 0;
  const inTrialPct = basePct + (Math.round(Number(trialAutoPct)) || 0);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const res = mode === 'create' ? await createPromo(form) : await updatePromo(promo.id, form);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    onDone?.();
  }

  return (
    <form onSubmit={submit} className={mode === 'create' ? 'rounded-2xl border border-white/10 bg-white/[0.03] p-5' : ''}>
      {mode === 'create' && <p className="mb-4 font-mono text-xs uppercase tracking-wider text-white/55">New promo code</p>}
      {err && <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{err}</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Code</label>
          <input
            value={form.code}
            onChange={(e) => u('code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
            disabled={mode === 'edit'}
            placeholder="DIWALI50"
            className={FIELD + ' font-mono uppercase tracking-wider ' + (mode === 'edit' ? 'opacity-60' : '')}
          />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Discount %</label>
          <input type="number" min={1} max={100} value={form.discount_pct} onChange={(e) => u('discount_pct', e.target.value)} placeholder="50" className={FIELD} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Razorpay Offer Id — Card</label>
          <input value={form.razorpay_offer_id} onChange={(e) => u('razorpay_offer_id', e.target.value)} placeholder="offer_XXXX (Card)" className={FIELD + ' font-mono'} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Razorpay Offer Id — UPI ({basePct}%)</label>
          <input value={form.razorpay_offer_id_upi} onChange={(e) => u('razorpay_offer_id_upi', e.target.value)} placeholder="offer_XXXX (UPI)" className={FIELD + ' font-mono'} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Razorpay Offer Id — UPI in-trial ({inTrialPct}% = code + {Math.round(Number(trialAutoPct)) || 0}% trial bonus)</label>
          <input value={form.razorpay_offer_id_upi_trial} onChange={(e) => u('razorpay_offer_id_upi_trial', e.target.value)} placeholder="offer_XXXX (UPI, used during a trial)" className={FIELD + ' font-mono'} />
        </div>
        <p className="sm:col-span-2 -mt-1 text-[11px] text-white/35">
          Create a subscription offer in Razorpay → Subscriptions → Offers for each payment method, then paste the Offer Id(s). Enter at least one of Card/UPI. The in-trial UPI offer (optional) is used when someone redeems this code while still in their free trial, where the {Math.round(Number(trialAutoPct)) || 0}% trial bonus stacks on top — create it at {inTrialPct}%.
        </p>
        <div className="sm:col-span-2">
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Label (internal, optional)</label>
          <input value={form.label} onChange={(e) => u('label', e.target.value)} placeholder="Diwali 2026 campaign" className={FIELD} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Starts (optional)</label>
          <input type="date" value={form.starts_at} onChange={(e) => u('starts_at', e.target.value)} className={FIELD} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Expires (optional)</label>
          <input type="date" value={form.expires_at} onChange={(e) => u('expires_at', e.target.value)} className={FIELD} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-white/50">Max redemptions (optional)</label>
          <input type="number" min={1} value={form.max_redemptions} onChange={(e) => u('max_redemptions', e.target.value)} placeholder="unlimited" className={FIELD} />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Saving…' : mode === 'create' ? 'Create code' : 'Save changes'}
        </button>
        <button type="button" onClick={() => onDone?.()} className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/70 hover:bg-white/[0.08]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function Status({ live, active, notStarted, expired, maxedOut, hasOffer }) {
  let label = 'Live', cls = 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10';
  if (!active) { label = 'Inactive'; cls = 'text-white/60 border-white/15 bg-white/5'; }
  else if (!hasOffer) { label = 'No offer'; cls = 'text-red-300 border-red-400/30 bg-red-500/10'; }
  else if (expired) { label = 'Expired'; cls = 'text-red-300 border-red-400/30 bg-red-500/10'; }
  else if (maxedOut) { label = 'Maxed out'; cls = 'text-amber-300 border-amber-400/30 bg-amber-500/10'; }
  else if (notStarted) { label = 'Scheduled'; cls = 'text-amber-300 border-amber-400/30 bg-amber-500/10'; }
  else if (live) { label = 'Live'; }
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{label}</span>;
}

function fmtWindow(s, e) {
  const f = (d) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return '—'; } };
  if (!s && !e) return 'No date limits';
  if (s && e) return `${f(s)} → ${f(e)}`;
  if (s) return `From ${f(s)}`;
  return `Until ${f(e)}`;
}
