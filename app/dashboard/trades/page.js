import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TradeTable from '@/components/TradeTable';

export const dynamic = 'force-dynamic';

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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <TradeTable rows={list} />
      </div>
    </div>
  );
}
