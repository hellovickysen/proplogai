import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/plans';
import { getAccounts } from '@/lib/accounts';
import AccountManager from '@/components/accounts/AccountManager';
import BlurGate from '@/components/ui/BlurGate';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const access = await getUserAccess(supabase, user);
  const planAccess = access.toJSON();

  // Fetch accounts (even for Basic — they'll see the BlurGate)
  const accounts = await getAccounts(supabase, user.id);

  // Fetch per-account trade stats
  const accountStats = {};
  if (accounts.length > 0) {
    const { data: trades } = await supabase
      .from('trades')
      .select('account_id, pnl')
      .eq('user_id', user.id);

    (trades || []).forEach((t) => {
      const aid = t.account_id;
      if (!aid) return;
      if (!accountStats[aid]) accountStats[aid] = { totalPnl: 0, tradeCount: 0 };
      accountStats[aid].totalPnl += Number(t.pnl) || 0;
      accountStats[aid].tradeCount += 1;
    });
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Accounts</h1>
        <p className="mt-1 text-sm text-white/40">Manage your prop firm trading accounts</p>
      </div>

      <BlurGate feature="multi_account" access={planAccess}>
        <AccountManager accounts={accounts} stats={accountStats} />
      </BlurGate>
    </div>
  );
}
