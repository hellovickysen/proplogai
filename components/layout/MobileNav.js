"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import PlanBadge from '@/components/ui/PlanBadge';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades',    icon: '☰', href: '/dashboard/trades' },
  { label: 'Rulebook',  icon: '📋', href: '/dashboard/rulebook' },
  { label: 'Calendar',  icon: '📅', href: '/dashboard/calendar' },
  { label: 'Expenses',  icon: '💳', href: '/dashboard/expenses' },
  { label: 'Trophies',  icon: '🏆', href: '/dashboard/trophies' },
  { label: 'AI Coach',  icon: '✦', href: '/dashboard/coach' },
  { label: 'Referrals', icon: '🔗', href: '/dashboard/referrals' },
  { label: 'Feedback',  icon: '💬', href: '/dashboard/support' },
  { label: 'Settings',  icon: '⚙', href: '/dashboard/settings' },
];

export default function MobileNav({ email, avatarUrl, isAdmin, adminNotifCount = 0, credits, fullName = '', planAccess = null, openTicketCount = 0 }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /* prevent body scroll when drawer is open */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const initial = fullName ? fullName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : '?';

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  function close() { setOpen(false); }

  return (
    <div className="sm:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg text-white/70"
      >
        &#9776;
      </button>

      {/* Backdrop */}
      <div
        className={'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ' + (open ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={close}
      />

      {/* Slide-from-left drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={'fixed left-0 top-0 z-50 flex h-dvh w-[280px] flex-col border-r border-white/10 bg-[#0b0b14] shadow-2xl transition-transform duration-300 ease-in-out ' + (open ? 'translate-x-0' : '-translate-x-full')}
      >
        {/* -- Logo + Close -- */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <Link href="/dashboard" onClick={close} className="flex items-center gap-2.5">
            <Logo size={30} wordmarkClassName="font-display text-base font-bold" />
          </Link>
          <button
            onClick={close}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/50 hover:text-white"
          >
            &#10005;
          </button>
        </div>

        {/* -- New Trade button -- */}
        <div className="px-4 pb-3">
          <Link
            href="/dashboard/trades/new"
            onClick={close}
            className="block rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            + New Trade
          </Link>
        </div>

        {/* -- Nav links -- */}
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ' +
                    (active
                      ? 'bg-white/[0.08] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                      : 'text-white/55 hover:bg-white/[0.04] hover:text-white/80')
                  }
                >
                  <span className="w-5 text-center text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === '/dashboard/support' && openTicketCount > 0 && (
                    <span
                      className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-[#08080f]"
                      style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                    >
                      {openTicketCount}
                    </span>
                  )}
                  {active && !(item.href === '/dashboard/support' && openTicketCount > 0) && (
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* -- Bottom section -- */}
        <div className="border-t border-white/[0.06] px-3 py-3">
          {/* Admin Panel */}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={close}
              className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-white/[0.08]"
              style={{ background: 'linear-gradient(120deg, rgba(248,113,113,0.1), rgba(251,191,36,0.1))', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              <span>&#9881;</span>
              <span className="text-amber-300">Admin Panel</span>
              {adminNotifCount > 0 ? (
                <span
                  className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#08080f]"
                  style={{ background: 'linear-gradient(135deg,#f87171,#fbbf24)' }}
                >
                  {adminNotifCount}
                </span>
              ) : (
                <span
                  className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white/40"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  0
                </span>
              )}
            </Link>
          )}

          {/* Credits */}
          {credits != null && (
            <Link
              href="/dashboard/referrals"
              onClick={close}
              className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.08]"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Credits</span>
              <span className="font-display text-sm font-bold text-emerald-400">${Number(credits).toFixed(2)}</span>
            </Link>
          )}

          {/* User row -- avatar + email */}
          <Link
            href="/dashboard/settings"
            onClick={close}
            className="mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover border border-white/10" />
            ) : (
              <div
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-sm font-bold text-[#08080f]"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {fullName && <span className="truncate text-xs font-semibold text-white">{fullName}</span>}
                <PlanBadge access={planAccess} />
              </div>
              <div className="truncate font-mono text-xs text-white/55">{email || 'Account'}</div>
            </div>
          </Link>

          {/* Sign out */}
          <form action="/auth/signout" method="post">
            <button className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
