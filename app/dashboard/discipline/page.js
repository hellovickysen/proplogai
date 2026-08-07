import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveAccountId } from '@/lib/accounts';
import DisciplineRulesExperience from '@/components/discipline/DisciplineRulesExperience';

export const dynamic = 'force-dynamic';

export default async function DisciplinePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const activeAccountId = await getActiveAccountId(supabase, user.id);
  let programQuery = supabase
    .from('discipline_programs')
    .select('id, account_id, started_at, configured_at, first_propol_reveal_unlocked_at')
    .eq('user_id', user.id)
    .eq('status', 'active');

  programQuery = activeAccountId
    ? programQuery.eq('account_id', activeAccountId)
    : programQuery.is('account_id', null);

  const { data: program, error: programError } = await programQuery.maybeSingle();
  if (programError) throw new Error('Unable to load the active discipline programme.');

  let rules = [];
  let focusRuleIds = [];
  if (program) {
    const [rulesResult, focusResult] = await Promise.all([
      supabase
        .from('discipline_rules')
        .select('id, name, rule_type, metric, threshold, unit, instrument, version, is_active, effective_from')
        .eq('user_id', user.id)
        .eq('program_id', program.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('discipline_program_focus_rules')
        .select('rule_id')
        .eq('user_id', user.id)
        .eq('program_id', program.id)
        .order('sort_order', { ascending: true }),
    ]);
    if (rulesResult.error || focusResult.error) {
      throw new Error('Unable to load discipline rules.');
    }
    rules = rulesResult.data || [];
    focusRuleIds = (focusResult.data || []).map((row) => row.rule_id);
  }

  return (
    <DisciplineRulesExperience
      program={program}
      rules={rules}
      focusRuleIds={focusRuleIds}
      activeAccountId={activeAccountId}
    />
  );
}
