import { createClient } from '@/lib/supabase/server';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import PayoutsTable from '@/components/expenses/PayoutsTable';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('id, amount, category, description, date, created_at')
    .eq('user_id', user.id)
    .order('date', { ascending: false, nullsFirst: false });

  if (expError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Expenses & Payouts</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: payouts, error: payError } = await supabase
    .from('payouts')
    .select('id, amount, date, note, created_at')
    .eq('user_id', user.id)
    .order('date', { ascending: false, nullsFirst: false });
  if (payError) console.error('payouts error', payError);

  const expenseList = expenses || [];
  const payoutList = payouts || [];

  const totalExpenses = expenseList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalPayouts = payoutList.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Expenses & Payouts</h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-bold">Expenses</div>
            <div className="font-mono text-sm text-red-400">-${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <ExpensesTable expenses={expenseList} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-lg font-bold">Payouts</div>
            <div className="font-mono text-sm text-red-400">-${totalPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <PayoutsTable payouts={payoutList} />
        </div>
      </div>
    </div>
  );
}
