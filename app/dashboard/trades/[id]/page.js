import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fmtMoney, fmtR, num } from '@/lib/stats';
import JournalSection from '@/components/JournalSection';
import DeleteTradeButton from '@/components/DeleteTradeButton';
import ShareButton from '@/components/ShareButton';
import AiInsight from '@/components/AiInsight';
import AnalyzeButton from '@/components/AnalyzeButton';

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
      <div className="font-mono text-[9px] uppercase tracking-wider text-white/35">{label}</div>
      <div className="mt-0.5 font-mono text-sm">{value}</div>
    </div>
  );
}

export default async function TradeDetailPage({ params }) {
  const id = params.id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: trade } = await supabase.from('trades').select('*').eq('id', id).maybeSingle();
  if (!trade) notFound();
  const { data: journal } = await supabase.from('journal_entries').select('*').eq('trade_id', id).maybeSingle();
  const { data: insight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('trade_id', id)
    .eq('type', 'trade_analysis')
    .maybeSingle();

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('custom_emotions, default_confidence, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

  const win = num(trade.pnl) >= 0;

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Header — compact */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/trades" className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/60">&larr;</Link>
          <div>
            <h1 className="font-display text-xl font-bold">
              {trade.pair}{' '}
              <span className={'ml-1 rounded px-2 py-0.5 align-middle font-mono text-[11px] ' + (trade.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                {(trade.direction || '').toUpperCase()}
              </span>
            </h1>
            <div className="mt-0.5 font-mono text-[11px] text-white/35">
              {trade.trade_date || fmtDateTime(trade.closed_at || trade.created_at)}
              {trade.session ? <span className="ml-2 text-white/25">· {trade.session}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton type="trade" data={{ pnl: trade.pnl, pair: trade.pair, direction: trade.direction, entry_price: trade.entry_price, exit_price: trade.exit_price, setup: trade.setup, session: trade.session, trade_date: trade.trade_date || trade.closed_at || trade.created_at }} />
          <Link href={'/dashboard/trades/' + id + '/edit'} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white">Edit trade</Link>
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
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/35">Result</div>
                <div className={'mt-0.5 font-display text-2xl font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(trade.pnl)}</div>
              </div>
              <div className={'font-mono text-base ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtR(trade.r_multiple)}</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Fact label="Entry" value={trade.entry_price != null ? trade.entry_price : '—'} />
              <Fact label="Exit" value={trade.exit_price != null ? trade.exit_price : '—'} />
              <Fact label="Stop" value={trade.stop_loss != null ? trade.stop_loss : '—'} />
              <Fact label="Target" value={trade.take_profit != null ? trade.take_profit : '—'} />
              <Fact label="Lot" value={trade.lot_size != null ? trade.lot_size : '—'} />
              <Fact label="Timeframe" value={trade.timeframe || '—'} />
              <Fact label="Setup" value={trade.setup || '—'} />
              <Fact label="Session" value={trade.session || '—'} />
              <Fact label="Date" value={trade.trade_date || fmtDateTime(trade.closed_at || trade.created_at)} />
            </div>
          </div>

          {/* AI Coach */}
          {insight ? (
            <AiInsight insight={insight} tradeId={id} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-5">
              <div className="font-display text-sm font-semibold" style={gradientText}>&#10022; AI Coach</div>
              <p className="mb-3 mt-1.5 text-sm leading-relaxed text-white/50">
                Get an instant AI breakdown of this trade — your mistakes, what went well, and the one fix that matters most.
              </p>
              <AnalyzeButton tradeId={id} />
            </div>
          )}
        </div>

        {/* Right column — journal (view-only by default) */}
        <JournalSection tradeId={id} userId={user.id} journal={journal} prefs={prefs} />
      </div>
    </div>
  );
}
