import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { computeStats, equitySeries, equityChartData, fmtMoney, fmtR, num } from '@/lib/stats';
import EquityChart from '@/components/dashboard/EquityChart';
import { computeDisciplineStats, computeWeeklyScore, computeEliteWeekStreak } from '@/lib/discipline';
import { computeAchievements } from '@/lib/achievements';
import TradeTable from '@/components/trades/TradeTable';
import PnlCalendar from '@/components/calendar/PnlCalendar';
import DashboardShareButton from '@/components/dashboard/DashboardShareButton';
import DisciplineCards from '@/components/dashboard/DisciplineCards';
import ReferralCapture from '@/components/referrals/ReferralCapture';
import BetaNotice from '@/components/ui/BetaNotice';
import { notify, TYPES } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function EquityCurve({ series }) {
  if (!series || series.length < 2) {
    return (
      <div className="flex h-[140px] sm:h-[200px] items-center justify-center text-sm text-white/55">
        Log at least two trades to see your equity curve.
      </div>
    );
  }
  const w = 800;
  const h = 200;
  const pad = 10;
  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (series.length - 1);
  const pts = series.map((v, i) => [pad + i * stepX, pad + (h - pad * 2) * (1 - (v - min) / range)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ' L ' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L ' + pts[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[140px] sm:h-[200px] w-full">
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="eql" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#eq)" />
      <path d={line} fill="none" stroke="url(#eql)" strokeWidth="2.5" />
    </svg>
  );
}

function HeroStat({ label, value, tone }) {
  const color = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-white';
  const glowColor = tone === 'pos' ? 'rgba(52,211,153,0.08)' : tone === 'neg' ? 'rgba(248,113,113,0.08)' : 'transparent';
  const borderColor = tone === 'pos' ? 'border-emerald-400/20' : tone === 'neg' ? 'border-red-400/20' : 'border-white/10';
  return (
    <div className={'rounded-xl border p-5 col-span-2 sm:col-span-1 ' + borderColor} style={{ background: glowColor }}>
      <div className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className={'mt-2 font-display text-3xl font-bold ' + color}>{value}</div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const color = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-white';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className={'mt-2 font-display text-2xl font-bold ' + color}>{value}</div>
    </div>
  );
}

function fmtCurrency(v) {
  const n = Number(v) || 0;
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, setup, setup_id, setup_followed, no_setup_reason, timeframe, session, trade_date, closed_at, created_at, entry_price, exit_price, journal_entries(emotions, note, screenshot_url, screenshot_urls, confidence)')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false, nullsFirst: false });

  if (tradesError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: coach, error: coachError } = await supabase
    .from('ai_insights')
    .select('insight, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (coachError) console.error('coach insight error', coachError);

  const { data: journalRows, error: journalError } = await supabase
    .from('journal_entries')
    .select('trade_id, emotions, note, screenshot_url, screenshot_urls, confidence')
    .eq('user_id', user.id);
  if (journalError) console.error('journal entries error', journalError);
  const journals = journalRows || [];

  const { data: expenseRows, error: expError } = await supabase
    .from('expenses')
    .select('amount, category, description, date')
    .eq('user_id', user.id);
  if (expError) console.error('expenses error', expError);
  const expenses = expenseRows || [];

  const { data: payoutRows, error: payError } = await supabase
    .from('payouts')
    .select('amount, date, note')
    .eq('user_id', user.id);
  if (payError) console.error('payouts error', payError);
  const payouts = payoutRows || [];

  let notifications = [];
  try {
    notifications = await notify(user.id, TYPES);
  } catch (e) {
    console.error('notifications error', e);
  }

  const list = trades || [];
  const stats = computeStats(list);
  const series = equitySeries(list);
  const chartData = equityChartData(list);
  const disciplineStats = computeDisciplineStats(list);
  const weeklyScore = computeWeeklyScore(list);
  const eliteStreak = computeEliteWeekStreak(list);
  const achievements = computeAchievements(list);

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalPayouts = payouts.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const netPnl = (stats.totalPnl || 0) - totalExpenses - totalPayouts;

  return (
    <div className="px-4 py-8 sm:px-6">
      <ReferralCapture />
      <BetaNotice />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold" style={gradientText}>Dashboard</h1>
        <DashboardShareButton stats={stats} trades={list} />
      </div>

      {notifications.length > 0 && (
        <div className="mb-6 space-y-2">
          {notifications.map((n, i) => (
            <div key={i} className="rounded-xl border border-yellow-400/20 bg-yellow-500/[0.05] px-4 py-3 text-sm text-yellow-300">
              {n.message}
            </div>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-10">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            &#9776;
          </div>
          <h2 className="font-display text-xl font-bold">No trades yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
            Log your first trade to start tracking your performance. It only takes 30 seconds.
          </p>
          <Link
            href="/dashboard/trades/new"
            className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            + Log your first trade
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat label="Net P&L" value={fmtMoney(stats.totalPnl)} tone={stats.totalPnl >= 0 ? 'pos' : 'neg'} />
            <HeroStat label="Win Rate" value={num(stats.winRate) + '%'} tone={stats.winRate >= 50 ? 'pos' : 'neg'} />
            <HeroStat label="Avg R" value={fmtR(stats.avgR)} tone={stats.avgR >= 0 ? 'pos' : 'neg'} />
            <HeroStat label="Trades" value={stats.total} tone="neu" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Best Trade" value={fmtMoney(stats.bestTrade)} tone="pos" />
            <Stat label="Worst Trade" value={fmtMoney(stats.worstTrade)} tone="neg" />
            <Stat label="Profit Factor" value={num(stats.profitFactor, 2)} tone={stats.profitFactor >= 1 ? 'pos' : 'neg'} />
            <Stat label="Expectancy" value={fmtR(stats.expectancy) + 'R'} tone={stats.expectancy >= 0 ? 'pos' : 'neg'} />
          </div>

          {(expenses.length > 0 || payouts.length > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Gross P&L" value={fmtMoney(stats.totalPnl)} tone={stats.totalPnl >= 0 ? 'pos' : 'neg'} />
              <Stat label="Expenses & Payouts" value={'-' + fmtCurrency(totalExpenses + totalPayouts)} tone="neg" />
              <Stat label="Net P&L" value={fmtMoney(netPnl)} tone={netPnl >= 0 ? 'pos' : 'neg'} />
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 font-mono text-xs uppercase tracking-wider text-white/55">Equity Curve</div>
            <EquityCurve series={series} />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <EquityChart data={chartData} />
          </div>

          <div className="mt-6">
            <PnlCalendar trades={list} />
          </div>

          <DisciplineCards stats={disciplineStats} weeklyScore={weeklyScore} eliteStreak={eliteStreak} achievements={achievements} />

          {coach && (
            <div className="mt-6 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5">
              <div className="mb-1 font-mono text-xs uppercase tracking-wider text-violet-400">AI Coach Insight</div>
              <p className="text-sm text-white/80">{coach.insight}</p>
            </div>
          )}

          <div className="mt-6">
            <div className="mb-3 font-display text-lg font-bold">Recent Trades</div>
            <TradeTable trades={list.slice(0, 10)} journals={journals} />
          </div>
        </>
      )}
    </div>
  );
}
