"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Trades', href: '/dashboard/trades' },
  { label: 'Rulebook', href: '/dashboard/rulebook' },
  { label: 'Expenses', href: '/dashboard/expenses' },
  { label: 'Trophies', href: '/dashboard/trophies' },
  { label: 'Referrals', href: '/dashboard/referrals' },
  { label: 'Calendar', href: '/dashboard/calendar' },
  { label: 'AI Coach', href: '/dashboard/coach' },
  { label: 'Settings', href: '/dashboard/settings' },
  { label: '+ New Trade', href: '/dashboard/trades/new' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="sm:hidden">
      <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg text-white/70">&#9776;</button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-40 border-b border-white/10 bg-[#0b0b14] p-3 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={'rounded-lg px-3 py-3 text-sm hover:bg-white/5 hover:text-white ' + (pathname === l.href ? 'bg-white/10 text-white' : 'text-white/70')}>{l.label}</Link>
              ))}
              <form action="/auth/signout" method="post">
                <button className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-3 text-left text-sm text-white/70">Sign out</button>
              </form>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}
