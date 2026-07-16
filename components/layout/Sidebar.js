"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Logo, { LogoMark } from '@/components/Logo';
import PlanBadge from '@/components/ui/PlanBadge';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades',    icon: '☰', href: '/dashboard/trades' },
  { label: 'Accounts',  icon: '📂', href: '/dashboard/accounts', elite: true },
  { label: 'Rulebook',  icon: '📋', href: '/dashboard/rulebook' },
  { label: 'Calendar',  icon: '📅', href: '/dashboard/calendar' },
  { label: 'Prop Expenses',  icon: '💳', href: '/dashboard/prop-expenses', tourId: 'nav-expenses' },
  { label: 'Trophies',  icon: '🏆', href: '/dashboard/trophies' },
  { label: 'AI Coach',  icon: '✦', href: '/dashboard/coach', tourId: 'nav-coach' },
  { label: 'Tools',     icon: '🛠', href: '/dashboard/tools' },
  { label: 'Referrals', icon: '🔗', href: '/dashboard/referrals' },
];

const SUPPORT_NAV = [
  { label: 'Settings',       icon: '⚙', href: '/dashboard/settings' },
  { label: 'Help & Support', icon: '?', href: '/dashboard/support' },
  { label: 'Subscription',   icon: '💎', href: '/dashboard/settings?tab=billing' },
];

export default function Sidebar({ email = '', fullName = '', avatarUrl = '', planAccess = null, credits = null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(true);

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
  }

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    // Handle query param routes like /dashboard/settings?tab=billing
    if (href.includes('?')) {
      const [path, qs] = href.split('?');
      if (pathname !== path) return false;
      const params = new URLSearchParams(qs);
      for (const [k, v] of params) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }
    // Settings path: only active when no tab param (otherwise Subscription takes it)
    if (href === '/dashboard/settings') {
      return (pathname === '/dashboard/settings' && !searchParams.get('tab'));
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  function NavItem({ item }) {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        {...(item.tourId ? { 'data-tour': item.tourId } : {})}
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
  }

  return (
    <aside
      className="relative hidden flex-shrink-0 overflow-visible border-r border-white/10 bg-[#0b0b14] sm:block transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? 60 : 200 }}
    >
      <div className="sticky top-0 flex h-dvh flex-col py-5" style={{ width: collapsed ? 60 : 200, transition: 'width 300ms ease-in-out' }}>

        {/* -- Logo -- */}
        <div className={'mb-5 ' + (collapsed ? 'flex justify-center px-2' : 'px-3')}>
          <Link href="/dashboard" title="Dashboard">
            {collapsed
              ? <LogoMark size={28} rounded="rounded-lg" />
              : <Logo size={32} wordmarkClassName="font-display text-base font-bold" />
            }
          </Link>
        </div>

        {/* -- Collapse/Expand toggle -- */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-[#12121a] text-white/40 shadow-lg transition-colors hover:bg-[#1a1a2e] hover:text-white/70"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={'transition-transform duration-300 ' + (collapsed ? 'rotate-180' : '')}>
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* -- Main Nav -- */}
        <nav className={'flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden ' + (collapsed ? 'px-1.5' : 'px-2')}>
          {NAV.filter((item) => !item.elite || (planAccess && planAccess.effectivePlan === 'elite')).map((item) => <NavItem key={item.href} item={item} />)}
        </nav>

        {/* -- Support Section -- */}
        <div className={'mt-2 border-t border-white/[0.06] pt-3 ' + (collapsed ? 'px-1.5' : 'px-2')}>
          {!collapsed && (
            <div className="mb-1.5 px-3 font-mono text-[9px] uppercase tracking-widest text-white/25">Support</div>
          )}
          <div className="flex flex-col gap-0.5">
            {SUPPORT_NAV.map((item) => <NavItem key={item.href} item={item} />)}
          </div>
          {/* Credits */}
          {credits != null && Number(credits) > 0 && !collapsed && (
            <Link
              href="/dashboard/referrals"
              className="mt-1.5 flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2 text-white/45"><span className="w-5 text-center">💎</span> Credits</span>
              <span className="font-mono text-xs font-semibold text-emerald-400">${Number(credits).toFixed(2)}</span>
            </Link>
          )}
          {credits != null && Number(credits) > 0 && collapsed && (
            <Link href="/dashboard/referrals" title={`Credits: $${Number(credits).toFixed(2)}`} className="mt-1 flex justify-center rounded-xl py-2 text-sm transition-all hover:bg-white/[0.04]">
              💎
            </Link>
          )}
        </div>

        {/* -- User Avatar Card -- */}
        <div className={'mt-3 border-t border-white/[0.06] pt-3 ' + (collapsed ? 'px-1.5' : 'px-2')}>
          <Link
            href="/dashboard/settings"
            title={email || 'Profile'}
            className={
              'flex w-full items-center rounded-xl transition-all hover:bg-white/[0.04] ' +
              (collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2.5')
            }
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-lg object-cover border border-white/10" />
            ) : (
              <div
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-xs font-bold text-[#08080f]"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
              >
                {(fullName || email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {fullName && <span className="truncate text-xs font-semibold text-white">{fullName}</span>}
                    {planAccess && <PlanBadge access={planAccess} />}
                  </div>
                  <div className="truncate text-[11px] text-white/40">{email}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/25 flex-shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </>
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}
