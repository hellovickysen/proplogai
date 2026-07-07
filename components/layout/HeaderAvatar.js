"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import PlanBadge from '@/components/ui/PlanBadge';

export default function HeaderAvatar({ email, fullName, avatarUrl, credits, isAdmin, adminNotifCount = 0, planAccess }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initial = fullName ? fullName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg hover:bg-white/[0.04] transition-colors px-1 py-1"
        title={email || 'Account'}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-8 w-8 rounded-lg object-cover border border-white/10" />
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', color: '#08080f' }}>
            {initial}
          </div>
        )}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={'text-white/30 transition-transform duration-200 ' + (open ? 'rotate-180' : '')}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#12121a] py-2 shadow-xl z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-white/10" />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', color: '#08080f' }}>
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {fullName && <span className="text-sm font-semibold text-white/85 truncate">{fullName}</span>}
                  {planAccess && <PlanBadge planAccess={planAccess} />}
                </div>
                <div className="text-xs text-white/40 truncate">{email}</div>
              </div>
            </div>
          </div>

          {/* Credits */}
          {credits != null && Number(credits) > 0 && (
            <Link
              href="/dashboard/referrals"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2.5"><span className="w-5 text-center">💎</span> Credits</span>
              <span className="font-mono text-xs text-emerald-400">${Number(credits).toFixed(2)}</span>
            </Link>
          )}

          {/* Menu items */}
          <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors">
            <span className="w-5 text-center">⚙</span> Settings
          </Link>
          <Link href="/dashboard/settings?tab=billing" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors">
            <span className="w-5 text-center">💳</span> Subscription
          </Link>
          <Link href="/dashboard/support" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors">
            <span className="w-5 text-center">💬</span> Help & Support
          </Link>

          {/* Admin */}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.06] hover:text-white transition-colors">
              <span className="w-5 text-center">🛡</span> Admin Panel
              {adminNotifCount > 0 && (
                <span className="ml-auto rounded-full bg-red-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white">{adminNotifCount}</span>
              )}
            </Link>
          )}

          {/* Sign out */}
          <div className="border-t border-white/[0.06] mt-1 pt-1">
            <form action="/auth/signout" method="POST">
              <button type="submit" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400/70 hover:bg-red-400/[0.06] hover:text-red-400 transition-colors">
                <span className="w-5 text-center">↪</span> Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
