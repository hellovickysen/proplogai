"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import PlanBadge from '@/components/ui/PlanBadge';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades',    icon: '☰', href: '/dashboard/trades' },
  { label: 'Rulebook',  icon: '📋', href: '/dashboard/rulebook' },
  { label: 'Calendar',  icon: '📅', href: '/dashboard/calendar' },
  { label: 'Prop Expenses',  icon: '💳', href: '/dashboard/prop-expenses' },
  { label: 'Trophies',  icon: '🏆', href: '/dashboard/trophies' },
  { label: 'AI Coach',  icon: '✦', href: '/dashboard/coach' },
  { label: 'Tools',     icon: '🛠', href: '/dashboard/tools' },
  { label: 'Referrals', icon: '🔗', href: '/dashboard/referrals' },
];

export default function MobileNav({ email, avatarUrl, isAdmin, adminNotifCount = 0, credits, fullName = '', planAccess = null }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Collapse account menu when drawer closes
  useEffect(() => {
    if (!open) setAccountOpen(false);
  }, [open]);

  const initial = fullName ? fullName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : '?';

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href.includes('?')) {
      const [path, qs] = href.split('?');
      if (pathname !== path) return false;
      const params = new URLSearchParams(qs);
      for (const [k, v] of params) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }
    if (href === '/dashboard/settings') {
      return (pathname === '/dashboard/settings' && !searchParams.get('tab'));
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  function close() { setOpen(false); }

  function NavItem({ item }) {
    const active = isActive(item.href);
    return (
      <Link
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
        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }} />
        )}
      </Link>
    );
  }

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

      {/* Backdrop — only rendered when open */}
      {open && (
        <div
          onClick={close}
          onTouchEnd={(e) => { e.preventDefault(); close(); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.75)',
            WebkitBackdropFilter: 'blur(24px)',
            backdropFilter: 'blur(24px)',
          }}
        />
      )}

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

        {/* -- Main Nav (scrollable) -- */}
        <nav className="relative flex-1 overflow-y-auto px-3 py-1">
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => <NavItem key={item.href} item={item} />)}
          </div>
          {/* Blur overlay when account menu is expanded — tap to close */}
          {accountOpen && (
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
              onClick={() => setAccountOpen(false)}
            />
          )}
        </nav>

        {/* -- Bottom: Credits + Admin + Expandable Avatar -- */}
        {/* pb-20 clears the MobileBottomNav sticky bar + safe-area */}
        <div className="border-t border-white/[0.06] px-3 pt-3 pb-20">
          {/* Credits — always visible (FOMO) */}
          {credits != null && Number(credits) > 0 && (
            <Link
              href="/dashboard/referrals"
              onClick={close}
              className="mb-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2 text-white/45"><span className="w-5 text-center text-sm">💎</span> Credits</span>
              <span className="font-mono text-xs font-semibold text-emerald-400">${Number(credits).toFixed(2)}</span>
            </Link>
          )}

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
              {adminNotifCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#08080f]" style={{ background: 'linear-gradient(135deg,#f87171,#fbbf24)' }}>
                  {adminNotifCount}
                </span>
              )}
            </Link>
          )}

          {/* Expandable Avatar Card */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
            {/* Avatar row — tap to toggle */}
            <button
              onClick={() => setAccountOpen(o => !o)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover border border-white/10" />
              ) : (
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-sm font-bold text-[#08080f]" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}>
                  {initial}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {fullName && <span className="truncate text-xs font-semibold text-white">{fullName}</span>}
                  <PlanBadge access={planAccess} />
                </div>
                <div className="truncate text-[11px] text-white/40">{email || 'Account'}</div>
              </div>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={'flex-shrink-0 transition-transform duration-200 ' + (accountOpen ? 'rotate-90 text-white/50' : 'text-white/25')}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Expanded menu items */}
            {accountOpen && (
              <div className="border-t border-white/[0.06] px-2 py-1.5 flex flex-col gap-0.5">
                <Link
                  href="/dashboard/settings"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/80"
                >
                  <span className="w-5 text-center text-sm">⚙</span> Settings
                </Link>
                <Link
                  href="/dashboard/support"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/80"
                >
                  <span className="w-5 text-center text-sm">💬</span> Help & Support
                </Link>
                <Link
                  href="/dashboard/settings?tab=billing"
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white/80"
                >
                  <span className="w-5 text-center text-sm">💎</span> Subscription
                </Link>
                <form action="/auth/signout" method="post">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-400/60 transition-colors hover:bg-red-400/[0.06] hover:text-red-400">
                    <span className="w-5 text-center">↪</span> Sign Out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
