"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades', icon: '☰', href: '/dashboard/trades' },
  { label: 'Playbook', icon: '\u{1F4CB}', href: '/dashboard/playbook' },
  { label: 'Calendar', icon: '\u{1F4C5}', href: '/dashboard/calendar' },
  { label: 'AI Coach', icon: '✦', href: '/dashboard/coach' },
  { label: 'Settings', icon: '⚙', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-white/10 bg-[#0a0a12] sm:flex">
      {/* Logo area with subtle glow */}
      <div className="relative px-5 pb-5 pt-6">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.06] to-transparent" />
        <Link href="/dashboard" className="relative flex items-center gap-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-sm"
            style={{
              background: 'linear-gradient(135deg,#a78bfa,#22d3ee)',
              boxShadow: '0 0 24px rgba(139,92,246,0.4), 0 0 8px rgba(34,211,238,0.2)',
            }}
          >
            &#9670;
          </span>
          <span className="font-display text-lg font-bold tracking-tight">PropJournal</span>
        </Link>
      </div>

      {/* New Trade CTA */}
      <div className="px-4 pb-4">
        <Link
          href="/dashboard/trades/new"
          className="block rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-[#08080f] transition-shadow hover:shadow-lg hover:shadow-violet-500/20"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          + New Trade
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active =
            item.href !== '#' &&
            (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ' +
                (active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80')
              }
            >
              {/* Active left accent bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg,#a78bfa,#22d3ee)' }}
                />
              )}
              <span className={'w-5 text-center transition-transform ' + (active ? 'scale-110' : 'group-hover:scale-105')}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: subtle brand line */}
      <div className="border-t border-white/[0.06] px-5 py-4">
        <p className="font-mono text-[10px] text-white/25">AI Prop Firm Journal</p>
      </div>
    </aside>
  );
}
