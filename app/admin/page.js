import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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
  const sb = createAdminClient();

  // Parallel queries for speed
  const [usersRes, tradesRes, journalsRes, insightsRes, prefsRes, subsRes] = await Promise.all([
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('trades').select('id', { count: 'exact', head: true }),
    sb.from('journal_entries').select('id', { count: 'exact', head: true }),
    sb.from('ai_insights').select('id', { count: 'exact', head: true }),
    sb.from('user_preferences').select('id', { count: 'exact', head: true }),
    sb.from('subscriptions').select('plan', { count: 'exact', head: false }),
  ]);

  const totalUsers = usersRes.count || 0;
  const totalTrades = tradesRes.count || 0;
  const totalJournals = journalsRes.count || 0;
  const totalInsights = insightsRes.count || 0;

  // AI cost estimate
  const tradeAnalyses = totalInsights; // rough — includes coach reports too
  const estAiCost = (tradeAnalyses * 0.02).toFixed(2); // ~$0.02 avg per call

  // Signups today
  const today = new Date().toISOString().slice(0, 10);
  const { count: todaySignups } = await sb
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today + 'T00:00:00Z');

  // Trades today
  const { count: todayTrades } = await sb
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today + 'T00:00:00Z');

  // Subscription breakdown
  const plans = {};
  (subsRes.data || []).forEach((s) => {
    plans[s.plan] = (plans[s.plan] || 0) + 1;
  });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Platform Overview</h1>
      <p className="mb-6 text-sm text-white/50">Real-time stats across all PropJournal users.</p>

      {/* Main stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total Users" value={totalUsers} sub={todaySignups ? `+${todaySignups} today` : 'No signups today'} />
        <Stat label="Total Trades" value={totalTrades} sub={todayTrades ? `+${todayTrades} today` : null} />
        <Stat label="Journal Entries" value={totalJournals} />
        <Stat label="AI Analyses" value={totalInsights} sub={`Est. cost: $${estAiCost}`} />
      </div>

      {/* Secondary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Onboarded Users" value={prefsRes.count || 0} />
        <Stat label="Free Plan" value={plans.free || 0} />
        <Stat label="Pro Plan" value={plans.pro || 0} />
      </div>

      {/* Quick ratios */}
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
}
