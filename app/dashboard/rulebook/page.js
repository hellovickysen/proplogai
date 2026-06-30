import { createClient } from '@/lib/supabase/server';
import RulebookPage from '@/components/rulebook/RulebookPage';

export const dynamic = 'force-dynamic';

export default async function RulebookRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: setups, error: setupsError } = await supabase
    .from('setups')
    .select('id, name, direction, description, is_default, is_active, sort_order, created_at')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  if (setupsError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Rulebook</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return <RulebookPage setups={setups || []} />;
}
