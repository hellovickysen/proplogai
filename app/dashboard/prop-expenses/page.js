import { createClient } from '@/lib/supabase/server';
import ExpenseTracker from '@/components/expenses/ExpenseTracker';

export const dynamic = 'force-dynamic';

export default async function PropExpensesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('id, firm_name, account_type, account_size, purchase_type, account_cost, num_accounts, total_cost, expense_date, notes, created_at')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (expError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Prop Expenses</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: payouts, error: payError } = await supabase
    .from('payouts')
    .select('id, firm_name, amount, payout_date, notes, created_at')
    .eq('user_id', user.id)
    .order('payout_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (payError) console.error('payouts error', payError);

  const { data: trophies, error: trophiesError } = await supabase
    .from('trophies')
    .select('id, title, category, description, file_url, firm_name, is_public, share_id, trophy_date, created_at')
    .eq('user_id', user.id)
    .order('trophy_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (trophiesError) console.error('trophies error', trophiesError);

  return <ExpenseTracker expenses={expenses || []} payouts={payouts || []} trophies={trophies || []} />;
}
