import { createClient } from '@/lib/supabase/server';
import TrophyWall from '@/components/trophies/TrophyWall';
import { getUserAccess } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default async function TrophiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trophies, error: trophiesError } = await supabase
    .from('trophies')
    .select('id, title, category, description, file_url, firm_name, is_public, share_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (trophiesError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Trophy Wall</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('firm_name')
    .eq('user_id', user.id);
  const firmNames = [...new Set((expenses || []).map((e) => e.firm_name).filter(Boolean))].sort();

  const access = await getUserAccess(supabase, user);

  return <TrophyWall trophies={trophies || []} firmNames={firmNames} planAccess={access.toJSON()} />;
}
