"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const ACTIONS = [
  { label: 'Log Trade', icon: '📈', href: '/dashboard/trades/new' },
  { label: 'Quick Log', icon: '⚡', href: '/dashboard/trades/new?quick=true' },
  { label: 'Add Expense', icon: '💳', href: '/dashboard/expenses?action=add' },
  { label: 'Add Payout', icon: '💰', href: '/dashboard/expenses?tab=payouts&action=add' },
  { label: 'Add Trophy', icon: '🏆', href: '/dashboard/trophies?action=add' },
  { label: 'AI Coach', icon: '✦', href: '/dashboard/coach' },
];

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      {/* Popup — opens upward */}
      {open && (
        <div className="absolute bottom-full right-0 mb-3 w-52 rounded-xl border border-white/10 bg-[#12121a] py-2 shadow-2xl">
          <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white/35">
            Quick Actions
          </div>
          {ACTIONS.map(a => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <span className="text-base w-5 text-center">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="grid h-12 w-12 place-items-center rounded-full text-xl font-bold text-[#08080f] shadow-lg shadow-violet-500/20 transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        title="Quick Actions"
      >
        <span className={'transition-transform duration-200 inline-block ' + (open ? 'rotate-45' : '')}>+</span>
      </button>
    </div>
  );
}
