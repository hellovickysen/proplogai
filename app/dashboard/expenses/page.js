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
    .order('expense_date', { ascending: false, nullsFirst: false });

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('payout_date', { ascending: false, nullsFirst: false });

  return <ExpenseTracker expenses={expenses || []} payouts={payouts || []} />;
}
