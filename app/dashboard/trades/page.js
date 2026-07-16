import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TradeFilters from '@/components/trades/TradeFilters';
import ExportButton from '@/components/trades/ExportButton';
import BlurGate from '@/components/ui/BlurGate';
import { getUserAccess } from '@/lib/plans';
import { getActiveAccountId, applyAccountFilter } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export default async function TradesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Multi-account: get active account filter
  const activeAccountId = await getActiveAccountId(supabase, user.id);

  let tradesQuery = supabase
    .from('trades')
    .select('id, pair, direction, pnl, setup, setup_id, setup_followed, no_setup_reason, timeframe, session, trade_date, closed_at, created_at, entry_price, exit_price, stop_loss, take_profit, lot_size, source')
    .eq('user_id', user.id);
  tradesQuery = applyAccountFilter(tradesQuery, activeAccountId);
  const { data: trades, error: tradesError } = await tradesQuery
    .order('trade_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (tradesError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Trades</h1>
        <p className="text-white/50">
          Something went wrong loading your data. Please try refreshing the page.
        </p>
      </div>
    );
  }

  const list = trades || [];

  // Plan access for conditional features
  const access = await getUserAccess(supabase, user);
  const planAccess = access.toJSON();

  // Fetch all journal entries for these trades to get emotions, confidence
  const tradeIds = list.map((t) => t.id);
  let journalMap = {};
  if (tradeIds.length > 0) {
    const { data: journals, error: journalError } = await supabase
      .from('journal_entries')
      .select('trade_id, emotions, tags, note, lesson, screenshot_url, screenshot_urls, confidence')
      .in('trade_id', tradeIds);
    if (journalError) console.error('journal entries error', journalError);
    (journals || []).forEach((j) => {
      const urls = Array.isArray(j.screenshot_urls) ? j.screenshot_urls.filter(Boolean) : [];
      const hasImages = urls.length > 0 || (j.screenshot_url && j.screenshot_url !== '');
      journalMap[j.trade_id] = {
        emotions: j.emotions || [],
        tags: Array.isArray(j.tags) ? j.tags : [],
        hasNote: !!(j.note && j.note.trim()),
        hasLesson: !!(j.lesson && j.lesson.trim()),
        hasImages,
        confidence: j.confidence != null ? j.confidence : null,
      };
    });
  }

  // Attach journal data to each trade as _journal
  const enriched = list.map((t) => ({
    ...t,
    _journal: journalMap[t.id] || null,
  }));

  // Fetch user prefs for filter options
  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('custom_emotions, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();
  if (prefsError) console.error('user preferences error', prefsError);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Trades</h1>
          {enriched.length > 0 && <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-mono text-white/60">{enriched.length} total</span>}
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {enriched.length > 0 && (
            access.canUse('csv_export') ? (
              <ExportButton />
            ) : (
              <BlurGate feature="csv_export" access={planAccess} compact>
                <ExportButton />
              </BlurGate>
            )
          )}
          <Link href="/dashboard/trades/new" className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + New Trade
          </Link>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4 opacity-40">
            &#9776;
          </div>
          <h2 className="text-lg font-semibold text-white/80 mb-2">No trades yet</h2>
          <p className="text-sm text-white/40 max-w-xs mb-6">
            Log your first trade to start tracking your performance. It only takes 30 seconds.
          </p>
          <Link href="/dashboard/trades/new" className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            + Log your first trade
          </Link>
        </div>
      ) : (
        <div>
          <TradeFilters trades={enriched} prefs={prefs} />
        </div>
      )}
    </div>
  );
}
