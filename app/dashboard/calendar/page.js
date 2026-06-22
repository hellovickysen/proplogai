import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CalendarMonth from '@/components/CalendarMonth';
import TradeTable from '@/components/TradeTable';
import { num, fmtMoney } from '@/lib/stats';

export const dynamic = 'force-dynamic';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default async function CalendarPage({ searchParams }) {
  const now = new Date();
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  const mp = (searchParams && searchParams.month) || '';
  const parts = String(mp).split('-');
  if (parts.length === 2) {
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
      year = y;
      month = m - 1;
    }
  }
  const selected = (searchParams && searchParams.date) || null;

  const supabase = createClient();
  const { data: trades } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
  const list = trades || [];

  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const monthParam = year + '-' + pad2(month + 1);

  function shift(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    return y + '-' + pad2(m + 1);
  }

  const dayTrades = selected ? list.filter((t) => String(t.closed_at || t.created_at || '').slice(0, 10) === selected) : [];
  const dayNet = dayTrades.reduce((a, t) => a + num(t.pnl), 0);

  if (list.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            📅
          </div>
          <h2 className="font-display text-xl font-bold">No trades to show</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
            Your calendar will light up with daily P&L once you start logging trades. Green days, red days — see your patterns at a glance.
          </p>
          <Link
            href="/dashboard/trades/new"
            className="mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            + Log your first trade
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Calendar</h1>

      <div className="mb-4 mt-4 flex items-center justify-between">
        <Link href={'/dashboard/calendar?month=' + shift(-1)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:text-white">&larr; Prev</Link>
        <div className="font-display text-base font-semibold">{monthName}</div>
        <Link href={'/dashboard/calendar?month=' + shift(1)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:text-white">Next &rarr;</Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <CalendarMonth trades={list} year={year} month={month} selected={selected} monthParam={monthParam} />
      </div>

      {selected ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="font-display text-base font-semibold">Trades on {selected}</div>
            <div className={'font-mono text-sm ' + (dayNet >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {fmtMoney(dayNet)} · {dayTrades.length} trade{dayTrades.length === 1 ? '' : 's'}
            </div>
          </div>
          <TradeTable rows={dayTrades} />
        </div>
      ) : (
        <p className="mt-4 px-1 font-mono text-xs text-white/40">Tip: click any day with trades to see them here.</p>
      )}
    </div>
  );
}
