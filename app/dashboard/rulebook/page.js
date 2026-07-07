import { createClient } from '@/lib/supabase/server';
import RulebookPage from '@/components/rulebook/RulebookPage';
import { getUserAccess } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default async function RulebookRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: setups, error: setupsError } = await supabase
    .from('setups')
    .select('id, name, direction, description, is_default, is_active, sort_order, reference_images, created_at')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

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

  const access = await getUserAccess(supabase, user);
  const customLimit = access.limit('custom_setups');
  const safeLimit = customLimit === Infinity ? -1 : customLimit;

  return <RulebookPage setups={setups || []} customSetupLimit={safeLimit} planAccess={access.toJSON()} />;
}
