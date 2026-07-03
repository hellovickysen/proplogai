"use client";

import { useState } from 'react';
import Link from 'next/link';
import AdminBanButton from '@/components/admin/AdminBanButton';
import { toggleBeta } from '@/app/admin/actions';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
}

function BetaToggle({ userId, initialBeta }) {
  const [isBeta, setIsBeta] = useState(initialBeta);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const res = await toggleBeta(userId, !isBeta);
    if (res.ok) setIsBeta(!isBeta);
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={'rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ' +
        (isBeta
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          : 'border-white/15 bg-white/5 text-white/40 hover:text-white/60')}
      title={isBeta ? 'Click to remove beta access' : 'Click to grant beta access'}
    >
      {loading ? '...' : isBeta ? 'Beta ✓' : 'Beta'}
    </button>
  );
}

export default function AdminUserTabs({ users, search }) {
  const [tab, setTab] = useState('active');
  const active = users.filter((u) => !u.banned);
  const banned = users.filter((u) => u.banned);

  const list = tab === 'active' ? active : banned;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button
          onClick={() => setTab('active')}
          className={'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ' + (tab === 'active' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
        >
          Active Users ({active.length})
        </button>
        <button
          onClick={() => setTab('banned')}
          className={'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ' + (tab === 'banned' ? 'bg-red-500/15 text-red-300' : 'text-white/40 hover:text-white/70')}
        >
          Banned ({banned.length})
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Onboarded</th>
              <th className="px-4 py-3">Trades</th>
              <th className="px-4 py-3">Plan</th>
              {tab === 'banned' && <th className="px-4 py-3">Ban reason</th>}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  {u.full_name && <div className="font-semibold">{u.full_name}</div>}
                  <div className={'font-mono text-xs ' + (u.full_name ? 'text-white/50' : 'font-medium')}>{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={'rounded-full px-2 py-0.5 text-[10px] font-semibold ' + (u.provider === 'google' ? 'bg-blue-500/15 text-blue-300' : 'bg-white/10 text-white/60')}>
                    {u.provider}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-white/55">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3 font-mono text-white/55">{fmtDate(u.last_sign_in)}</td>
                <td className="px-4 py-3 text-center">
                  {u.onboarded
                    ? <span className="text-emerald-400">✓</span>
                    : <span className="text-red-400">✕</span>}
                </td>
                <td className="px-4 py-3 font-mono">{u.trades}</td>
                <td className="px-4 py-3">
                  {u.isAdmin
                    ? <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Admin</span>
                    : <BetaToggle userId={u.id} initialBeta={u.isBeta} />}
                </td>
                {tab === 'banned' && (
                  <td className="max-w-[200px] px-4 py-3 text-xs text-white/50">
                    {u.banReason || <span className="text-white/25">No reason</span>}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={'/admin/users/' + u.id} className="font-mono text-xs text-cyan-400 hover:underline">View</Link>
                    {!u.isAdmin && <AdminBanButton userId={u.id} isBanned={u.banned} email={u.email} />}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={tab === 'banned' ? 9 : 8} className="px-4 py-8 text-center text-white/40">
                {tab === 'banned' ? 'No banned users.' : 'No users found.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
