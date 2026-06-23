import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function SetupMessage() {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-8 text-center">
      <div className="mx-auto mb-4 text-4xl">🔑</div>
      <h2 className="font-display text-xl font-bold text-amber-300">Service Role Key Required</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
        Add <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to Vercel env vars.
        Find it in Supabase Dashboard → Settings → API → service_role key.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  if (!isAdminConfigured()) return <SetupMessage />;
  const sb = createAdminClient();
  if (!sb) return <SetupMessage />;

  try {
    // Get user count from auth (more reliable than profiles table)
    let totalUsers = 0;
    try {
      const { data: authData } = await sb.auth.admin.listUsers({ perPage: 1 });
      // listUsers doesn't return total count easily, so count from trades user_ids
      const { data: userIds } = await sb.from('trades').select('user_id');
      const uniqueUsers = new Set((userIds || []).map(t => t.user_id));
      // Also try profiles
      const { count: profileCount } = await sb.from('profiles').select('id', { count: 'exact', head: true });
      totalUsers = Math.max(profileCount || 0, uniqueUsers.size, authData?.users?.length || 0);
    } catch { totalUsers = 0; }

    // Parallel queries
    const tradesRes = await sb.from('trades').select('id', { count: 'exact', head: true });
    const journalsRes = await sb.from('journal_entries').select('id', { count: 'exact', head: true });
    const insightsRes = await sb.from('ai_insights').select('id', { count: 'exact', head: true });

    const totalTrades = tradesRes.count || 0;
    const totalJournals = journalsRes.count || 0;
    const totalInsights = insightsRes.count || 0;
    const estAiCost = (totalInsights * 0.025).toFixed(2);

    // Today's stats
    const today = new Date().toISOString().slice(0, 10);
    let todayTrades = 0;
    let todayJournals = 0;
    let todayInsights = 0;
    let todaySignups = 0;
    try {
      const { count } = await sb.from('trades').select('id', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00Z');
      todayTrades = count || 0;
    } catch {}
    try {
      const { count } = await sb.from('journal_entries').select('id', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00Z');
      todayJournals = count || 0;
    } catch {}
    try {
      const { count } = await sb.from('ai_insights').select('id', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00Z');
      todayInsights = count || 0;
    } catch {}
    try {
      const { count } = await sb.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today + 'T00:00:00Z');
      todaySignups = count || 0;
    } catch {}

    // Subscriptions
    let plans = { free: 0, pro: 0, elite: 0 };
    try {
      const { data: subs } = await sb.from('subscriptions').select('plan');
      (subs || []).forEach((s) => { plans[s.plan || 'free'] = (plans[s.plan || 'free'] || 0) + 1; });
    } catch {}

    return (
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold">Platform Overview</h1>
        <p className="mb-6 text-sm text-white/50">Real-time stats across all PropJournal users.</p>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total Users" value={totalUsers} />
          <Stat label="Total Trades" value={totalTrades} />
          <Stat label="Journal Entries" value={totalJournals} />
          <Stat label="AI Analyses" value={totalInsights} sub={`Est. cost: $${estAiCost}`} />
        </div>

        {/* Today's stats */}
        <div className="mb-8 rounded-2xl border border-violet-400/15 bg-violet-500/[0.03] p-5">
          <div className="mb-3 font-display text-sm font-semibold" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Today's Activity</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="font-mono text-xs text-white/45">Signups</div>
              <div className="mt-1 font-display text-xl font-bold">{todaySignups}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Trades</div>
              <div className="mt-1 font-display text-xl font-bold">{todayTrades}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Journals</div>
              <div className="mt-1 font-display text-xl font-bold">{todayJournals}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">AI Calls</div>
              <div className="mt-1 font-display text-xl font-bold">{todayInsights}</div>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Stat label="Free Plan" value={plans.free} />
          <Stat label="Pro Plan" value={plans.pro} />
          <Stat label="Elite Plan" value={plans.elite} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 font-display text-base font-semibold">Engagement Ratios</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="font-mono text-xs text-white/45">Trades per user</div>
              <div className="mt-1 font-display text-xl font-bold">{totalUsers ? (totalTrades / totalUsers).toFixed(1) : '0'}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Journal rate</div>
              <div className="mt-1 font-display text-xl font-bold">{totalTrades ? Math.round((totalJournals / totalTrades) * 100) + '%' : '0%'}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">AI analysis rate</div>
              <div className="mt-1 font-display text-xl font-bold">{totalTrades ? Math.round((totalInsights / totalTrades) * 100) + '%' : '0%'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-8">
        <h2 className="font-display text-xl font-bold text-red-300">Error loading admin data</h2>
        <p className="mt-2 text-sm text-white/55">{err?.message || 'Unknown error. Check Vercel logs.'}</p>
      </div>
    );
  }
}
