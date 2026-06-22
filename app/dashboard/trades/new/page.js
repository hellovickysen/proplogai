import Link from 'next/link';
import TradeForm from '@/components/TradeForm';

export const dynamic = 'force-dynamic';

export default function NewTradePage() {
  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/trades" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60">&larr;</Link>
        <h1 className="font-display text-2xl font-bold">Log new trade</h1>
      </div>
      <TradeForm mode="create" />
    </div>
  );
}
