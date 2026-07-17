"use client";

import { useState } from 'react';
import { saveCoupon, requestPayout } from '../actions';

export default function AffiliateClient({ coupon, stats, hasOpenPayout, discountPct = 5 }) {
  return (
    <div className="space-y-6">
      {/* Share tools */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CouponCard initial={coupon} discountPct={discountPct} />
        <HowItWorks discountPct={discountPct} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Referred" value={stats.referred} />
        <Stat label="Active subs" value={stats.activeSubs} />
        <Stat label="Paid users" value={stats.paidUsers} />
        <Stat label="Pending" value={`$${money(stats.pendingCommission)}`} accent="cyan" />
        <Stat label="Lifetime" value={`$${money(stats.lifetimeEarnings)}`} accent="emerald" />
      </div>

      <PayoutCard available={stats.pendingCommission} hasOpenPayout={hasOpenPayout} />
    </div>
  );
}

/* ─── Coupon editor (the partner's share tool) ─────────────── */
function CouponCard({ initial, discountPct }) {
  const [code, setCode] = useState(initial || '');
  const [editing, setEditing] = useState(!initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  async function save() {
    setErr('');
    setMsg('');
    setBusy(true);
    const res = await saveCoupon(code);
    setBusy(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    setMsg('Saved');
    setEditing(false);
    setTimeout(() => setMsg(''), 1600);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-white/55">Your coupon code</p>
        <span className="font-mono text-[10px] text-emerald-300/80">buyers get {discountPct}% off</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={code}
          disabled={!editing || busy}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
          placeholder="YOURCODE"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-white/90 outline-none focus:border-cyan-400/50 disabled:opacity-70"
        />
        {editing ? (
          <button
            onClick={save}
            disabled={busy}
            className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#08080f] disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {busy ? '…' : 'Save'}
          </button>
        ) : (
          <>
            <button
              onClick={copy}
              className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#08080f]"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex-shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
            >
              Edit
            </button>
          </>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      {msg && <p className="mt-2 text-xs text-emerald-300">{msg}</p>}
      {!err && !msg && (
        <p className="mt-2 text-[11px] text-white/35">3–20 letters/numbers. Editable once every 30 days.</p>
      )}
    </div>
  );
}

/* ─── How it works ─────────────────────────────────────────── */
function HowItWorks({ discountPct }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-3 font-mono text-xs uppercase tracking-wider text-white/55">How you earn</p>
      <ol className="space-y-2 text-sm text-white/65">
        <li className="flex gap-2.5"><Dot n="1" /> Share your coupon code with your audience.</li>
        <li className="flex gap-2.5"><Dot n="2" /> They enter it at checkout and get <strong className="text-white">{discountPct}% off</strong> their first payment.</li>
        <li className="flex gap-2.5"><Dot n="3" /> You earn recurring commission for as long as they stay subscribed.</li>
      </ol>
    </div>
  );
}

function Dot({ n }) {
  return (
    <span
      className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold text-[#08080f]"
      style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
    >
      {n}
    </span>
  );
}

/* ─── Payout ───────────────────────────────────────────────── */
function PayoutCard({ available, hasOpenPayout }) {
  const [method, setMethod] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(hasOpenPayout);

  async function submit() {
    setErr('');
    setBusy(true);
    const res = await requestPayout(method);
    setBusy(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    setOk(true);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-white/55">Available to withdraw</p>
          <p className="mt-1 font-display text-3xl font-bold text-cyan-300">${money(available)}</p>
        </div>
        {ok ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            Payout request submitted — an admin will process it shortly.
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Payout method (PayPal / UPI / bank)"
              className="w-56 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/85 outline-none focus:border-cyan-400/50"
            />
            <button
              onClick={submit}
              disabled={busy || available <= 0}
              className="flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#08080f] disabled:opacity-50"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              {busy ? '…' : 'Request payout'}
            </button>
          </div>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
    </div>
  );
}

function Stat({ label, value, accent }) {
  const color = accent === 'cyan' ? 'text-cyan-300' : accent === 'emerald' ? 'text-emerald-400' : 'text-white';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function money(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}
