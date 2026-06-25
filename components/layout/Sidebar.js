"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades',    icon: '☰', href: '/dashboard/trades' },
  { label: 'Rulebook',  icon: '📋', href: '/dashboard/rulebook' },
  { label: 'Expenses',  icon: '💳', href: '/dashboard/expenses' },
  { label: 'Trophies',  icon: '🏆', href: '/dashboard/trophies' },
  { label: 'Referrals', icon: '🔗', href: '/dashboard/referrals' },
  { label: 'Calendar',  icon: '📅', href: '/dashboard/calendar' },
  { label: 'AI Coach',  icon: '✦', href: '/dashboard/coach' },
  { label: 'Support',   icon: '🎧', href: '/dashboard/support' },
  { label: 'Settings',  icon: '⚙', href: '/dashboard/settings' },
];

export default function Sidebar({ email, credits, avatarUrl, isAdmin }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  const initial = email ? email.charAt(0).toUpperCase() : '?';

  return (
    <aside className="hidden w-[200px] flex-shrink-0 border-r border-white/10 bg-[#0b0b14] sm:block">
      <div className="sticky top-0 flex h-dvh flex-col px-3 py-5">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
          <Logo size={32} wordmarkClassName="font-display text-base font-bold" />
        </Link>

        <Link
          href="/dashboard/trades/new"
          className="mb-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          + New Trade
        </Link>

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

          {menuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-white/10 bg-[#12121a] p-3 shadow-xl">
              <div className="mb-2 truncate px-1 font-mono text-[11px] text-white/50">{email}</div>

              {credits != null && (
                <Link
                  href="/dashboard/referrals"
                  onClick={() => setMenuOpen(false)}
                  className="mb-2 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 transition-colors hover:bg-white/[0.08]"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Credits</span>
                  <span className="font-display text-sm font-bold text-emerald-400">${Number(credits).toFixed(2)}</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/[0.08]"
                  style={{ background: 'linear-gradient(120deg, rgba(248,113,113,0.1), rgba(251,191,36,0.1))', border: '1px solid rgba(248,113,113,0.2)' }}
                >
                  <span>&#9881;</span>
                  <span className="text-amber-300">Admin Panel</span>
                </Link>
              )}

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
