import { createClient } from '@/lib/supabase/server';
import TrophyWall from '@/components/trophies/TrophyWall';

export const dynamic = 'force-dynamic';

export default async function TrophiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trophies } = await supabase
    .from('trophies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch unique firm names from expenses for autocomplete
  const { data: expenses } = await supabase
    .from('expenses')
    .select('firm_name')
    .eq('user_id', user.id);
  const firmNames = [...new Set((expenses || []).map((e) => e.firm_name).filter(Boolean))].sort();

  // Fetch user plan for trophy limits
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .maybeSingle();
  const plan = (sub && sub.plan) || 'free';

  return <TrophyWall trophies={trophies || []} firmNames={firmNames} plan={plan} />;
}
