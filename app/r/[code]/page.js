"use client";

import { useEffect } from 'react';
import { LogoMark } from '@/components/Logo';

/**
 * Referral redirect page.
 * Stores the ref code in BOTH localStorage and cookie (belt + suspenders),
 * then redirects to login. localStorage survives OAuth redirect flows
 * where cookies can get cleared.
 */
export default function ReferralRedirect({ params }) {
  useEffect(() => {
    const code = params.code;
    if (code) {
      localStorage.setItem('ref_code', code);
      document.cookie = 'ref_code=' + encodeURIComponent(code) + '; path=/; max-age=604800; SameSite=Lax';
    }
    window.location.href = '/login';
  }, [params.code]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070b' }}>
      <div className="text-center">
        <LogoMark size={48} rounded="rounded-2xl" className="mx-auto mb-4" />
        <p className="text-sm text-white/60">Redirecting to PropLogAI...</p>
      </div>
    </div>
  );
}
