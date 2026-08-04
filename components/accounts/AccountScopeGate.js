"use client";

import { usePathname } from 'next/navigation';
import { setActiveAccount } from '@/app/dashboard/accounts/actions';

const ACCOUNT_SCOPED_PATHS = ['/dashboard/trades', '/dashboard/calendar', '/dashboard/coach'];

export default function AccountScopeGate({ accounts = [], activeAccountId, children }) {
  const pathname = usePathname();
  const requiresAccount = ACCOUNT_SCOPED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));

  if (!requiresAccount || activeAccountId || accounts.length === 0) return children;

  async function chooseAccount(accountId) {
    const result = await setActiveAccount(accountId);
    if (result?.ok) window.location.reload();
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/[0.08] text-xl text-cyan-300">◉</div>
        <h1 className="font-display text-xl font-bold">Choose an account</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">Select an account to view its trades. All Accounts is available on the Dashboard for combined performance only.</p>
        <div className="mt-6 space-y-2 text-left">
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => chooseAccount(account.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-colors hover:border-cyan-400/35 hover:bg-cyan-500/[0.06]"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: account.color || '#a78bfa' }} />
              <span className="text-sm font-semibold text-white">{account.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
