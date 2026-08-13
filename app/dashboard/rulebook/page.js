import { createClient } from '@/lib/supabase/server';
import RulebookDisciplinePage from '@/components/rulebook/RulebookDisciplinePage';
import { getActiveAccountId } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export default async function RulebookRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const activeAccountId = await getActiveAccountId(supabase, user.id);
  const { data: activeAccount } = activeAccountId
    ? await supabase.from('accounts').select('id, name').eq('id', activeAccountId).eq('user_id', user.id).eq('is_archived', false).maybeSingle()
    : { data: null };

  let rulesQuery = supabase
    .from('rulebook_rules')
    .select('id, account_id, rule_key, rule_type, category, title, value, unit, guidance, enabled, metadata, sort_order, created_at, updated_at')
    .eq('user_id', user.id);
  rulesQuery = activeAccount ? rulesQuery.or('account_id.is.null,account_id.eq.' + activeAccount.id) : rulesQuery.is('account_id', null);
  const { data: rules, error: rulesError } = await rulesQuery.order('category', { ascending: true }).order('sort_order', { ascending: true });

  if (rulesError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Rulebook</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Rulebook needs the expanded discipline migration before it can load.</p>
        </div>
      </div>
    );
  }

  return <RulebookDisciplinePage rules={rules || []} scopeAccount={activeAccount || null} />;
}
