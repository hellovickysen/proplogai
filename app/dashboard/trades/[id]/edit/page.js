import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TradeForm from '@/components/trades/TradeForm';

export const dynamic = 'force-dynamic';

export default async function EditTradePage({ params }) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch the trade with user_id check
  const { data: trade, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !trade) {
    return (
      <div className="p-6">
        <Link href="/dashboard/trades" className="text-sm text-violet-400 hover:text-violet-300 mb-4 inline-flex items-center gap-1">
          &larr; Back to Trades
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4 opacity-30">🔍</div>
          <h2 className="text-lg font-semibold text-white/80 mb-2">Trade not found</h2>
          <p className="text-sm text-white/40">This trade doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  // Fetch user prefs
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('custom_emotions, custom_tags, default_confidence, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch rulebook setups
  const { data: setups } = await supabase
    .from('setups')
    .select('id, name, direction, is_default, is_active')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/dashboard/trades/${id}`} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60">&larr;</Link>
        <h1 className="font-display text-2xl font-bold">Edit trade</h1>
      </div>
      <TradeForm mode="edit" tradeId={id} initial={trade} prefs={prefs} setups={setups || []} />
    </div>
  );
}
