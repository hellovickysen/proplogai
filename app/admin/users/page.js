import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
}

export default async function AdminUsersPage({ searchParams }) {
  const sb = createAdminClient();
  const search = (searchParams && searchParams.q) || '';

  // Get all users from auth.users via admin API
  const { data: authData } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = authData?.users || [];

  // Get trade counts per user
  const { data: tradeCounts } = await sb.rpc('admin_user_trade_counts').catch(() => ({ data: null }));

  // Fallback: count trades per user manually if RPC doesn't exist
  let tradeMap = {};
  let journalMap = {};
  let insightMap = {};
  if (!tradeCounts) {
    const { data: trades } = await sb.from('trades').select('user_id');
    (trades || []).forEach((t) => { tradeMap[t.user_id] = (tradeMap[t.user_id] || 0) + 1; });
    const { data: journals } = await sb.from('journal_entries').select('user_id');
    (journals || []).forEach((j) => { journalMap[j.user_id] = (journalMap[j.user_id] || 0) + 1; });
    const { data: insights } = await sb.from('ai_insights').select('user_id');
    (insights || []).forEach((i) => { insightMap[i.user_id] = (insightMap[i.user_id] || 0) + 1; });
  }

  // Build user rows
  let users = authUsers.map((u) => ({
    id: u.id,
    email: u.email || '(no email)',
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    provider: u.app_metadata?.provider || 'email',
    trades: tradeMap[u.id] || 0,
    journals: journalMap[u.id] || 0,
    insights: insightMap[u.id] || 0,
  }));

  // Search filter
  if (search) {
    const q = search.toLowerCase();
    users = users.filter((u) => u.email.toLowerCase().includes(q));
  }

  // Sort by signup date (newest first)
  users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-white/50">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by email…"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
          />
          <button type="submit" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white">
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Trades</th>
              <th className="px-4 py-3">Journals</th>
              <th className="px-4 py-3">AI</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={'rounded-full px-2 py-0.5 text-[10px] font-semibold ' + (u.provider === 'google' ? 'bg-blue-500/15 text-blue-300' : 'bg-white/10 text-white/60')}>
                    {u.provider}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-white/55">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3 font-mono text-white/55">{fmtDate(u.last_sign_in)}</td>
                <td className="px-4 py-3 font-mono">{u.trades}</td>
                <td className="px-4 py-3 font-mono">{u.journals}</td>
                <td className="px-4 py-3 font-mono">{u.insights}</td>
                <td className="px-4 py-3">
                  <Link href={'/admin/users/' + u.id} className="font-mono text-xs text-cyan-400 hover:underline">View →</Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-white/40">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
