import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CalendarMonth from '@/components/calendar/CalendarMonth';
import CalendarTradeList from '@/components/calendar/CalendarTradeList';
import { num, fmtMoney } from '@/lib/stats';
import CalendarInsights from '@/components/calendar/CalendarInsights';
import BlurGate from '@/components/ui/BlurGate';
import { getUserAccess } from '@/lib/plans';
import { getActiveAccountId, applyAccountFilter } from '@/lib/accounts';

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

  // Plan access for feature gating
  const access = await getUserAccess(supabase, user);
  const planAccess = access.toJSON();

  // Multi-account: get active account filter
  const activeAccountId = await getActiveAccountId(supabase, user.id);

  // Calculate the start and end of the displayed month for date-range filtering
  const monthStartDate = `${year}-${pad2(month + 1)}-01`;
  const nextMonthVal = month === 11 ? 0 : month + 1;
  const nextYearVal = month === 11 ? year + 1 : year;
  const monthEndDate = `${nextYearVal}-${pad2(nextMonthVal + 1)}-01`;

  let monthQuery = supabase
    .from('trades')
    .select('id, pair, direction, pnl, setup, timeframe, session, trade_date, closed_at, created_at, entry_price, exit_price')
    .eq('user_id', user.id)
    .gte('trade_date', monthStartDate)
    .lt('trade_date', monthEndDate);
  monthQuery = applyAccountFilter(monthQuery, activeAccountId);
  const { data: trades, error: tradesError } = await monthQuery
    .order('trade_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Lightweight count query to check if user has any trades at all (for empty state)
  let countQuery = supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  countQuery = applyAccountFilter(countQuery, activeAccountId);
  const { count: totalTradeCount } = await countQuery;

  // All-time trades for CalendarInsights toggle (lightweight — only fields needed for insights)
  let allTradesQuery = supabase
    .from('trades')
    .select('pair, direction, pnl, session, trade_date, closed_at, created_at')
    .eq('user_id', user.id);
  allTradesQuery = applyAccountFilter(allTradesQuery, activeAccountId);
  const { data: allTrades } = await allTradesQuery;

  if (tradesError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Calendar</h1>
        <p className="text-white/50">
          Something went wrong loading your data. Please try refreshing the page.
        </p>
      </div>
    );
  }

  const list = trades || [];

  // Empty state — user has no trades at all (only for unfiltered view, not account-filtered)
  if (totalTradeCount === 0 && !activeAccountId) {
    return (
      <div className="p-6 mx-auto">
        <h1 className="text-2xl font-bold mb-6">Calendar</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">
            <div className="text-5xl mb-4 opacity-40">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-white/30">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white/80 mb-2">No trades yet</h2>
            <p className="text-sm text-white/40 max-w-xs mb-6">
              Once you log your first trade, your calendar will light up with daily P&L and trade history.
            </p>
            <Link href="/dashboard/trades/new" className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              Log Your First Trade
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch journal entries for the trades in this month (full data for accordion detail)
  const tradeIds = list.map((t) => t.id);
  let journalMap = {};
  if (tradeIds.length > 0) {
    const { data: journals, error: journalError } = await supabase
      .from('journal_entries')
      .select('trade_id, emotions, tags, note, screenshot_url, screenshot_urls, confidence')
      .in('trade_id', tradeIds);
    if (journalError) console.error('journal entries error', journalError);
    (journals || []).forEach((j) => {
      journalMap[j.trade_id] = j;
    });
  }

  // Enrich trade objects with full _journal metadata (used by CalendarTradeList accordion)
  const enrichedTrades = list.map((t) => {
    const j = journalMap[t.id];
    if (!j) return t;
    // Collect screenshot URLs into a flat array
    const screenshotUrls = [];
    if (j.screenshot_urls && j.screenshot_urls.length > 0) {
      screenshotUrls.push(...j.screenshot_urls);
    } else if (j.screenshot_url) {
      screenshotUrls.push(j.screenshot_url);
    }
    return {
      ...t,
      _journal: {
        emotions: j.emotions || [],
        tags: j.tags || [],
        note: j.note || '',
        screenshotUrls,
        hasNote: !!(j.note && j.note.trim()),
        hasImages: screenshotUrls.length > 0,
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
      const d = raw ? new Date(raw).getUTCDate() : null;
      if (d) journalDays[d] = true;
    }
  }

  // Build day/selected-date trades lookup
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
  const monthParam = `${year}-${pad2(month + 1)}`;

  return (
    <div className="p-6 mx-auto">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>

      {/* Calendar Insights — blurred for Basic users */}
      {list.length > 0 && (
        <BlurGate feature="calendar_insights" access={planAccess}>
          <CalendarInsights monthTrades={list} allTrades={allTrades || []} />
        </BlurGate>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
        {/* Month navigation in the calendar card header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <Link href={`/dashboard/calendar?month=${prevParam}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            &#8592; {MONTHS_SHORT[prevMonth.getMonth()]}
          </Link>
          <span className="font-semibold text-white">
            {MONTHS_SHORT[month]} {year}
          </span>
          <Link href={`/dashboard/calendar?month=${nextParam}`} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            {MONTHS_SHORT[nextMonth.getMonth()]} &rarr;
          </Link>
        </div>

        {/* CalendarMonth with the correct props it expects */}
        <CalendarMonth trades={enrichedTrades} year={year} month={month} selected={selected} monthlyPnl={monthlyPnl} journalDays={journalDays} monthParam={monthParam} />
      </div>

      {/* Day trades section below the calendar — expandable accordion */}
      {selected && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold">Trades on {selected}</h2>
            {dayMap[selected] && (
              <span className={`text-sm font-mono ${dayMap[selected].pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmtMoney(dayMap[selected].pnl)}
              </span>
            )}
          </div>
          <CalendarTradeList trades={selectedTrades} />
        </div>
      )}
    </div>
  );
}
