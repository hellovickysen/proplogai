import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fmtMoney, fmtR, num } from '@/lib/stats';
import JournalSection from '@/components/journal/JournalSection';
import DeleteTradeButton from '@/components/trades/DeleteTradeButton';
import ShareButton from '@/components/share/ShareButton';
import AiInsight from '@/components/coach/AiInsight';
import AnalyzeButton from '@/components/coach/AnalyzeButton';

export const dynamic = 'force-dynamic';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function fmtDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '—';
  }
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
      <div className="font-mono text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}

const NO_SETUP_LABELS = {
  revenge: 'Revenge trade',
  fomo: 'FOMO',
  boredom: 'Boredom',
  recover_loss: 'Recovering loss',
  overconfidence: 'Overconfidence',
  chasing: 'Chasing price',
  other: 'Other',
};

export default async function TradeDetailPage({ params }) {
  const id = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: trade } = await supabase.from('trades').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!trade) notFound();
  const { data: journal } = await supabase.from('journal_entries').select('*').eq('trade_id', id).maybeSingle();
  const { data: insight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('trade_id', id)
    .eq('type', 'trade_analysis')
    .maybeSingle();

  // Count AI analyses used this month (for usage badge)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count: aiUsedThisMonth } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'trade_analysis')
    .gte('created_at', monthStart.toISOString());

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('custom_emotions, default_confidence, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

  // Resolve setup names — from setup_ids (multi) or setup_id (single) or setup (text)
  let setupNames = [];
  const setupIdsList = Array.isArray(trade.setup_ids) && trade.setup_ids.length > 0
    ? trade.setup_ids
    : trade.setup_id
      ? [trade.setup_id]
      : [];

  if (setupIdsList.length > 0) {
    const { data: setupRows } = await supabase
      .from('setups')
      .select('id, name, direction, is_default')
      .in('id', setupIdsList);
    setupNames = setupRows || [];
  }

  // Fallback: if no setup rows found, use the text field
  const displaySetups = setupNames.length > 0
    ? setupNames.map((s) => s.name)
    : trade.setup
      ? trade.setup.split(', ').filter(Boolean)
      : [];

  const win = num(trade.pnl) >= 0;

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/trades" className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/60">&larr;</Link>
          <div>
            <h1 className="font-display text-xl font-bold">
              {trade.pair}{' '}
              <span className={'ml-1 rounded px-2 py-0.5 align-middle font-mono text-xs ' + (trade.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                {(trade.direction || '').toUpperCase()}
              </span>
            </h1>
            <div className="mt-0.5 font-mono text-xs text-white/50">
              {trade.trade_date || fmtDateTime(trade.closed_at || trade.created_at)}
              {trade.session ? <span className="ml-2 text-white/45">&middot; {trade.session}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton type="trade" data={{ pnl: trade.pnl, pair: trade.pair, direction: trade.direction, entry_price: trade.entry_price, exit_price: trade.exit_price, setup: trade.setup, session: trade.session, trade_date: trade.trade_date || trade.closed_at || trade.created_at }} />
          <Link href={'/dashboard/trades/' + id + '/edit'} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/60 hover:text-white">Edit trade</Link>
          <DeleteTradeButton tradeId={id} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Left column — trade facts + AI */}
        <div className="space-y-5">
          {/* Result + facts */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-white/50">Result</div>
                <div className={'mt-0.5 font-display text-2xl font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(trade.pnl)}</div>
              </div>
              <div className={'font-mono text-base ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtR(trade.r_multiple)}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Fact label="Entry" value={trade.entry_price != null ? trade.entry_price : '—'} />
              <Fact label="Exit" value={trade.exit_price != null ? trade.exit_price : '—'} />
              <Fact label="Stop" value={trade.stop_loss != null ? trade.stop_loss : '—'} />
              <Fact label="Target" value={trade.take_profit != null ? trade.take_profit : '—'} />
              <Fact label="Lot" value={trade.lot_size != null ? trade.lot_size : '—'} />
              <Fact label="Timeframe" value={trade.timeframe || '—'} />
              <Fact label="Session" value={trade.session || '—'} />
              <Fact label="Date" value={trade.trade_date || fmtDateTime(trade.closed_at || trade.created_at)} />
            </div>

            {/* Multi-setup display */}
            {displaySetups.length > 0 && (
              <div className="mt-4">
                <div className="font-mono text-xs uppercase tracking-wider text-white/50">Setups</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {displaySetups.map((name, i) => (
                    <span key={i} className={'rounded-full border px-2.5 py-0.5 text-xs font-semibold ' + (name === 'No Setup' ? 'border-red-400/20 bg-red-500/10 text-red-300' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300')}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rulebook Discipline badges */}
          {(trade.setup_followed || trade.no_setup_reason) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 font-display text-sm font-semibold" style={gradientText}>Rulebook discipline</div>
              <div className="flex flex-wrap gap-2">
                {trade.setup_followed && (
                  <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (trade.setup_followed === 'yes' ? 'bg-emerald-500/15 text-emerald-300' : trade.setup_followed === 'partial' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300')}>
                    {trade.setup_followed === 'yes' ? '✓ Followed setup' : trade.setup_followed === 'partial' ? '~ Partially followed' : '✗ Did not follow'}
                  </span>
                )}
                {trade.no_setup_reason && (
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300">
                    {NO_SETUP_LABELS[trade.no_setup_reason] || trade.no_setup_reason}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* AI Coach */}
          {insight ? (
            <AiInsight insight={insight} tradeId={id} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-5">
              <div className="font-display text-sm font-semibold" style={gradientText}>&#10022; AI Coach</div>
              <p className="mb-3 mt-1.5 text-sm leading-relaxed text-white/55">
                Get an instant AI breakdown of this trade — your mistakes, what went well, and the one fix that matters most.
              </p>
              <AnalyzeButton tradeId={id} usedThisMonth={aiUsedThisMonth || 0} />
            </div>
          )}
        </div>

        {/* Right column — journal */}
        <JournalSection tradeId={id} userId={user.id} journal={journal} prefs={prefs} />
      </div>
    </div>
  );
}
