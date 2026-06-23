import { createClient } from '@/lib/supabase/server';
import PlaybookPage from '@/components/PlaybookPage';

export const dynamic = 'force-dynamic';

export default async function PlaybookRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: setups } = await supabase
    .from('setups')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  return <PlaybookPage setups={setups || []} />;
}
