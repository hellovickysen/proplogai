import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TradeTable from '@/components/TradeTable';

export const dynamic = 'force-dynamic';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export default async function TradesPage() {
  const supabase = createClient();
  const { data: trades } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
  const list = trades || [];

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Trades</h1>
        <Link
          href="/dashboard/trades/new"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          + New Trade
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            ☰
          </div>
          <h2 className="font-display text-xl font-bold">No trades yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
            Log your first trade to start tracking your performance. It only takes 30 seconds — just the pair, direction, and P&L.
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
          <TradeTable rows={list} />
        </div>
      )}
    </div>
  );
}
