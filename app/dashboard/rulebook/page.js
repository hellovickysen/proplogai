import { createClient } from '@/lib/supabase/server';
import RulebookGuardrailsPage from '@/components/rulebook/RulebookGuardrailsPage';

export const dynamic = 'force-dynamic';

export default async function RulebookRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rules, error: rulesError } = await supabase
    .from('rulebook_rules')
    .select('id, rule_key, category, title, value, unit, guidance, sort_order, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('category', 'non_negotiable')
    .order('sort_order', { ascending: true });

  if (rulesError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Rulebook</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Rulebook is not ready yet. Apply the Rulebook migration, then refresh this page.</p>
        </div>
      </div>
    );
  }

  return <RulebookGuardrailsPage rules={rules || []} />;
}
