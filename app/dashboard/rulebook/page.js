import { createClient } from '@/lib/supabase/server';
import RulebookPage from '@/components/rulebook/RulebookPage';

export const dynamic = 'force-dynamic';

export default async function RulebookRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: setups } = await supabase
    .from('setups')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  return <RulebookPage setups={setups || []} />;
}
