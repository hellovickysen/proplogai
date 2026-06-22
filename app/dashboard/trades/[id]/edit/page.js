import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TradeForm from '@/components/TradeForm';

export const dynamic = 'force-dynamic';

export default async function EditTradePage({ params }) {
  const id = params.id;
  const supabase = createClient();
  const { data: trade } = await supabase.from('trades').select('*').eq('id', id).maybeSingle();
  if (!trade) notFound();

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href={'/dashboard/trades/' + id} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60">&larr;</Link>
        <h1 className="font-display text-2xl font-bold">Edit trade</h1>
      </div>
      <TradeForm mode="edit" tradeId={id} initial={trade} />
    </div>
  );
}
