import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { computeStats, equitySeries, fmtMoney, fmtR } from '@/lib/stats';
import TradeTable from '@/components/TradeTable';

export const dynamic = 'force-dynamic';

function EquityCurve({ series }) {
  if (!series || series.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-white/40">
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
  const area =
    line + ' L ' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L ' + pts[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
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
      <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">{label}</div>
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

  if (list.length === 0) {
    return (
      <div className="px-6 py-10">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div
            className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            &#9636;
          </div>
          <h2 className="font-display text-xl font-bold">No trades yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-white/60">
            Log your first trade and your stats, equity curve, and (soon) AI insights will appear here.
          </p>
          <Link
            href="/dashboard/trades/new"
            className="mt-6 inline-block rounded-xl px-5 py-2.5 font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            + Log your first trade
          </Link>
        </div>
      </div>
    );
  }

  const recent = list.slice(0, 6);
  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <Link
          href="/dashboard/trades/new"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          + New Trade
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Net P&amp;L" value={fmtMoney(s.net)} tone={s.net >= 0 ? 'pos' : 'neg'} />
        <Stat label="Win rate" value={s.winRate.toFixed(0) + '%'} />
        <Stat label="Profit factor" value={s.profitFactor === null ? '—' : s.profitFactor.toFixed(2)} />
        <Stat label="Avg R" value={fmtR(s.avgR)} tone={s.avgR === null ? '' : s.avgR >= 0 ? 'pos' : 'neg'} />
        <Stat label="Trades" value={String(s.n)} />
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 font-display text-base font-semibold">Equity curve</div>
        <EquityCurve series={series} />
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
