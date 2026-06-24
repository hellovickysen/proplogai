"use client";

import { useEffect } from 'react';

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
      document.cookie = 'ref_code=' + code + '; path=/; max-age=604800';
    }
    window.location.href = '/login';
  }, [params.code]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#07070b' }}>
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl text-xl" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}>
          &#9670;
        </div>
        <p className="text-sm text-white/60">Redirecting to PropLogAI...</p>
      </div>
    </div>
  );
}
