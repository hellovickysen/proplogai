"use client";

import { useState } from 'react';
import Link from 'next/link';

const LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Trades', href: '/dashboard/trades' },
  { label: 'Calendar', href: '/dashboard/calendar' },
  { label: 'AI Coach', href: '/dashboard/coach' },
  { label: 'Accounts', href: '/dashboard/accounts' },
  { label: 'Settings', href: '/dashboard/settings' },
  { label: '+ New Trade', href: '/dashboard/trades/new' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg text-white/70"
      >
        &#9776;
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-white/10 bg-[#0b0b14] p-3 shadow-xl">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
                {l.label}
              </Link>
            ))}
            <form action="/auth/signout" method="post">
              <button className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-sm text-white/70">Sign out</button>
            </form>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
