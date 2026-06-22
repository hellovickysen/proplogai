import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { computeStats, equitySeries, fmtMoney, fmtR, num } from '@/lib/stats';
import TradeTable from '@/components/TradeTable';
import PnlCalendar from '@/components/PnlCalendar';
import DashboardShareButton from '@/components/DashboardShareButton';

export const dynamic = 'force-dynamic';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function EquityCurve({ series }) {
  if (!series || series.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-white/55">
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
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[200px] w-full">
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

function Stat({ label, value, tone }) {
  const color = tone === 'pos' ? 'text-emerald-400' : tone === 'neg' ? 'text-red-400' : 'text-white';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</div>
      <div className={'mt-2 font-display text-2xl font-bold ' + color}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: trades } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
  const list = trades || [];
  const s = computeStats(list);
  const series = equitySeries(list);
  const { data: coach } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('type', 'coach_report')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const report = coach && coach.mistakes ? coach.mistakes : null;
  const topMistake = report && Array.isArray(report.recurring_mistakes) ? report.recurring_mistakes[0] : null;

  if (list.length === 0) {
    const steps = [
      { n: '1', t: 'Log your first trade', d: 'Pair, direction, and your P&L — that is all it takes.' },
      { n: '2', t: 'Journal it', d: 'Add emotions, a confidence rating, notes and a screenshot.' },
      { n: '3', t: 'Get AI coaching', d: 'Instant per-trade analysis, plus a coach report across all trades.' },
    ];
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-2xl font-bold">Welcome to PipMind 👋</h1>
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

  // Compute today's stats for share card
  const today = new Date().toISOString().slice(0, 10);
  const todayTrades = list.filter((t) => {
    const d = t.trade_date || (t.closed_at || t.created_at || '').slice(0, 10);
    return d === today;
  });
  const todayPnl = todayTrades.reduce((a, t) => a + num(t.pnl), 0);
  const todayWins = todayTrades.filter((t) => num(t.pnl) >= 0).length;
  const todayWinRate = todayTrades.length > 0 ? Math.round((todayWins / todayTrades.length) * 100) : 0;
  const todayBest = todayTrades.length > 0 ? Math.max(...todayTrades.map((t) => num(t.pnl))) : null;
  const todayWorst = todayTrades.length > 0 ? Math.min(...todayTrades.map((t) => num(t.pnl))) : null;
  const dailyShareData = {
    pnl: todayPnl,
    date: today,
    trades: todayTrades.length,
    winRate: todayWinRate,
    bestTrade: todayBest,
    worstTrade: todayWorst,
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          {todayTrades.length > 0 && <DashboardShareButton data={dailyShareData} />}
          <Link href="/dashboard/trades/new" className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + New Trade
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Net P&amp;L" value={fmtMoney(s.net)} tone={s.net >= 0 ? 'pos' : 'neg'} />
        <Stat label="Win rate" value={s.winRate.toFixed(0) + '%'} />
        <Stat label="Profit factor" value={s.profitFactor === null ? '—' : s.profitFactor.toFixed(2)} />
        <Stat label="Avg R" value={fmtR(s.avgR)} tone={s.avgR === null ? '' : s.avgR >= 0 ? 'pos' : 'neg'} />
        <Stat label="Trades" value={String(s.n)} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 font-display text-base font-semibold">Equity curve</div>
          <EquityCurve series={series} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <PnlCalendar trades={list} />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/15 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-5">
        <div className="flex items-center justify-between">
          <div className="font-display text-base font-semibold" style={gradientText}>&#10022; AI Coach</div>
          <Link href="/dashboard/coach" className="font-mono text-xs text-cyan-400">Open &rarr;</Link>
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
            Generate a coaching report to see your recurring mistakes and trading psychology across all your trades.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-base font-semibold">Recent trades</div>
          <Link href="/dashboard/trades" className="font-mono text-xs text-cyan-400">View all &rarr;</Link>
        </div>
        <TradeTable rows={recent} />
      </div>
    </div>
  );
}
