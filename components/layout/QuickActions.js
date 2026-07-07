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

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Fullscreen backdrop blur when open */}
      {open && (
        <div
          className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div ref={ref} data-fab-menu className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[999]">
        {/* Popup — opens upward */}
        {open && (
          <div
            className="absolute bottom-full right-0 mb-3 w-56 rounded-2xl py-2 shadow-2xl"
            style={{
              background: 'rgba(18, 18, 26, 0.95)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              boxShadow: '0 0 30px rgba(167, 139, 250, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white/35">
              Quick Actions
            </div>
            {ACTIONS.map(a => (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-white/75 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                <span className="text-lg w-6 text-center">{a.icon}</span>
                <span className="font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* FAB button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="grid h-14 w-14 place-items-center rounded-full text-2xl font-bold text-[#08080f] transition-all hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
            boxShadow: open
              ? '0 0 25px rgba(167, 139, 250, 0.4), 0 0 60px rgba(34, 211, 238, 0.2)'
              : '0 4px 20px rgba(167, 139, 250, 0.3)',
          }}
          title="Quick Actions"
        >
          <span className={'transition-transform duration-200 inline-block ' + (open ? 'rotate-45' : '')}>+</span>
        </button>
      </div>
    </>
  );
}
