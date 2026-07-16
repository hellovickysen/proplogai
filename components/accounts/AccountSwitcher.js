'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setActiveAccount } from '@/app/dashboard/accounts/actions';
import { UpgradeModal } from '@/components/ui/BlurGate';

const PHASE_BADGES = {
  challenge: { label: 'Challenge', cls: 'bg-amber-500/15 text-amber-300 border-amber-400/30' },
  funded: { label: 'Funded', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' },
  payout: { label: 'Payout', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30' },
};

function fmtPnl(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return sign + '$' + Math.round(abs);
}

/**
 * AccountSwitcher — global account selector pill for the dashboard header.
 * Visible to ALL users. Basic users see upgrade modal on interaction.
 */
export default function AccountSwitcher({ accounts, activeAccountId, todayStats = {}, planAccess }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  const isElite = planAccess && (planAccess.isAdmin || planAccess.isBeta || planAccess.effectivePlan === 'elite');
  const hasAccounts = accounts.length > 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function handlePillClick() {
    if (!isElite) {
      setShowUpgrade(true);
      return;
    }
    setOpen(!open);
  }

  async function switchAccount(accountId) {
    setSwitching(true);
    setOpen(false);
    const res = await setActiveAccount(accountId);
    if (res.ok) {
      window.location.reload();
      return;
    }
    setSwitching(false);
  }

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const displayName = activeAccount ? activeAccount.name : 'All Accounts';
  const displayColor = activeAccount ? activeAccount.color : null;

  // Compute total today P&L across all accounts
  const allPnl = Object.values(todayStats).reduce((sum, s) => sum + (s.pnl || 0), 0);

  // Green active indicator
  const greenDot = (
    <span className="h-2 w-2 rounded-full flex-shrink-0 bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
  );

  // Lock icon for Basic users
  const lockIcon = (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400 flex-shrink-0">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );

  return (
    <div className="relative" ref={ref}>
      {/* Pill button — desktop */}
      <button
        onClick={handlePillClick}
        disabled={switching}
        className={'hidden sm:flex items-center gap-2 rounded-lg border px-2.5 py-1.5 min-h-[36px] text-xs font-medium transition-colors disabled:opacity-50 ' +
          (isElite
            ? 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]'
            : 'border-violet-400/20 bg-violet-500/[0.05] text-white/60 hover:bg-violet-500/[0.1]')}
      >
        {isElite ? greenDot : lockIcon}
        {isElite && displayColor && (
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: displayColor, boxShadow: `0 0 6px ${displayColor}40` }}
          />
        )}
        <span className="max-w-[120px] truncate">{isElite ? displayName : 'Accounts'}</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className={'text-white/40 transition-transform ' + (open ? 'rotate-180' : '')}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Mobile: compact button */}
      <button
        onClick={handlePillClick}
        disabled={switching}
        className={'sm:hidden flex items-center justify-center gap-1 rounded-lg border h-9 px-2 disabled:opacity-50 ' +
          (isElite
            ? 'border-white/10 bg-white/[0.03]'
            : 'border-violet-400/20 bg-violet-500/[0.05]')}
      >
        {isElite ? greenDot : lockIcon}
        {isElite && displayColor && (
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: displayColor, boxShadow: `0 0 6px ${displayColor}40` }} />
        )}
      </button>

      {/* Dropdown — Elite only */}
      {open && isElite && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-white/10 bg-[#12121a] py-1.5 shadow-2xl">
          {/* All Accounts option */}
          <button
            onClick={() => switchAccount(null)}
            className={'flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ' +
              (!activeAccountId ? 'bg-emerald-500/[0.06] border-l-2 border-l-emerald-400' : 'hover:bg-white/[0.04] border-l-2 border-l-transparent')}
          >
            <span className="h-2 w-2 rounded-full bg-white/30 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">All Accounts</div>
              {Object.keys(todayStats).length > 0 && (
                <div className={'font-mono text-[11px] ' + (allPnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70')}>
                  Today {fmtPnl(allPnl)}
                </div>
              )}
            </div>
            {!activeAccountId && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
            )}
          </button>

          {hasAccounts && (
            <div className="mx-3 my-1 border-t border-white/[0.06]" />
          )}

          {/* Individual accounts */}
          {accounts.map((account) => {
            const stats = todayStats[account.id] || {};
            const pnl = stats.pnl || 0;
            const isActive = activeAccountId === account.id;
            const phase = PHASE_BADGES[account.phase];

            return (
              <button
                key={account.id}
                onClick={() => switchAccount(account.id)}
                className={'flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ' +
                  (isActive ? 'bg-emerald-500/[0.06] border-l-2 border-l-emerald-400' : 'hover:bg-white/[0.04] border-l-2 border-l-transparent')}
              >
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: account.color || '#a78bfa', boxShadow: `0 0 6px ${account.color || '#a78bfa'}40` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">{account.name}</span>
                    {phase && (
                      <span className={'rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ' + phase.cls}>
                        {phase.label}
                      </span>
                    )}
                  </div>
                  {account.prop_firm && (
                    <div className="text-[11px] text-white/40 truncate">{account.prop_firm}</div>
                  )}
                  {stats.tradeCount > 0 && (
                    <div className={'font-mono text-[11px] ' + (pnl >= 0 ? 'text-emerald-400/70' : 'text-red-400/70')}>
                      Today {fmtPnl(pnl)} · {stats.tradeCount} trade{stats.tradeCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
                )}
              </button>
            );
          })}

          {/* Manage accounts link */}
          <div className="mx-3 my-1 border-t border-white/[0.06]" />
          <Link
            href="/dashboard/accounts"
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-white/40 hover:text-white/70 transition-colors"
            onClick={() => setOpen(false)}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Manage accounts
          </Link>
        </div>
      )}

      {/* Upgrade modal for Basic users */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} feature="multi_account" />}
    </div>
  );
}
