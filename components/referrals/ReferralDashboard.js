"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateReferralCode } from '@/app/dashboard/referrals/actions';
import { useToast } from '@/components/ui/Toast';
import { ReferralEmptyIcon } from '@/components/ui/EmptyStates';


const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none';

function trimEmail(email) {
  if (!email) return '***@***';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const trimmed = local.length > 3 ? local.slice(0, 3) + '***' : local + '***';
  return trimmed + '@' + domain;
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
}

export default function ReferralDashboard({ code, referrals, balance, embedded = false }) {
  const router = useRouter();
  const toast = useToast();
  const [refCode, setRefCode] = useState(code);
  const [generating, setGenerating] = useState(false);

  const referralUrl = refCode ? (typeof window !== 'undefined' ? window.location.origin : '') + '/r/' + refCode : '';
  const completed = referrals.filter((r) => r.status === 'completed').length;
  const pending = referrals.filter((r) => r.status === 'pending').length;
  const totalEarned = completed; // $1 per completed referral

  async function handleGenerate() {
    setGenerating(true);
    const res = await generateReferralCode();
    if (res.error) { if (toast) toast.error(res.error); }
    else { setRefCode(res.code); if (toast) toast.success('Referral code generated!'); }
    setGenerating(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl);
    if (toast) toast.success('Referral link copied!');
  }

  return (
    <div className={embedded ? '' : 'px-4 sm:px-6 py-8'}>
      {!embedded && (
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Referrals</h1>
          <p className="mt-1 text-sm text-white/55">Invite traders and earn $1 when they log their first 3 trades</p>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5 text-center">
          <div className="font-display text-2xl font-bold">{referrals.length}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/45">Invited</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-5 text-center">
          <div className="font-display text-2xl font-bold text-amber-400">{pending}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/45">Pending</div>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 p-3 sm:p-5 text-center" style={{ background: 'rgba(52,211,153,0.05)' }}>
          <div className="font-display text-2xl font-bold text-emerald-400">{completed}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/45">Completed</div>
        </div>
        <div className="rounded-2xl border border-violet-400/20 p-3 sm:p-5 text-center" style={{ background: 'rgba(139,92,246,0.05)' }}>
          <div className="font-display text-2xl font-bold" style={gradientText}>${balance.toFixed(2)}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/45">Credit Balance</div>
        </div>
      </div>

      {/* Credit usage note */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-500/[0.04] px-4 py-3">
        <span className="mt-0.5 text-sm">ℹ️</span>
        <p className="text-xs text-white/50">Credits can only be used within the PropLogAI platform — for Pro subscription discounts and premium features. Credits are non-transferable and cannot be withdrawn as cash. See our <a href="/terms" className="text-cyan-400 hover:underline">Terms of Service</a> for details.</p>
      </div>

      {/* Referral link */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-1 font-display text-base font-semibold">Your referral link</h2>
        <p className="mb-4 text-xs text-white/40">Share this link — when someone signs up and logs 3 trades, you both get $1 credit</p>
        {refCode ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className={field + ' flex-1 bg-white/[0.02] text-white/70'} value={referralUrl} readOnly />
            <button onClick={handleCopy} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              Copy
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {generating ? 'Generating...' : 'Generate referral link'}
          </button>
        )}
      </div>

      {/* How it works */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-display text-base font-semibold">How it works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: '1', title: 'Share your link', desc: 'Send your referral link to a fellow trader' },
            { n: '2', title: 'They sign up', desc: 'Your friend creates an account via your link' },
            { n: '3', title: 'Both earn $1', desc: 'When they log 3 trades, you both get $1 platform credit' },
          ].map((step) => (
            <div key={step.n} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-2 font-display text-xl font-bold" style={gradientText}>{step.n}</div>
              <div className="text-sm font-semibold">{step.title}</div>
              <p className="mt-0.5 text-xs text-white/40">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral list */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="mb-4 font-display text-base font-semibold">Your referrals</h2>
        {referrals.length === 0 ? (
          <div className="py-6 text-center">
            <ReferralEmptyIcon />
            <p className="mt-4 text-sm text-white/40">No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3 sm:px-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.06] font-mono text-sm text-white/50">
                    {(r.referred_email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="truncate font-mono text-sm">{trimEmail(r.referred_email)}</div>
                    <div className="font-mono text-[11px] text-white/35">{fmtDate(r.created_at)}</div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-3">
                  {r.status === 'completed' && (
                    <span className="font-mono text-xs font-bold text-emerald-400">+$1.00</span>
                  )}
                  <span className={'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ' + (r.status === 'completed' ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border-amber-400/30 bg-amber-500/15 text-amber-300')}>
                    {r.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
