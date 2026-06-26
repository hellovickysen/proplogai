import { createClient } from '@/lib/supabase/server';
import ExpenseTracker from '@/components/expenses/ExpenseTracker';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('payout_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Fetch trophies to show in firm dashboards
  const { data: trophies } = await supabase
    .from('trophies')
    .select('id, title, category, description, file_url, firm_name, is_public, share_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <ExpenseTracker expenses={expenses || []} payouts={payouts || []} trophies={trophies || []} />;
}
