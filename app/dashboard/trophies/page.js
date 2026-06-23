import { createClient } from '@/lib/supabase/server';
import TrophyWall from '@/components/TrophyWall';

export const dynamic = 'force-dynamic';

export default async function TrophiesPage() {
  const supabase = createClient();

  const { data: trophies } = await supabase
    .from('trophies')
    .select('*')
    .order('created_at', { ascending: false });

  return <TrophyWall trophies={trophies || []} />;
}
