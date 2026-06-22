"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: 'Dashboard', icon: '▦', href: '/dashboard' },
  { label: 'Trades', icon: '☰', href: '/dashboard/trades' },
  { label: 'AI Coach', icon: '✦', href: '/dashboard/coach' },
  { label: 'Accounts', icon: '⇄', href: '/dashboard/accounts' },
  { label: 'Settings', icon: '⚙', href: '#' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-white/10 bg-white/[0.02] p-4 sm:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 0 18px rgba(139,92,246,0.5)' }}>&#9670;</span>
        <span className="font-display text-lg font-bold tracking-tight">PipMind</span>
      </Link>
      <Link
        href="/dashboard/trades/new"
        className="mb-4 rounded-lg px-3 py-2 text-center text-sm font-semibold text-[#08080f]"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
      >
        + New Trade
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            item.href !== '#' &&
            (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm ' +
                (active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white')
              }
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
