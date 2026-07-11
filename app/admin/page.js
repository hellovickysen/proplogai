import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import BetaCountControl from '@/components/admin/BetaCountControl';

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

function Stat({ label, value, sub, accent }) {
  const border = accent === 'green' ? 'border-emerald-400/20' : accent === 'amber' ? 'border-amber-400/20' : 'border-white/10';
  const glow = accent === 'green' ? 'bg-emerald-500/[0.04]' : accent === 'amber' ? 'bg-amber-500/[0.04]' : 'bg-white/[0.03]';
  return (
    <div className={'rounded-2xl border p-5 ' + border + ' ' + glow}>
      <div className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

/* ── SVG Bar Chart (14-day trend) ─────────────────────────── */
function TrendChart({ data, label, color = '#a78bfa' }) {
  const max = Math.max(1, ...data.map(d => d.value));
  const barW = 100 / data.length;
  const h = 120;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-sm font-semibold">{label}</div>
        <div className="font-mono text-xs text-white/40">Last 14 days</div>
      </div>
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="h-[100px] w-full">
        <defs>
          <linearGradient id={`grad-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.8" />
            <stop offset="1" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / max) * (h - 20));
          return (
            <g key={i}>
              <rect
                x={i * barW + barW * 0.15}
                y={h - barH}
                width={barW * 0.7}
                height={barH}
                rx="2"
                fill={`url(#grad-${label.replace(/\s/g, '')})`}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-white/30">
        <span>{data[0]?.date?.slice(5) || ''}</span>
        <span>{data[data.length - 1]?.date?.slice(5) || ''}</span>
      </div>
    </div>
  );
}

/* ── Helper: group rows by IST date ──────────────────────── */
function groupByDay(rows, dateField = 'created_at', days = 14) {
  const buckets = {};
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(nowIST);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    buckets[key] = 0;
  }
  (rows || []).forEach((r) => {
    const raw = r[dateField];
    if (!raw) return;
    const istDate = new Date(raw).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (buckets[istDate] !== undefined) buckets[istDate]++;
  });
  return Object.entries(buckets).map(([date, value]) => ({ date, value }));
}

export default async function AdminOverviewPage() {
  if (!isAdminConfigured()) return <SetupMessage />;
  const sb = createAdminClient();
  if (!sb) return <SetupMessage />;

  try {
    // ── Total users (paginated to count beyond 1000) ──
    let totalUsers = 0;
    let firstPageUsers = [];
    try {
      let page = 1;
      while (true) {
        const { data: authData } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
        const users = authData?.users || [];
        if (page === 1) firstPageUsers = users;
        totalUsers += users.length;
        if (users.length < 1000) break;
        page++;
      }
    } catch { totalUsers = 0; }

    // ── Aggregate counts ──
    const tradesRes = await sb.from('trades').select('id', { count: 'exact', head: true });
    const journalsRes = await sb.from('journal_entries').select('id', { count: 'exact', head: true });
    const insightsRes = await sb.from('ai_insights').select('id', { count: 'exact', head: true });

    // AI usage breakdown by type
    const tradeAnalysesRes = await sb.from('ai_insights').select('id', { count: 'exact', head: true }).eq('type', 'trade_analysis');
    const coachReportsRes = await sb.from('ai_insights').select('id', { count: 'exact', head: true }).eq('type', 'coach_report');

    const totalTrades = tradesRes.count || 0;
    const totalJournals = journalsRes.count || 0;
    const totalInsights = insightsRes.count || 0;
    const totalTradeAnalyses = tradeAnalysesRes.count || 0;
    const totalCoachReports = coachReportsRes.count || 0;

    // Cost estimates: Haiku 4.5 ~$0.002/trade analysis, ~$0.005/coach report
    const estAnalysisCost = totalTradeAnalyses * 0.002;
    const estCoachCost = totalCoachReports * 0.005;
    const estAiCost = (estAnalysisCost + estCoachCost).toFixed(2);

    // This month's AI costs
    const monthStartUTC = new Date();
    monthStartUTC.setUTCDate(1);
    monthStartUTC.setUTCHours(0, 0, 0, 0);
    const monthAnalysesRes = await sb.from('ai_insights').select('id', { count: 'exact', head: true }).eq('type', 'trade_analysis').gte('created_at', monthStartUTC.toISOString());
    const monthCoachRes = await sb.from('ai_insights').select('id', { count: 'exact', head: true }).eq('type', 'coach_report').gte('created_at', monthStartUTC.toISOString());
    const monthAnalyses = monthAnalysesRes.count || 0;
    const monthCoach = monthCoachRes.count || 0;
    const monthAiCost = (monthAnalyses * 0.002 + monthCoach * 0.005).toFixed(3);

    // ── Active users (traded in last 7 days) ──
    let activeUsers = 0;
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: recentTrades } = await sb.from('trades').select('user_id').gte('created_at', weekAgo);
      activeUsers = new Set((recentTrades || []).map(t => t.user_id)).size;
    } catch {}

    // ── Today's activity (IST) ──
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayStartUTC = new Date(todayIST + 'T00:00:00+05:30').toISOString();
    let todayTrades = 0, todayJournals = 0, todayInsights = 0, todaySignups = 0;
    try {
      const { count } = await sb.from('trades').select('id', { count: 'exact', head: true }).gte('created_at', todayStartUTC);
      todayTrades = count || 0;
    } catch {}
    try {
      const { count } = await sb.from('journal_entries').select('id', { count: 'exact', head: true }).gte('created_at', todayStartUTC);
      todayJournals = count || 0;
    } catch {}
    try {
      const { count } = await sb.from('ai_insights').select('id', { count: 'exact', head: true }).gte('created_at', todayStartUTC);
      todayInsights = count || 0;
    } catch {}
    try {
      const { count } = await sb.from('user_preferences').select('id', { count: 'exact', head: true }).gte('created_at', todayStartUTC);
      todaySignups = count || 0;
    } catch {}

    // ── 14-day trend data for charts ──
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    let signupTrend = [], tradeTrend = [];
    try {
      const { data: recentSignups } = await sb.from('user_preferences').select('created_at').gte('created_at', twoWeeksAgo);
      signupTrend = groupByDay(recentSignups, 'created_at', 14);
    } catch { signupTrend = groupByDay([], 'created_at', 14); }
    try {
      const { data: recentTrades } = await sb.from('trades').select('created_at').gte('created_at', twoWeeksAgo);
      tradeTrend = groupByDay(recentTrades, 'created_at', 14);
    } catch { tradeTrend = groupByDay([], 'created_at', 14); }

    // ── Plan breakdown (Razorpay) ──
    let plans = { basic: 0, elite: 0, trialing: 0 };
    try {
      const { data: subs } = await sb.from('subscriptions').select('plan, status, trial_ends_at');
      (subs || []).forEach((s) => {
        const isActive = ['active', 'authenticated', 'created'].includes(s.status);
        const isTrialing = s.trial_ends_at && new Date(s.trial_ends_at) > new Date();
        if (s.plan === 'elite' && (isActive || isTrialing)) {
          plans.elite++;
          if (isTrialing && s.status !== 'active') plans.trialing++;
        } else {
          plans.basic++;
        }
      });
    } catch {}

    // ── Open tickets ──
    let openTickets = 0;
    try {
      const { count } = await sb.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']);
      openTickets = count || 0;
    } catch {}

    return (
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold">Platform Overview</h1>
        <p className="mb-6 text-sm text-white/50">Real-time stats across all PropLogAI users.</p>

        {/* ── Hero stats ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="Total Users" value={totalUsers} />
          <Stat label="Active (7d)" value={activeUsers} accent="green" />
          <Stat label="Total Trades" value={totalTrades} />
          <Stat label="Journal Entries" value={totalJournals} />
          <Stat label="AI Calls" value={totalInsights} sub={`Est. cost: $${estAiCost}`} />
        </div>

        {/* ── Today's activity + Open tickets ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.03] p-5">
            <div className="mb-3 font-display text-sm font-semibold" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Today's Activity</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><div className="font-mono text-xs text-white/45">Signups</div><div className="mt-1 font-display text-xl font-bold">{todaySignups}</div></div>
              <div><div className="font-mono text-xs text-white/45">Trades</div><div className="mt-1 font-display text-xl font-bold">{todayTrades}</div></div>
              <div><div className="font-mono text-xs text-white/45">Journals</div><div className="mt-1 font-display text-xl font-bold">{todayJournals}</div></div>
              <div><div className="font-mono text-xs text-white/45">AI Calls</div><div className="mt-1 font-display text-xl font-bold">{todayInsights}</div></div>
            </div>
          </div>
          <div className="flex items-center rounded-2xl border border-amber-400/15 bg-amber-500/[0.04] px-8 py-5">
            <div className="text-center">
              <div className="font-mono text-xs uppercase tracking-wider text-amber-400/70">Open Tickets</div>
              <div className="mt-2 font-display text-4xl font-bold text-amber-400">{openTickets}</div>
            </div>
          </div>
        </div>

        {/* ── Trend charts ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <TrendChart data={signupTrend} label="Signups" color="#22d3ee" />
          <TrendChart data={tradeTrend} label="Trades" color="#a78bfa" />
        </div>

        {/* ── Plan breakdown + Engagement ── */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 font-display text-sm font-semibold">Plan Breakdown</h2>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="font-mono text-xs text-white/45">Basic</div><div className="mt-1 font-display text-2xl font-bold">{plans.basic}</div></div>
              <div><div className="font-mono text-xs text-white/45">Elite</div><div className="mt-1 font-display text-2xl font-bold text-violet-400">{plans.elite}</div></div>
              <div><div className="font-mono text-xs text-white/45">Trialing</div><div className="mt-1 font-display text-2xl font-bold text-amber-400">{plans.trialing}</div></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 font-display text-sm font-semibold">Engagement Ratios</h2>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="font-mono text-xs text-white/45">Trades/user</div><div className="mt-1 font-display text-2xl font-bold">{totalUsers ? (totalTrades / totalUsers).toFixed(1) : '0'}</div></div>
              <div><div className="font-mono text-xs text-white/45">Journal rate</div><div className="mt-1 font-display text-2xl font-bold">{totalTrades ? Math.round((totalJournals / totalTrades) * 100) + '%' : '0%'}</div></div>
              <div><div className="font-mono text-xs text-white/45">AI rate</div><div className="mt-1 font-display text-2xl font-bold">{totalTrades ? Math.round((totalInsights / totalTrades) * 100) + '%' : '0%'}</div></div>
            </div>
          </div>
        </div>

        {/* ── AI Cost Breakdown ── */}
        <div className="mb-6 rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.03] p-5">
          <h2 className="mb-4 font-display text-sm font-semibold" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>AI Cost Breakdown (Claude Haiku 4.5)</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <div>
              <div className="font-mono text-xs text-white/45">Trade Analyses</div>
              <div className="mt-1 font-display text-xl font-bold">{totalTradeAnalyses}</div>
              <div className="font-mono text-[11px] text-white/35">× $0.002 = ${estAnalysisCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Coach Reports</div>
              <div className="mt-1 font-display text-xl font-bold">{totalCoachReports}</div>
              <div className="font-mono text-[11px] text-white/35">× $0.005 = ${estCoachCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Total (all time)</div>
              <div className="mt-1 font-display text-xl font-bold text-cyan-400">${estAiCost}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">This Month</div>
              <div className="mt-1 font-display text-xl font-bold text-amber-400">${monthAiCost}</div>
              <div className="font-mono text-[11px] text-white/35">{monthAnalyses} analyses + {monthCoach} reports</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Avg/User</div>
              <div className="mt-1 font-display text-xl font-bold">{totalUsers ? '$' + (parseFloat(estAiCost) / totalUsers).toFixed(3) : '$0'}</div>
            </div>
            <div>
              <div className="font-mono text-xs text-white/45">Cost/Trade</div>
              <div className="mt-1 font-display text-xl font-bold">{totalInsights ? '$' + (parseFloat(estAiCost) / totalInsights).toFixed(3) : '$0'}</div>
            </div>
          </div>
        </div>

        {/* ── Beta Counter (below the fold) ── */}
        <BetaCountControl />
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
