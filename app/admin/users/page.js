import { createAdminClient, isAdminConfigured, ADMIN_EMAIL } from '@/lib/supabase/admin';
import AdminUserTabs from '@/components/admin/AdminUserTabs';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }) {
  if (!isAdminConfigured()) return <div className="p-8 text-white/55">Add SUPABASE_SERVICE_ROLE_KEY to Vercel first.</div>;
  const sb = createAdminClient();
  if (!sb) return <div className="p-8 text-white/55">Admin client unavailable.</div>;

  const search = (searchParams && searchParams.q) || '';

  try {
    // Query auth.users directly via SQL function (more reliable than listUsers API)
    const { data: authUsers, error: authError } = await sb.rpc('admin_list_users');

    if (authError) {
      return (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-8">
          <h2 className="font-display text-lg font-bold text-red-300">Error loading users</h2>
          <p className="mt-2 text-sm text-white/55">{authError.message}</p>
        </div>
      );
    }

    // Enrich with trade counts
    let tradeMap = {};
    try {
      const { data: trades } = await sb.from('trades').select('user_id');
      (trades || []).forEach((t) => { tradeMap[t.user_id] = (tradeMap[t.user_id] || 0) + 1; });
    } catch {}

    // Enrich with onboarding status
    let onboardMap = {};
    let prefNameMap = {};
    try {
      const { data: prefs } = await sb.from('user_preferences').select('user_id, onboarding_complete, full_name');
      (prefs || []).forEach((p) => {
        onboardMap[p.user_id] = !!p.onboarding_complete;
        if (p.full_name) prefNameMap[p.user_id] = p.full_name;
      });
    } catch {}

    // Fetch subscription data for plan badges
    let subMap = {};
    try {
      const { data: subs } = await sb.from('subscriptions').select('user_id, plan, status, trial_ends_at, billing_cycle');
      (subs || []).forEach((s) => {
        const isActive = ['active', 'authenticated', 'created'].includes(s.status);
        const isTrialing = s.trial_ends_at && new Date(s.trial_ends_at) > new Date();
        if (isActive || isTrialing) {
          const p = s.plan === 'free' ? 'basic' : (s.plan || 'basic');
          subMap[s.user_id] = {
            plan: p,
            status: s.status,
            isTrialing,
            billing_cycle: s.billing_cycle || null,
            trialEndsAt: s.trial_ends_at || null,
          };
        }
      });
    } catch {}

    let users = (authUsers || []).map((u) => {
      const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
      return {
        id: u.id,
        email: u.email || '(no email)',
        full_name: prefNameMap[u.id] || u.full_name || null,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        provider: u.provider || 'email',
        trades: tradeMap[u.id] || 0,
        onboarded: onboardMap[u.id] || false,
        banned: !!isBanned,
        banReason: u.ban_reason || null,
        isAdmin: u.email === ADMIN_EMAIL,
        subscription: subMap[u.id] || null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.email.toLowerCase().includes(q) || (u.full_name && u.full_name.toLowerCase().includes(q)));
    }

    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Users</h1>
            <p className="mt-1 text-sm text-white/50">{users.length} total user{users.length !== 1 ? 's' : ''}</p>
          </div>
          <form className="flex gap-2">
            <input name="q" defaultValue={search} placeholder="Search by email…" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/60" />
            <button type="submit" className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white">Search</button>
          </form>
        </div>

        <AdminUserTabs users={users} search={search} />
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
