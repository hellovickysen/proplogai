import Link from 'next/link';
import { createAdminClient, isAdminConfigured, ADMIN_EMAIL } from '@/lib/supabase/admin';
import AdminBanButton from '@/components/AdminBanButton';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
}

export default async function AdminUsersPage({ searchParams }) {
  if (!isAdminConfigured()) return <div className="p-8 text-white/55">Add SUPABASE_SERVICE_ROLE_KEY to Vercel first.</div>;
  const sb = createAdminClient();
  if (!sb) return <div className="p-8 text-white/55">Admin client unavailable.</div>;

  const search = (searchParams && searchParams.q) || '';

  try {
    // Get users from auth
    let authUsers = [];
    let authError = null;
    const authRes = await sb.auth.admin.listUsers({ page: 1, perPage: 500 });
    if (authRes.error) {
      authError = authRes.error.message;
      // Fallback: get unique user_ids from trades
      const { data: tradeUsers } = await sb.from('trades').select('user_id').limit(1000);
      const uniqueIds = [...new Set((tradeUsers || []).map(t => t.user_id))];
      authUsers = uniqueIds.map(id => ({ id, email: id.slice(0, 8) + '…', created_at: null, last_sign_in_at: null, app_metadata: {} }));
    } else {
      authUsers = authRes.data?.users || [];
    }

    // Get counts per user
    let tradeMap = {};
    let journalMap = {};
    let insightMap = {};
    try {
      const { data: trades } = await sb.from('trades').select('user_id');
      (trades || []).forEach((t) => { tradeMap[t.user_id] = (tradeMap[t.user_id] || 0) + 1; });
    } catch {}
    try {
      const { data: journals } = await sb.from('journal_entries').select('user_id');
      (journals || []).forEach((j) => { journalMap[j.user_id] = (journalMap[j.user_id] || 0) + 1; });
    } catch {}
    try {
      const { data: insights } = await sb.from('ai_insights').select('user_id');
      (insights || []).forEach((i) => { insightMap[i.user_id] = (insightMap[i.user_id] || 0) + 1; });
    } catch {}

    // Onboarding status
    let onboardMap = {};
    try {
      const { data: prefs } = await sb.from('user_preferences').select('user_id, onboarding_complete');
      (prefs || []).forEach((p) => { onboardMap[p.user_id] = !!p.onboarding_complete; });
    } catch {}

    let users = authUsers.map((u) => ({
      id: u.id,
      email: u.email || '(no email)',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      provider: u.app_metadata?.provider || 'email',
      trades: tradeMap[u.id] || 0,
      journals: journalMap[u.id] || 0,
      insights: insightMap[u.id] || 0,
      onboarded: onboardMap[u.id] || false,
      banned: !!u.banned_until,
      isAdmin: u.email === ADMIN_EMAIL,
    }));

    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.email.toLowerCase().includes(q));
    }

    users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Users</h1>
            <p className="mt-1 text-sm text-white/50">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
          </div>
          <form className="flex gap-2">
            <input name="q" defaultValue={search} placeholder="Search by email…" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60" />
            <button type="submit" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white">Search</button>
          </form>
        </div>

        {authError && (
        <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
          Auth API warning: {authError}. Showing users from trade data as fallback.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3">Onboarded</th>
                <th className="px-4 py-3">Trades</th>
                <th className="px-4 py-3">Journals</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">Status</th>
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
                  <td className="px-4 py-3 text-center">
                    {u.onboarded
                      ? <span className="text-emerald-400" title="Onboarded">✓</span>
                      : <span className="text-red-400" title="Not onboarded">✕</span>}
                  </td>
                  <td className="px-4 py-3 font-mono">{u.trades}</td>
                  <td className="px-4 py-3 font-mono">{u.journals}</td>
                  <td className="px-4 py-3 font-mono">{u.insights}</td>
                  <td className="px-4 py-3">
                    {u.banned ? (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300">Banned</span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={'/admin/users/' + u.id} className="font-mono text-xs text-cyan-400 hover:underline">View</Link>
                      {!u.isAdmin && <AdminBanButton userId={u.id} isBanned={u.banned} email={u.email} />}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-white/40">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-8">
        <h2 className="font-display text-lg font-bold text-red-300">Error loading users</h2>
        <p className="mt-2 text-sm text-white/55">{err?.message || 'Check Vercel logs.'}</p>
      </div>
    );
  }
}
