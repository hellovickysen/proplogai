import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CalendarMonth from '@/components/calendar/CalendarMonth';
import TradeTable from '@/components/trades/TradeTable';
import { num, fmtMoney } from '@/lib/stats';

export const dynamic = 'force-dynamic';

function pad2(n) {
  return String(n).padStart(2, '0');
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const { data: { user } } = await supabase.auth.getUser();

  // Calculate the start and end of the displayed month
  const monthStartDate = `${year}-${pad2(month + 1)}-01`;
  const nextMonthVal = month === 11 ? 0 : month + 1;
  const nextYearVal = month === 11 ? year + 1 : year;
  const monthEndDate = `${nextYearVal}-${pad2(nextMonthVal + 1)}-01`;

  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, setup, timeframe, session, trade_date, closed_at, created_at')
    .eq('user_id', user.id)
    .gte('trade_date', monthStartDate)
    .lt('trade_date', monthEndDate)
    .order('trade_date', { ascending: false, nullsFirst: false });

  // Lightweight count query to check if user has any trades at all (for empty state)
  const { count: totalTradeCount } = await supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (tradesError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const list = trades || [];

  const tradeIds = list.map((t) => t.id);
  let journalMap = {};
  if (tradeIds.length > 0) {
    const { data: journals, error: journalError } = await supabase
      .from('journal_entries')
      .select('trade_id, emotions, note, screenshot_url, screenshot_urls, confidence')
      .in('trade_id', tradeIds);
    if (journalError) console.error('journal entries error', journalError);
    (journals || []).forEach((j) => {
      journalMap[j.trade_id] = j;
    });
  }

  // Build day map for the calendar
  const dayMap = {};
  for (const t of list) {
    const key = t.trade_date ? t.trade_date.slice(0, 10) : null;
    if (!key) continue;
    if (!dayMap[key]) dayMap[key] = { pnl: 0, trades: [] };
    dayMap[key].pnl += Number(t.pnl) || 0;
    dayMap[key].trades.push(t);
  }

  // Trades for selected date
  const selectedTrades = selected && dayMap[selected] ? dayMap[selected].trades : [];

  // Month navigation
  const prevMonth = month === 0 ? new Date(year - 1, 11, 1) : new Date(year, month - 1, 1);
  const nextMonth = month === 11 ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);
  const prevParam = `${prevMonth.getFullYear()}-${pad2(prevMonth.getMonth() + 1)}`;
  const nextParam = `${nextMonth.getFullYear()}-${pad2(nextMonth.getMonth() + 1)}`;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`?month=${prevParam}`}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm hover:bg-white/[0.06]"
          >
            &#8592; {MONTHS_SHORT[prevMonth.getMonth()]}
          </Link>
          <span className="font-display text-base font-semibold">
            {MONTHS_SHORT[month]} {year}
          </span>
          <Link
            href={`?month=${nextParam}`}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm hover:bg-white/[0.06]"
          >
            {MONTHS_SHORT[nextMonth.getMonth()]} &#8594;
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <CalendarMonth year={year} month={month} dayMap={dayMap} selected={selected} />
      </div>

      {selected && (
        <div className="mt-6">
          <div className="mb-3 font-display text-lg font-bold">
            Trades on {selected}
            {dayMap[selected] && (
              <span className={' ml-3 text-base font-semibold ' + (dayMap[selected].pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {fmtMoney(dayMap[selected].pnl)}
              </span>
            )}
          </div>
          {selectedTrades.length === 0 ? (
            <p className="text-sm text-white/55">No trades on this date.</p>
          ) : (
            <TradeTable trades={selectedTrades} journals={[]} />
          )}
        </div>
      )}
    </div>
  );
}
