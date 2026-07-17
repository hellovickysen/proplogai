"use client";

import { useState, useMemo } from 'react';
import { submitApplication } from '@/app/partner/actions';

const PRICE_MONTHLY = 9.99;
const DEFAULT_RATE = 0.4;
const PORTAL_URL = 'https://partner.proplogai.com';
const AUDIENCE_OPTIONS = ['Under 1,000', '1,000 – 10,000', '10,000 – 50,000', '50,000 – 250,000', '250,000+'];
const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export default function PartnersTab({ affiliate, userEmail }) {
  const status = affiliate?.status || null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">PropLogAI Partner Program</p>
        <h2 className="mt-2 max-w-2xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
          Turn your audience into <span style={gradientText}>lifetime recurring income</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
          Refer traders to PropLogAI and earn <strong className="text-white">40% commission</strong> — every month they stay
          subscribed, for as long as they stay. Monthly and yearly plans both pay out.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: '♾️', t: 'Lifetime recurring', d: 'Paid every renewal, not just once.' },
            { icon: '📈', t: 'Up to 60%', d: 'Top partners earn higher rates.' },
            { icon: '⚡', t: 'Instant setup', d: 'Approved partners get a link + coupon.' },
          ].map((v) => (
            <div key={v.t} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-lg">{v.icon}</div>
              <div className="mt-1 text-sm font-semibold text-white">{v.t}</div>
              <p className="mt-0.5 text-xs text-white/45">{v.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings preview */}
      <EarningsPreview />

      {/* Status / application */}
      {status === 'approved' && <ApprovedCard affiliate={affiliate} />}
      {status === 'pending' && (
        <StatusCard tone="amber" title="Application under review"
          body="Thanks for applying! We review every partner application manually. You'll get an email the moment you're approved — then your link and coupon go live." />
      )}
      {status === 'suspended' && (
        <StatusCard tone="red" title="Account suspended"
          body="Your partner account is currently suspended. Please contact support if you think this is a mistake." />
      )}
      {status === 'rejected' && (
        <StatusCard tone="red" title="Application not approved"
          body="Unfortunately your partner application wasn't approved at this time." />
      )}
      {!status && <ApplicationForm userEmail={userEmail} />}
    </div>
  );
}

/* ─── Interactive earnings preview ─────────────────────────── */
function EarningsPreview() {
  const [refs, setRefs] = useState(25);
  const rate = DEFAULT_RATE;

  const mrr = useMemo(() => refs * PRICE_MONTHLY * rate, [refs, rate]);
  const arr = mrr * 12;
  const milestones = [5, 10, 25, 50, 100];
  const maxMrr = 100 * PRICE_MONTHLY * rate;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h3 className="font-display text-lg font-semibold text-white">See what you could earn</h3>
      <p className="mt-1 text-sm text-white/50">Drag to estimate your monthly recurring commission at 40%.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Slider + numbers */}
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">Active paid referrals</p>
              <p className="font-display text-4xl font-bold text-white">{refs}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">Recurring / month</p>
              <p className="font-display text-4xl font-bold" style={gradientText}>${fmt(mrr)}</p>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={refs}
            onChange={(e) => setRefs(Number(e.target.value))}
            className="mt-4 w-full accent-cyan-400"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-white/35">
            <span>1</span><span>100</span>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-500/[0.05] px-4 py-3">
            <span className="text-sm text-white/60">That's about</span>
            <span className="font-display text-xl font-bold text-emerald-400">${fmt(arr)}/year</span>
          </div>
          <p className="mt-2 text-[11px] text-white/35">
            Recurring — it keeps paying every month those referrals stay subscribed. Referrals on the yearly plan pay even more per signup.
          </p>
        </div>

        {/* Milestone bars */}
        <div className="flex flex-col justify-end">
          <div className="flex h-44 items-end justify-between gap-3">
            {milestones.map((m) => {
              const v = m * PRICE_MONTHLY * rate;
              const h = Math.max(6, (v / maxMrr) * 100);
              const isCurrent = m === nearestMilestone(refs, milestones);
              return (
                <div key={m} className="flex flex-1 flex-col items-center gap-2">
                  <span className={'font-mono text-[10px] ' + (isCurrent ? 'text-cyan-300' : 'text-white/45')}>${fmt(v)}</span>
                  <div className="flex w-full items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${h}%`,
                        background: isCurrent
                          ? 'linear-gradient(180deg,#a78bfa,#22d3ee)'
                          : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-white/45">{m}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-white/35">
            Referrals → monthly recurring
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Application form (reuses the partner submitApplication action) ─── */
function ApplicationForm({ userEmail }) {
  const [form, setForm] = useState({ name: '', email: userEmail || '', social_links: '', audience_size: AUDIENCE_OPTIONS[1] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await submitApplication(form);
    setBusy(false);
    if (res?.error) { setError(res.error); return; }
    setDone(true);
  }

  if (done) {
    return (
      <StatusCard tone="cyan" title="Application received 🎉"
        body="Thanks! We'll review it manually and email you once you're approved. Then your referral link and coupon go live instantly." />
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h3 className="font-display text-lg font-semibold text-white">Apply to become a partner</h3>
      <p className="mt-1 text-sm text-white/50">Tell us about your audience. Approval is manual and usually quick.</p>

      <form onSubmit={onSubmit} className="mt-5 max-w-lg space-y-4">
        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}
        <Field label="Full name">
          <input required value={form.name} onChange={(e) => update('name', e.target.value)} className={FIELD} placeholder="Jane Trader" />
        </Field>
        <Field label="Email">
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={FIELD} placeholder="you@example.com" />
        </Field>
        <Field label="Social links" hint="Telegram, YouTube, X, Instagram, Discord — one per line">
          <textarea required rows={3} value={form.social_links} onChange={(e) => update('social_links', e.target.value)} className={FIELD + ' resize-none'} placeholder="https://t.me/yourchannel" />
        </Field>
        <Field label="Audience size">
          <select value={form.audience_size} onChange={(e) => update('audience_size', e.target.value)} className={FIELD}>
            {AUDIENCE_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0b0b14]">{o}</option>)}
          </select>
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Submitting…' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

function ApprovedCard({ affiliate }) {
  const link = affiliate?.referral_username ? `https://proplogai.com/ref/${affiliate.referral_username}` : '';
  return (
    <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.06] p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <span className="text-lg">✅</span>
        <h3 className="font-display text-lg font-semibold text-white">You're an approved partner</h3>
      </div>
      <p className="mt-2 text-sm text-white/60">
        Manage your links, coupon, stats, and payouts in the partner portal.
      </p>
      {link && (
        <p className="mt-3 font-mono text-xs text-white/50">
          Your link: <span className="text-cyan-300">{link}</span>
        </p>
      )}
      <a
        href={PORTAL_URL + '/dashboard'}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f]"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        Open partner portal →
      </a>
    </div>
  );
}

function StatusCard({ tone, title, body }) {
  const cls = tone === 'red'
    ? 'border-red-400/30 bg-red-500/10'
    : tone === 'amber'
    ? 'border-amber-400/30 bg-amber-500/10'
    : tone === 'cyan'
    ? 'border-cyan-400/25 bg-cyan-500/[0.06]'
    : 'border-white/10 bg-white/[0.03]';
  return (
    <div className={`rounded-2xl border ${cls} p-6 sm:p-8`}>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-white/60">{body}</p>
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

const FIELD = 'w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50';

function fmt(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
function nearestMilestone(refs, milestones) {
  return milestones.reduce((a, b) => (Math.abs(b - refs) < Math.abs(a - refs) ? b : a), milestones[0]);
}
