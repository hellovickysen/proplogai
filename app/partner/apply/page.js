"use client";

import { useState } from 'react';
import Link from 'next/link';
import { submitApplication } from '../actions';

const AUDIENCE_OPTIONS = [
  'Under 1,000',
  '1,000 – 10,000',
  '10,000 – 50,000',
  '50,000 – 250,000',
  '250,000+',
];

export default function ApplyPage() {
  const [form, setForm] = useState({ name: '', email: '', social_links: '', audience_size: AUDIENCE_OPTIONS[1] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await submitApplication(form);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}>
            ✓
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-white">Application received</h1>
          <p className="mt-2 text-sm text-white/60">
            Thanks! We review every application manually. You&apos;ll be notified once you&apos;re approved — then your
            referral link and coupon go live instantly.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.08]"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-14 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/45">Affiliate application</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-white">Become a PropLogAI partner</h1>
      <p className="mt-2 text-sm text-white/55">
        Tell us about you and your audience. Approval is manual and usually quick.
      </p>

      <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Field label="Full name">
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="input"
            placeholder="Jane Trader"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Social links" hint="Telegram, YouTube, X, Instagram, Discord — one per line">
          <textarea
            required
            rows={3}
            value={form.social_links}
            onChange={(e) => update('social_links', e.target.value)}
            className="input resize-none"
            placeholder="https://t.me/yourchannel&#10;https://youtube.com/@you"
          />
        </Field>

        <Field label="Audience size">
          <select
            value={form.audience_size}
            onChange={(e) => update('audience_size', e.target.value)}
            className="input"
          >
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#0b0b14]">
                {o}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
        <p className="mt-3 text-center text-xs text-white/40">
          You must be signed in to your PropLogAI account.{' '}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Log in
          </Link>
        </p>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input:focus {
          border-color: rgba(34, 211, 238, 0.5);
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}
