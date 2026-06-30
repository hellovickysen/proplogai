"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('pl_cookie_accepted')) {
        setVisible(true);
      }
    } catch (e) {
      // localStorage unavailable
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem('pl_cookie_accepted', '1');
    } catch (e) {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0b0b14]/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-white/55">
          We use cookies to improve PropLogAI and measure site performance.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-4 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/25"
          >
            Accept
          </button>
          <Link href="/privacy" className="text-xs text-white/40 underline hover:text-white/60">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
