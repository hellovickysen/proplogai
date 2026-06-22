import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fmtMoney, fmtR, num } from '@/lib/stats';
import JournalForm from '@/components/JournalForm';
import DeleteTradeButton from '@/components/DeleteTradeButton';

export const dynamic = 'force-dynamic';

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
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
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

  const win = num(trade.pnl) >= 0;

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/trades" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60">&larr;</Link>
          <div>
            <h1 className="font-display text-2xl font-bold">
              {trade.pair}{' '}
              <span className={'ml-1 rounded px-2 py-0.5 align-middle font-mono text-xs ' + (trade.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                {(trade.direction || '').toUpperCase()}
              </span>
            </h1>
            <div className="mt-1 font-mono text-xs text-white/40">{fmtDateTime(trade.closed_at || trade.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={'/dashboard/trades/' + id + '/edit'} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:text-white">Edit</Link>
          <DeleteTradeButton tradeId={id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">Result</div>
                <div className={'mt-1 font-display text-3xl font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(trade.pnl)}</div>
              </div>
              <div className={'font-mono text-lg ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtR(trade.r_multiple)}</div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact label="Entry" value={trade.entry_price != null ? trade.entry_price : '—'} />
              <Fact label="Exit" value={trade.exit_price != null ? trade.exit_price : '—'} />
              <Fact label="Stop" value={trade.stop_loss != null ? trade.stop_loss : '—'} />
              <Fact label="Target" value={trade.take_profit != null ? trade.take_profit : '—'} />
              <Fact label="Lot" value={trade.lot_size != null ? trade.lot_size : '—'} />
              <Fact label="Timeframe" value={trade.timeframe || '—'} />
              <Fact label="Setup" value={trade.setup || '—'} />
              <Fact label="Opened" value={fmtDateTime(trade.opened_at)} />
              <Fact label="Closed" value={fmtDateTime(trade.closed_at)} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-6">
            <div className="font-display text-base font-semibold" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              &#10022; AI Coach
            </div>
            <p className="mt-2 text-sm text-white/50">Per-trade AI analysis (mistake detection + psychology) arrives in the next sprint. Your journal below is what powers it.</p>
          </div>
        </div>

        <JournalForm tradeId={id} userId={user.id} initial={journal} />
      </div>
    </div>
  );
}
