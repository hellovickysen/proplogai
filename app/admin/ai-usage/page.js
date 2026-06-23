import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
}

export default async function AdminAiUsagePage() {
  const sb = createAdminClient();

  // All AI insights
  const { data: insights } = await sb.from('ai_insights').select('id, user_id, type, created_at').order('created_at', { ascending: false });
  const list = insights || [];

  const tradeAnalyses = list.filter((i) => i.type === 'trade_analysis');
  const coachReports = list.filter((i) => i.type === 'coach_report');

  // Cost estimates
  const tradeAnalysisCost = tradeAnalyses.length * 0.02; // ~$0.02 per trade analysis
  const coachReportCost = coachReports.length * 0.08; // ~$0.08 per coach report
  const totalCost = tradeAnalysisCost + coachReportCost;

  // Per-day breakdown (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const recentByDay = {};
  list.forEach((i) => {
    const day = (i.created_at || '').slice(0, 10);
    if (day >= thirtyDaysAgo) {
      recentByDay[day] = (recentByDay[day] || 0) + 1;
    }
  });
  const dailyEntries = Object.entries(recentByDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);

  // Top users by AI usage
  const userCounts = {};
  list.forEach((i) => {
    userCounts[i.user_id] = (userCounts[i.user_id] || 0) + 1;
  });
  const topUsers = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Get emails for top users
  let emailMap = {};
  if (topUsers.length > 0) {
    const { data: authData } = await sb.auth.admin.listUsers({ perPage: 1000 });
    (authData?.users || []).forEach((u) => { emailMap[u.id] = u.email; });
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">AI Usage & Costs</h1>
      <p className="mb-6 text-sm text-white/50">Track AI API consumption and estimated costs.</p>

      {/* Summary stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="font-mono text-xs text-white/55">Trade analyses</div>
          <div className="mt-2 font-display text-3xl font-bold">{tradeAnalyses.length}</div>
          <div className="mt-1 text-xs text-white/40">~${tradeAnalysisCost.toFixed(2)} est.</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="font-mono text-xs text-white/55">Coach reports</div>
          <div className="mt-2 font-display text-3xl font-bold">{coachReports.length}</div>
          <div className="mt-1 text-xs text-white/40">~${coachReportCost.toFixed(2)} est.</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="font-mono text-xs text-white/55">Total AI calls</div>
          <div className="mt-2 font-display text-3xl font-bold">{list.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 p-5" style={{ background: 'rgba(52,211,153,0.06)' }}>
          <div className="font-mono text-xs text-white/55">Estimated total cost</div>
          <div className="mt-2 font-display text-3xl font-bold text-emerald-400">${totalCost.toFixed(2)}</div>
          <div className="mt-1 text-xs text-white/40">All time</div>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 font-display text-base font-semibold">Daily AI calls (last 14 days)</h2>
        {dailyEntries.length > 0 ? (
          <div className="space-y-2">
            {dailyEntries.map(([day, count]) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-20 font-mono text-xs text-white/50">{fmtDate(day)}</span>
                <div className="h-5 rounded bg-violet-500/20" style={{ width: Math.max(8, (count / Math.max(...dailyEntries.map(e => e[1]))) * 200) }} />
                <span className="font-mono text-xs font-semibold">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">No AI calls in the last 14 days.</p>
        )}
      </div>

      {/* Top users */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 font-display text-base font-semibold">Top users by AI usage</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
              <th className="px-3 pb-2">#</th>
              <th className="px-3 pb-2">Email</th>
              <th className="px-3 pb-2">AI calls</th>
              <th className="px-3 pb-2">Est. cost</th>
            </tr>
          </thead>
          <tbody>
            {topUsers.map(([uid, count], i) => (
              <tr key={uid} className="border-t border-white/5">
                <td className="px-3 py-2 font-mono text-white/40">{i + 1}</td>
                <td className="px-3 py-2">{emailMap[uid] || uid.slice(0, 8) + '…'}</td>
                <td className="px-3 py-2 font-mono font-semibold">{count}</td>
                <td className="px-3 py-2 font-mono text-white/55">${(count * 0.025).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
