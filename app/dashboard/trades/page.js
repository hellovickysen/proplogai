import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TradeFilters from '@/components/TradeFilters';
import ExportButton from '@/components/ExportButton';

export const dynamic = 'force-dynamic';

export default async function TradesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: trades } = await supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, setup, setup_id, setup_followed, no_setup_reason, timeframe, session, trade_date, closed_at, created_at, entry_price, exit_price, stop_loss, take_profit, lot_size, source')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false, nullsFirst: false });
  const list = trades || [];

  // Fetch all journal entries for these trades to get emotions
  const tradeIds = list.map((t) => t.id);
  let journalMap = {};
  if (tradeIds.length > 0) {
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('trade_id, emotions, note, screenshot_url, screenshot_urls')
      .in('trade_id', tradeIds);
    (journals || []).forEach((j) => {
      const urls = Array.isArray(j.screenshot_urls) ? j.screenshot_urls.filter(Boolean) : [];
      const hasImages = urls.length > 0 || (j.screenshot_url && j.screenshot_url !== '');
      journalMap[j.trade_id] = {
        emotions: j.emotions || [],
        hasNote: !!(j.note && j.note.trim()),
        hasImages,
      };
    });
  }

  // Attach journal data to each trade as _journal
  const enriched = list.map((t) => ({
    ...t,
    _journal: journalMap[t.id] || null,
  }));

  // Fetch user prefs for filter options
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('custom_emotions, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Trades</h1>
        <div className="flex items-center gap-2">
          {enriched.length > 0 && <ExportButton />}
          <Link
            href="/dashboard/trades/new"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            + New Trade
          </Link>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <TradeFilters trades={enriched} prefs={prefs} />
        </div>
      )}
    </div>
  );
}
