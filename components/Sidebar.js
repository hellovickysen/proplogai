"use client";

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

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  }

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
      </div>
    </aside>
  );
}
