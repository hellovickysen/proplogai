"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo, { LogoMark } from '@/components/Logo';

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

export default function Sidebar({ email, credits, avatarUrl, isAdmin, adminNotifCount = 0 }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Read preference from localStorage after mount (avoids SSR hydration mismatch) */
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'false') setCollapsed(false);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
    setMenuOpen(false);
  }

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

  const initial = email ? email.charAt(0).toUpperCase() : '?';

  return (
    <aside
      className="hidden flex-shrink-0 border-r border-white/10 bg-[#0b0b14] sm:block transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? 60 : 200 }}
    >
      <div className="sticky top-0 flex h-dvh flex-col py-5" style={{ width: collapsed ? 60 : 200, transition: 'width 300ms ease-in-out' }}>

        {/* ── Logo + Toggle ── */}
        <div className={'mb-5 flex items-center ' + (collapsed ? 'flex-col gap-2 px-2' : 'justify-between px-3')}>
          <Link href="/dashboard" title="Dashboard">
            {collapsed
              ? <LogoMark size={28} rounded="rounded-lg" />
              : <Logo size={32} wordmarkClassName="font-display text-base font-bold" />
            }
          </Link>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="grid h-7 w-7 place-items-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={'transition-transform duration-300 ' + (collapsed ? 'rotate-180' : '')}>
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── New Trade ── */}
        <div className={collapsed ? 'mb-4 px-2' : 'mb-5 px-3'}>
          <Link
            href="/dashboard/trades/new"
            title="New Trade"
            className={'block rounded-xl font-semibold text-[#08080f] transition-all ' + (collapsed ? 'py-2.5 text-center text-sm' : 'px-4 py-2.5 text-center text-sm')}
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {collapsed ? '+' : '+ New Trade'}
          </Link>
        </div>

        {/* ── Nav ── */}
        <nav className={'flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden ' + (collapsed ? 'px-1.5' : 'px-2')}>
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={
                  'flex items-center gap-2.5 rounded-xl whitespace-nowrap text-sm transition-all ' +
                  (collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5') + ' ' +
                  (active
                    ? 'bg-white/[0.08] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]'
                    : 'text-white/55 hover:bg-white/[0.04] hover:text-white/80')
                }
              >
                <span className={collapsed ? 'text-center text-sm' : 'w-5 text-center text-sm'}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom section ── */}
        <div className={'relative mt-4 border-t border-white/[0.06] pt-3 ' + (collapsed ? 'px-1.5' : 'px-2')}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            title={email || 'Account'}
            className={
              'flex w-full items-center rounded-xl transition-all hover:bg-white/[0.04] ' +
              (collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2.5 text-left')
            }
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
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs text-white/70">{email || 'Account'}</div>
                </div>
                <span className={'text-[10px] text-white/30 transition-transform ' + (menuOpen ? 'rotate-180' : '')}>&#9650;</span>
              </>
            )}
          </button>

          {/* User popup */}
          {menuOpen && (
            <div
              className={
                'absolute z-50 rounded-xl border border-white/10 bg-[#12121a] p-3 shadow-xl ' +
                (collapsed
                  ? 'bottom-0 left-full ml-2 w-56'
                  : 'bottom-full left-2 right-2 mb-2')
              }
            >
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
