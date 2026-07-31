import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RulesMockupWorkspace from '@/components/discipline/RulesMockupWorkspace';

export const dynamic = 'force-dynamic';

export default async function DisciplinePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: program } = await supabase
    .from('discipline_programs')
    .select('id, started_at, first_propol_reveal_unlocked_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

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
    rules = rulesResult.data || [];
    focusRuleIds = (focusResult.data || []).map((row) => row.rule_id);
  }

  return (
    <RulesMockupWorkspace />
  );
}
