"use client";

import { useState } from 'react';
import Link from 'next/link';

const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };

const NAV_LINKS = [
  { label: 'Tools', href: '/tools' },
  { label: 'Blog', href: '/blogs', external: true },
  { label: 'Pricing', href: '#pricing', scroll: true },
  { label: 'About', href: '/about' },
];

function DefaultLogo() {
  return (
    <a href="/" className="flex items-center gap-2.5">
      <span className="grid flex-shrink-0 place-items-center rounded-lg" style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}>
        <svg width="32" height="32" viewBox="0 0 100 100" aria-hidden="true">
          <polygon points="22,42 50,49 50,75 22,69" fill="#08080f" />
          <polygon points="78,42 50,49 50,75 78,69" fill="#08080f" />
          <polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="74" cy="27" r="4.5" fill="#08080f" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">PropLog<span style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>AI</span></span>
    </a>
  );
}

export default function LandingNav({ logo }) {
  const navLogo = logo || <DefaultLogo />;
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-20 px-4 py-4 sm:px-10 sm:py-5">
      {/* ─── Desktop Nav ─── */}
      <div className="hidden sm:flex justify-center">
        <div className="flex items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-[#0a0a14]/90 backdrop-blur-md px-5 py-2 shadow-[0_2px_24px_rgba(0,0,0,0.3)]">
        {navLogo}
        <div className="flex items-center gap-1.5">
          {NAV_LINKS.map((link) => {
            if (link.external) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              );
            }
            if (link.scroll) {
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              );
            }
            return (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            );
          })}

          {/* 14-Day Trial static badge */}
          <span className="flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3.5 py-1.5 text-xs font-medium text-violet-300/80">
            <span>✦</span>
            14-Day Trial
          </span>

          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In
          </Link>
          <Link
            href="/login?mode=signup"
            className="cta-glow rounded-full px-5 py-2 text-sm font-semibold text-[#08080f]"
            style={gradientBtn}
          >
            Start Free Trial
          </Link>
        </div>
        </div>
      </div>

      {/* ─── Mobile Nav Bar ─── */}
      <div className="flex items-center justify-between sm:hidden">
        {navLogo}
        <div className="flex items-center gap-1">
          <Link
            href="/login"
            className="grid h-10 w-10 place-items-center rounded-lg text-white/60 transition-colors hover:text-white"
            aria-label="Sign in"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-lg text-white/60 transition-colors hover:text-white"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ─── Mobile Dropdown ─── */}
      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="absolute left-4 right-4 top-full z-40 mt-2 rounded-2xl border border-white/10 bg-[#0b0b14] p-5 shadow-2xl sm:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="space-y-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:border-white/20"
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label}
                </a>
              ))}

              {/* 14-Day Trial badge in mobile */}
              <div className="flex items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-3 text-sm font-medium text-violet-300/80">
                ✦ 14-Day Free Trial
              </div>

              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:border-white/20"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-[#08080f]"
                style={gradientBtn}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
