"use client";

import { useState, useTransition } from 'react';
import {
  setAffiliateStatus,
  setCommissionRate,
  deleteAffiliate,
  updatePayoutStatus,
} from './actions';

export default function AdminAffiliatesClient({ affiliates, payouts }) {
  const [tab, setTab] = useState('applications');
  const pending = affiliates.filter((a) => a.status === 'pending');
  const others = affiliates.filter((a) => a.status !== 'pending');
  const openPayouts = payouts.filter((p) => p.status === 'requested' || p.status === 'approved');

  const tabs = [
    { id: 'applications', label: `Applications (${pending.length})` },
    { id: 'affiliates', label: `All affiliates (${others.length})` },
    { id: 'payouts', label: `Payouts (${openPayouts.length})` },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-white/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === t.id ? 'border-cyan-400 text-white' : 'border-transparent text-white/50 hover:text-white/75'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'applications' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <Empty text="No pending applications." />
          ) : (
            pending.map((a) => <ApplicationCard key={a.id} aff={a} />)
          )}
        </div>
      )}

      {tab === 'affiliates' && (
        <div className="space-y-3">
          {others.length === 0 ? (
            <Empty text="No affiliates yet." />
          ) : (
            others.map((a) => <AffiliateRow key={a.id} aff={a} />)
          )}
        </div>
      )}

      {tab === 'payouts' && (
        <div className="space-y-3">
          {payouts.length === 0 ? (
            <Empty text="No payout requests." />
          ) : (
            payouts.map((p) => <PayoutRow key={p.id} payout={p} />)
          )}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ aff }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  function act(fn) {
    start(async () => {
      const res = await fn();
      if (res?.error) setMsg(res.error);
    });
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-white">{aff.name || '—'}</p>
          <p className="text-sm text-white/55">{aff.email}</p>
          <p className="mt-1 text-xs text-white/45">Audience: {aff.audience_size || '—'}</p>
          {aff.social_links && (
            <p className="mt-2 whitespace-pre-wrap break-words font-mono text-[11px] text-cyan-400/70">{aff.social_links}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={() => act(() => setAffiliateStatus(aff.id, 'approved'))}
            disabled={pending}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            Approve
          </button>
          <button
            onClick={() => act(() => setAffiliateStatus(aff.id, 'rejected'))}
            disabled={pending}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-300 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
    </div>
  );
}

function AffiliateRow({ aff }) {
  const [pending, start] = useTransition();
  const [rate, setRate] = useState(Math.round((aff.commission_rate || 0) * 100));
  const [msg, setMsg] = useState('');

  function act(fn) {
    setMsg('');
    start(async () => {
      const res = await fn();
      if (res?.error) setMsg(res.error);
    });
  }
  function onDelete() {
    if (!window.confirm(`Delete affiliate "${aff.referral_username || aff.email}"? This removes all their data and cannot be undone.`)) return;
    act(() => deleteAffiliate(aff.id));
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-semibold text-white">{aff.referral_username || aff.name}</p>
            <StatusPill status={aff.status} />
          </div>
          <p className="text-sm text-white/55">{aff.email}</p>
          <p className="mt-1 font-mono text-[11px] text-white/45">
            Pending ${aff.pending.toFixed(2)} · Paid ${aff.paid.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <input
              type="number"
              min={0}
              max={60}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-14 bg-transparent text-sm text-white outline-none"
            />
            <span className="text-xs text-white/45">%</span>
            <button
              onClick={() => act(() => setCommissionRate(aff.id, rate))}
              disabled={pending}
              className="ml-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/15 disabled:opacity-60"
            >
              Set
            </button>
          </div>

          {aff.status === 'approved' ? (
            <button
              onClick={() => act(() => setAffiliateStatus(aff.id, 'suspended'))}
              disabled={pending}
              className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 disabled:opacity-60"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={() => act(() => setAffiliateStatus(aff.id, 'approved'))}
              disabled={pending}
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 disabled:opacity-60"
            >
              Approve
            </button>
          )}
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

function PayoutRow({ payout }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  function act(status) {
    setMsg('');
    start(async () => {
      const res = await updatePayoutStatus(payout.id, status);
      if (res?.error) setMsg(res.error);
    });
  }
  const done = payout.status === 'paid' || payout.status === 'rejected';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-semibold text-white">${(Number(payout.amount) || 0).toFixed(2)}</p>
            <StatusPill status={payout.status} />
          </div>
          <p className="text-sm text-white/55">{payout.affiliateName}</p>
          <p className="mt-1 text-xs text-white/45">Method: {payout.method || '—'}</p>
        </div>
        {!done && (
          <div className="flex flex-shrink-0 gap-2">
            {payout.status === 'requested' && (
              <button
                onClick={() => act('approved')}
                disabled={pending}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-300 disabled:opacity-60"
              >
                Approve
              </button>
            )}
            <button
              onClick={() => act('paid')}
              disabled={pending}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-60"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              Mark paid
            </button>
            <button
              onClick={() => act('rejected')}
              disabled={pending}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 disabled:opacity-60"
            >
              Reject
            </button>
          </div>
        )}
      </div>
      {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    approved: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
    suspended: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    rejected: 'text-red-300 border-red-400/30 bg-red-500/10',
    paid: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
    requested: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${map[status] || 'text-white/60 border-white/15 bg-white/5'}`}>
      {status}
    </span>
  );
}

function Empty({ text }) {
  return <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-white/45">{text}</p>;
}
