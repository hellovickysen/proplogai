import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CalendarMonth from '@/components/calendar/CalendarMonth';
import TradeTable from '@/components/trades/TradeTable';
import { num, fmtMoney } from '@/lib/stats';
import CalendarInsights from '@/components/calendar/CalendarInsights';

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

  // Calculate the start and end of the displayed month for date-range filtering
  const monthStartDate = `${year}-${pad2(month + 1)}-01`;
  const nextMonthVal = month === 11 ? 0 : month + 1;
  const nextYearVal = month === 11 ? year + 1 : year;
  const monthEndDate = `${nextYearVal}-${pad2(nextMonthVal + 1)}-01`;

  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, setup, timeframe, session, trade_date, closed_at, created_at, entry_price, exit_price')
    .eq('user_id', user.id)
    .gte('trade_date', monthStartDate)
    .lt('trade_date', monthEndDate)
    .order('trade_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

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

  // Empty state — user has no trades at all
  if (totalTradeCount === 0) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-semibold text-white/70">No trades yet</h2>
          <p className="mt-2 max-w-sm text-sm text-white/45">
            Once you log your first trade, your calendar will light up with daily P&L and trade history.
          </p>
          <Link
            href="/dashboard/trades/new"
            className="mt-6 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-colors hover:bg-cyan-400"
          >
            Log Your First Trade
          </Link>
        </div>
      </div>
    );
  }

  // Fetch journal entries for the trades in this month
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

  // Enrich trade objects with _journal metadata (used by TradeTable)
  const enrichedTrades = list.map((t) => {
    const j = journalMap[t.id];
    if (!j) return t;
    return {
      ...t,
      _journal: {
        emotions: j.emotions || [],
        hasNote: !!(j.note && j.note.trim()),
        hasImages: !!(j.screenshot_url || (j.screenshot_urls && j.screenshot_urls.length > 0)),
        confidence: j.confidence != null ? j.confidence : null,
      },
    };
  });

  // Calculate monthly P/L (CalendarMonth expects this as a prop)
  const monthlyPnl = enrichedTrades.reduce((sum, t) => sum + num(t.pnl), 0);

  // Build journalDays map: { dayNumber: true } for days that have journal entries
  const journalDays = {};
  for (const t of enrichedTrades) {
    if (t._journal) {
      const raw = t.trade_date || t.closed_at || t.created_at;
      if (!raw) continue;
      const d = new Date(raw);
      if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
        journalDays[d.getUTCDate()] = true;
      }
    }
  }

  // The monthParam string that CalendarMonth uses for building links
  const monthParam = `${year}-${pad2(month + 1)}`;

  // Build day map for selected-date trades lookup
  const dayMap = {};
  for (const t of enrichedTrades) {
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
      </div>

      {list.length > 0 && <CalendarInsights trades={list} />}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        {/* Month navigation in the calendar card header */}
        <div className="mb-4 flex items-center justify-between">
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

        {/* CalendarMonth with the correct props it expects */}
        <CalendarMonth
          trades={enrichedTrades}
          year={year}
          month={month}
          selected={selected}
          monthParam={monthParam}
          monthlyPnl={monthlyPnl}
          journalDays={journalDays}
        />
      </div>

      {/* Day trades section below the calendar */}
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
            <TradeTable rows={selectedTrades} compact />
          )}
        </div>
      )}
    </div>
  );
}
