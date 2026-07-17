"use client";

import { useState } from 'react';
import { saveProfile } from '../actions';

const FIELD = 'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50';
const AUDIENCE_OPTIONS = ['Under 1,000', '1,000 – 10,000', '10,000 – 50,000', '50,000 – 250,000', '250,000+'];

export default function SettingsClient({ initial }) {
  const [form, setForm] = useState({
    name: initial.name,
    social_links: initial.social_links,
    audience_size: initial.audience_size || AUDIENCE_OPTIONS[1],
    payout_method: initial.payout_method,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function u(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    const res = await saveProfile(form);
    setBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setMsg('Saved');
    setTimeout(() => setMsg(''), 1800);
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Read-only account facts */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Account email" value={initial.email} />
          <Info label="Coupon / username" value={initial.referral_username || '—'} />
          <Info label="Status" value={initial.status} />
        </div>
        <p className="mt-2 text-[11px] text-white/35">Your account email and referral username can't be changed here.</p>
      </div>

      {/* Editable profile */}
      <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        {err && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{err}</div>}
        {msg && <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</div>}

        <Field label="Display name">
          <input required value={form.name} onChange={(e) => u('name', e.target.value)} className={FIELD} placeholder="Jane Trader" />
        </Field>
        <Field label="Social links" hint="Telegram, YouTube, X, Instagram, Discord — one per line">
          <textarea required rows={3} value={form.social_links} onChange={(e) => u('social_links', e.target.value)} className={FIELD + ' resize-none'} />
        </Field>
        <Field label="Audience size">
          <select value={form.audience_size} onChange={(e) => u('audience_size', e.target.value)} className={FIELD}>
            {AUDIENCE_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0b0b14]">{o}</option>)}
          </select>
        </Field>
        <Field label="Default payout method" hint="How you'd like to be paid — e.g. UPI id, PayPal email, or bank details.">
          <input value={form.payout_method} onChange={(e) => u('payout_method', e.target.value)} className={FIELD} placeholder="UPI: you@bank / PayPal: you@email.com" />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-0.5 text-sm capitalize text-white/80 break-words">{value}</p>
    </div>
  );
}
