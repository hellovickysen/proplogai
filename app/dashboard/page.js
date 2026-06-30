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

  // Enrich trades with journal data from the joined relation
  const list = (trades || []).map((t) => {
    const j = Array.isArray(t.journal_entries) ? t.journal_entries[0] : t.journal_entries;
    let _journal = null;
    if (j) {
      const urls = Array.isArray(j.screenshot_urls) ? j.screenshot_urls.filter(Boolean) : [];
      const hasImages = urls.length > 0 || (j.screenshot_url && j.screenshot_url !== '');
      _journal = {
        emotions: j.emotions || [],
        hasNote: !!(j.note && j.note.trim()),
        hasImages,
        confidence: j.confidence != null ? j.confidence : null,
      };
    }
    const { journal_entries, ...trade } = t;
    return { ...trade, _journal };
  });

  const s = computeStats(list);
  const series = equitySeries(list);
  const chartData = equityChartData(list);
  const { data: coach, error: coachError } = await supabase
    .from('ai_insights')
    .select('summary, mistakes, created_at')
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (coachError) console.error('coach insight error', coachError);
  const report = coach && coach.mistakes ? coach.mistakes : null;
  const topMistake = report && Array.isArray(report.recurring_mistakes) ? report.recurring_mistakes[0] : null;

  // Journal entries for discipline
  const tradeIds = list.map((t) => t.id);
  let journals = [];
  if (tradeIds.length > 0) {
    const { data: jdata, error: journalError } = await supabase
      .from('journal_entries')
      .select('trade_id')
      .in('trade_id', tradeIds);
    if (journalError) console.error('journal entries error', journalError);
    journals = jdata || [];
  }

  const disciplineStats = computeDisciplineStats(list, journals);
  const weeklyScore = computeWeeklyScore(list, journals);
  const eliteWeekStreak = computeEliteWeekStreak(list, journals);
  const achievements = computeAchievements({
    totalTrades: list.length,
    journalStreak: disciplineStats.journalStreak,
    noRevengeStreak: disciplineStats.noRevengeStreak,
    setupDiscipline: disciplineStats.setupDiscipline,
    weeklyScore: weeklyScore.score,
    eliteWeekStreak,
  });

  // ── Notify on newly unlocked achievements ──
  const earnedAchievements = achievements.filter(a => a.earned);
  if (earnedAchievements.length > 0) {
    try {
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('metadata')
        .eq('user_id', user.id)
        .eq('type', 'achievement_unlocked');
      const notifiedKeys = new Set(
        (existingNotifs || []).map(n => n.metadata?.achievement_key).filter(Boolean)
      );
      for (const a of earnedAchievements) {
        if (!notifiedKeys.has(a.key)) {
          await notify(supabase, user.id, TYPES.ACHIEVEMENT_UNLOCKED,
            a.icon + ' ' + a.name,
            a.desc,
            { achievement_key: a.key, link: '/dashboard' }
          );
        }
      }
    } catch (e) {
      // Achievement notifications should never break the dashboard
    }
  }

  // Expense summary — lightweight queries
  const { data: expenseRows, error: expError } = await supabase.from('expenses').select('total_cost').eq('user_id', user.id);
  if (expError) console.error('expenses error', expError);
  const { data: payoutRows, error: payError } = await supabase.from('payouts').select('amount').eq('user_id', user.id);
  if (payError) console.error('payouts error', payError);
  const totalExpense = (expenseRows || []).reduce((a, e) => a + (Number(e.total_cost) || 0), 0);
  const totalPayout = (payoutRows || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const expenseNet = totalPayout - totalExpense;
  const hasExpenseData = (expenseRows && expenseRows.length > 0) || (payoutRows && payoutRows.length > 0);

  if (list.length === 0) {
    const steps = [
      { n: '1', t: 'Log your first trade', d: 'Pair, direction, and your P&L — that is all it takes.' },
      { n: '2', t: 'Journal it', d: 'Add emotions, a confidence rating, notes and a screenshot.' },
      { n: '3', t: 'Get AI coaching', d: 'Instant per-trade analysis, plus a coach report across all trades.' },
    ];
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-2xl font-bold">Welcome to PropLogAI &#x1F44B;</h1>
        <p className="mt-1 text-sm text-white/55">Let's get your journal started.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((st) => (
            <div key={st.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="font-display text-2xl font-bold" style={gradientText}>{st.n}</div>
              <h3 className="mt-2 font-display text-base font-semibold">{st.t}</h3>
              <p className="mt-1 text-sm text-white/55">{st.d}</p>
            </div>
          ))}
        </div>
        <Link href="/dashboard/trades/new" className="mt-7 inline-block rounded-xl px-5 py-2.5 font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          + Log your first trade
        </Link>
      </div>
    );
  }

  const recent = list.slice(0, 6);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // IST date
  const todayTrades = list.filter((t) => {
    const d = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
    return d === today;
  });
  const todayPnl = todayTrades.reduce((a, t) => a + num(t.pnl), 0);

  // Current month P&L
  const currentMonth = today.slice(0, 7); // "2026-06"
  const monthTrades = list.filter((t) => {
    const d = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
    return d.startsWith(currentMonth);
  });
  const monthPnl = monthTrades.reduce((a, t) => a + num(t.pnl), 0);
  const todayWins = todayTrades.filter((t) => num(t.pnl) >= 0).length;
  const todayWinRate = todayTrades.length > 0 ? Math.round((todayWins / todayTrades.length) * 100) : 0;
  const todayBest = todayTrades.length > 0 ? Math.max(...todayTrades.map((t) => num(t.pnl))) : null;
  const todayWorst = todayTrades.length > 0 ? Math.min(...todayTrades.map((t) => num(t.pnl))) : null;
  const dailyShareData = todayTrades.length > 0
    ? { pnl: todayPnl, date: today, trades: todayTrades.length, winRate: todayWinRate, bestTrade: todayBest, worstTrade: todayWorst }
    : { pnl: s.net, date: today, trades: s.n, winRate: Math.round(s.winRate), bestTrade: null, worstTrade: null, avgR: s.avgR };

  return (
    <div className="px-3 py-8 sm:px-4">
      <ReferralCapture />
      <BetaNotice />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <DashboardShareButton data={dailyShareData} type={todayTrades.length > 0 ? 'daily' : 'total'} />
          <Link href="/dashboard/trades/new" className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + New Trade
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <HeroStat label="Net P&amp;L" value={fmtMoney(s.net)} tone={s.net >= 0 ? 'pos' : 'neg'} />
        <Stat label="Win rate" value={s.winRate.toFixed(0) + '%'} />
        <Stat label="Profit factor" value={s.profitFactor === null ? '—' : s.profitFactor.toFixed(2)} />
        <Stat label="Avg R" value={fmtR(s.avgR)} tone={s.avgR === null ? '' : s.avgR >= 0 ? 'pos' : 'neg'} />
        <Stat label="Trades" value={String(s.n)} />
      </div>

      {/* Rulebook Discipline — full width */}
      {disciplineStats.totalTrades > 0 && (
        <div className="mb-6">
          <DisciplineCards stats={disciplineStats} weeklyScore={weeklyScore} achievements={achievements} />
        </div>
      )}

      {/* ─── 2-column layout on desktop ─── */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column: Equity + Recent Trades */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <EquityChart data={chartData} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-base font-semibold">Recent trades</div>
              <Link href="/dashboard/trades" className="font-mono text-xs text-cyan-400">View all &rarr;</Link>
            </div>
            <TradeTable rows={recent} compact />
          </div>
        </div>

        {/* Right column: Calendar + Expenses + AI Coach */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <PnlCalendar trades={list} monthPnl={monthPnl} />
          </div>

          {/* Expense Summary */}
          {hasExpenseData && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">&#128179;</span>
                  <div className="font-display text-sm font-semibold">Prop firm expenses</div>
                </div>
                <Link href="/dashboard/expenses" className="font-mono text-xs text-cyan-400">Details &rarr;</Link>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-red-400/15 bg-red-500/[0.04] p-2.5">
                  <div className="font-mono text-[10px] uppercase text-white/40">Spent</div>
                  <div className="mt-1 font-display text-base font-bold text-red-400">{fmtCurrency(totalExpense)}</div>
                </div>
                <div className="rounded-lg border border-emerald-400/15 bg-emerald-500/[0.04] p-2.5">
                  <div className="font-mono text-[10px] uppercase text-white/40">Payouts</div>
                  <div className="mt-1 font-display text-base font-bold text-emerald-400">{fmtCurrency(totalPayout)}</div>
                </div>
                <div className={'rounded-lg border p-2.5 ' + (expenseNet >= 0 ? 'border-emerald-400/15 bg-emerald-500/[0.04]' : 'border-amber-400/15 bg-amber-500/[0.04]')}>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase text-white/40">Net P&amp;L</div>
                    <span className={'inline-block h-2 w-2 rounded-full ' + (expenseNet >= 0 ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]')} />
                  </div>
                  <div className={'mt-1 font-display text-base font-bold ' + (expenseNet >= 0 ? 'text-emerald-400' : 'text-amber-400')}>
                    {expenseNet >= 0 ? '+' : '-'}{fmtCurrency(Math.abs(expenseNet))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Coach */}
          <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-sm font-semibold" style={gradientText}>&#10022; AI Coach</div>
              <Link href="/dashboard/coach" className="flex min-h-[44px] items-center font-mono text-xs text-cyan-400">Open &rarr;</Link>
            </div>
            {report ? (
              <div className="mt-2">
                {coach.summary ? <p className="text-sm leading-relaxed text-white/80">{coach.summary}</p> : null}
                {topMistake ? (
                  <p className="mt-2 text-xs text-white/55">
                    Top recurring leak: <span className="text-white/80">{topMistake.pattern}</span>
                    {topMistake.frequency ? ' (' + topMistake.frequency + ')' : ''}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Generate a coaching report to see your recurring patterns.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
