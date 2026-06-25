import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TradeForm from '@/components/trades/TradeForm';

export const dynamic = 'force-dynamic';

export default async function NewTradePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('custom_emotions, default_confidence, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch rulebook setups for the trade form
  const { data: setups } = await supabase
    .from('setups')
    .select('id, name, direction, is_default, is_active')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/trades" className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/60">&larr;</Link>
        <h1 className="font-display text-2xl font-bold">Log new trade</h1>
      </div>
      <TradeForm mode="create" prefs={prefs} setups={setups || []} />
    </div>
  );
}
