"use client";

import { useState } from 'react';
import Link from 'next/link';

const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };
const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

const NAV_LINKS = [
  { label: 'TOOLS', href: '#tools' },
  { label: 'FEATURES', href: '#features' },
  { label: 'PRICING', href: '/pricing' },
  { label: 'BLOG', href: '/blogs', external: true },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="relative z-20 px-4 py-4 sm:px-6 lg:px-10">

      {/* ═══ Desktop: Lyrafin-style floating pill bar ═══ */}
      <div className="hidden lg:flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-[#0a0a14]/90 backdrop-blur-md px-4 py-2 shadow-[0_2px_24px_rgba(0,0,0,0.4)]">

          {/* Logo + subtitle */}
          <Link href="/" className="flex items-center gap-2.5 pr-3 border-r border-white/[0.06]">
            <span
              className="grid flex-shrink-0 place-items-center rounded-lg"
              style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
            >
              <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true">
                <polygon points="22,42 50,49 50,75 22,69" fill="#08080f" />
                <polygon points="78,42 50,49 50,75 78,69" fill="#08080f" />
                <polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="74" cy="27" r="4.5" fill="#08080f" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="font-display text-sm font-semibold leading-tight">
                PropLog<span style={gradientText}>AI</span>
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30 leading-tight">
                AI Trading Coach
              </span>
            </div>
          </Link>

          {/* Nav pill links */}
          {NAV_LINKS.map((link) => {
            const isExternal = link.external;
            const Tag = link.href.startsWith('#') || isExternal ? 'a' : Link;
            const props = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
            return (
              <Tag
                key={link.label}
                href={link.href}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-all hover:border-white/15 hover:bg-white/[0.05] hover:text-white/80"
                {...props}
              >
                {link.label}
              </Tag>
            );
          })}

          {/* Sparkle trial pill */}
          <Link
            href="/login?mode=signup"
            className="flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-300/80 transition-all hover:border-violet-400/30 hover:bg-violet-500/[0.12] hover:text-violet-200"
          >
            <span className="text-xs">✦</span>
            14-Day Trial
          </Link>

          {/* Sign In */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-all hover:border-white/15 hover:text-white/80"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In
          </Link>

          {/* CTA button */}
          <Link
            href="/login?mode=signup"
            className="flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold text-[#08080f] shadow-lg transition-transform hover:scale-105"
            style={gradientBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v-2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* ═══ Tablet: simplified bar ═══ */}
      <div className="hidden sm:flex lg:hidden items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="grid flex-shrink-0 place-items-center rounded-lg"
            style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
          >
            <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="22,42 50,49 50,75 22,69" fill="#08080f" />
              <polygon points="78,42 50,49 50,75 78,69" fill="#08080f" />
              <polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="74" cy="27" r="4.5" fill="#08080f" />
            </svg>
          </span>
          <span className="font-display text-sm font-semibold">PropLog<span style={gradientText}>AI</span></span>
        </Link>
        <div className="flex items-center gap-2">
          {NAV_LINKS.slice(0, 3).map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full border border-white/[0.06] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45 hover:text-white/70 transition-colors"
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {link.label}
            </a>
          ))}
          <Link href="/login" className="rounded-full border border-white/[0.06] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45 hover:text-white/70">
            Sign In
          </Link>
          <Link href="/login?mode=signup" className="rounded-full px-4 py-1.5 text-xs font-bold text-[#08080f]" style={gradientBtn}>
            Start Free Trial
          </Link>
        </div>
      </div>

      {/* ═══ Mobile: logo + hamburger ═══ */}
      <div className="flex items-center justify-between sm:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="grid flex-shrink-0 place-items-center rounded-lg"
            style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
          >
            <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="22,42 50,49 50,75 22,69" fill="#08080f" />
              <polygon points="78,42 50,49 50,75 78,69" fill="#08080f" />
              <polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="74" cy="27" r="4.5" fill="#08080f" />
            </svg>
          </span>
          <span className="font-display text-sm font-semibold">PropLog<span style={gradientText}>AI</span></span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/login" className="grid h-10 w-10 place-items-center rounded-lg text-white/50" aria-label="Sign in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-lg text-white/50 hover:text-white"
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

      {/* ═══ Mobile dropdown ═══ */}
      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 sm:hidden" onClick={() => setOpen(false)} />
          <div
            className="absolute left-4 right-4 top-full z-40 mt-2 rounded-2xl border border-white/10 bg-[#0b0b14] p-5 shadow-2xl sm:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white/80"
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/[0.05]"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-[#08080f]"
                style={gradientBtn}
              >
                ✦ Start 14-Day Free Trial
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
