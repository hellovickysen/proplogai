"use client";

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/** Show first 3 chars of the local part, then ***, then the domain. */
function trimEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const shown = local.length > 3 ? local.slice(0, 3) + '***' : local + '***';
  return shown + '@' + domain;
}

function money(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}

/**
 * Partner portal header controls (shown when signed in): pending commission
 * chip (approved partners), Dashboard + Settings links, trimmed email, Logout.
 */
export default function PartnerHeaderMenu({ email, approved = false, pending = 0 }) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    window.location.href = '/login';
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {approved && (
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 sm:inline-flex">
          Pending ${money(pending)}
        </span>
      )}

      <Link
        href="/dashboard"
        className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
      >
        Dashboard
      </Link>

      {approved && (
        <Link
          href="/settings"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
        >
          Settings
        </Link>
      )}

      {email && (
        <span className="hidden font-mono text-[11px] text-white/45 md:inline" title={email}>
          {trimEmail(email)}
        </span>
      )}

      <button
        onClick={logout}
        disabled={busy}
        className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.08] disabled:opacity-60"
      >
        {busy ? '…' : 'Log out'}
      </button>
    </div>
  );
}
