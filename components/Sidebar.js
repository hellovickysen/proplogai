"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades',    icon: '☰', href: '/dashboard/trades' },
  { label: 'Playbook',  icon: '📋', href: '/dashboard/playbook' },
  { label: 'Expenses',  icon: '💳', href: '/dashboard/expenses' },
  { label: 'Trophies',  icon: '🏆', href: '/dashboard/trophies' },
  { label: 'Referrals', icon: '🔗', href: '/dashboard/referrals' },
  { label: 'Calendar',  icon: '📅', href: '/dashboard/calendar' },
  { label: 'AI Coach',  icon: '✦', href: '/dashboard/coach' },
  { label: 'Settings',  icon: '⚙', href: '/dashboard/settings' },
];

export default function Sidebar({ email, credits, avatarUrl }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Get initials from email
  const initial = email ? email.charAt(0).toUpperCase() : '?';

  return (
    <aside className="hidden w-[200px] flex-shrink-0 border-r border-white/10 bg-[#0b0b14] sm:block">
      <div className="sticky top-0 flex h-screen flex-col px-3 py-5">
        {/* Logo */}
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
          <div
            className="grid h-8 w-8 place-items-center rounded-xl text-sm font-bold text-[#08080f]"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
          >
            &#9670;
          </div>
          <span className="font-display text-base font-bold">PropJournal</span>
        </Link>

        {/* New Trade button */}
        <Link
          href="/dashboard/trades/new"
          className="mb-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          + New Trade
        </Link>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ' +
                  (active
                    ? 'bg-white/[0.08] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                    : 'text-white/55 hover:bg-white/[0.04] hover:text-white/80')
                }
              >
                <span className="w-5 text-center text-sm">{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Avatar menu — pinned to bottom */}
        <div className="relative mt-4 border-t border-white/[0.06] pt-3">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.04]"
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
              <div className="truncate text-xs text-white/70">{email || 'Account'}</div>
            </div>
            <span className={'text-[10px] text-white/30 transition-transform ' + (menuOpen ? 'rotate-180' : '')}>&#9650;</span>
          </button>

          {/* Popup menu */}
          {menuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-white/10 bg-[#12121a] p-3 shadow-xl">
              {/* Email */}
              <div className="mb-2 truncate px-1 font-mono text-[11px] text-white/50">{email}</div>

              {/* Credits */}
              {credits != null && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Credits</span>
                  <span className="font-display text-sm font-bold text-emerald-400">${Number(credits).toFixed(2)}</span>
                </div>
              )}

              {/* Sign out */}
              <form action="/auth/signout" method="post">
                <button className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
