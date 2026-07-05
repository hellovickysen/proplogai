import Link from 'next/link';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

/**
 * Shared footer for all public pages — Lyrafin-inspired layout.
 *
 * Structure:
 * 1. Logo + big heading + description (left) | Subscribe card (right)
 * 2. Divider
 * 3. Three link columns: PRODUCT, SUPPORT, LEGAL
 * 4. Divider
 * 5. Copyright (left) | Privacy + Terms (right)
 */
export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#05050a]">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:px-10">

        {/* ── Row 1: Branding + Subscribe ── */}
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] items-start">
          {/* Left: Logo + big heading */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span
                className="grid flex-shrink-0 place-items-center rounded-lg"
                style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
              >
                <svg width="32" height="32" viewBox="0 0 100 100" aria-hidden="true">
                  <polygon points="22,42 50,49 50,75 22,69" fill="#08080f" />
                  <polygon points="78,42 50,49 50,75 78,69" fill="#08080f" />
                  <polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="74" cy="27" r="4.5" fill="#08080f" />
                </svg>
              </span>
              <span className="font-display text-base font-semibold">
                PropLog<span style={gradientText}>AI</span>
              </span>
            </Link>

            <h2 className="mt-8 max-w-md text-[26px] font-bold leading-[1.3] tracking-tight text-white/90 sm:text-[30px]">
              Your AI-powered trading performance coach.
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/35">
              Analyze your journal, track your discipline, and build better trading habits with AI coaching that finds the patterns you can&apos;t see.
            </p>
          </div>

          {/* Right: Subscribe card */}
          <div className="flex items-start lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-violet-400/70 mb-2">
                Weekly Trading Insights
              </p>
              <p className="text-[15px] font-semibold text-white leading-snug mb-1.5">
                One useful read for the week ahead.
              </p>
              <p className="text-xs text-white/35 mb-5">
                Trading psychology tips, discipline strategies, and platform updates.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@domain.com"
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/40"
                />
              </div>
              <button
                className="mt-3 w-full rounded-lg py-2.5 text-sm font-bold text-[#08080f]"
                style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="my-10 border-t border-white/[0.06]" />

        {/* ── Row 2: Link columns ── */}
        <div className="grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-3">
          {/* Product */}
          <div>
            <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              Product
            </h4>
            <ul className="space-y-3.5">
              <li><Link href="/dashboard" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Dashboard</Link></li>
              <li><Link href="/pricing" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard/coach" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Propol AI Coach</Link></li>
              <li><Link href="/login?mode=signup" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              Support
            </h4>
            <ul className="space-y-3.5">
              <li><Link href="/contact" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Contact</Link></li>
              <li><Link href="/refund-policy" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Refund Policy</Link></li>
              <li><a href="mailto:support@proplogai.com" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Email Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              Legal
            </h4>
            <ul className="space-y-3.5">
              <li><Link href="/privacy" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-[13px] text-white/50 hover:text-white/80 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 border-t border-white/[0.06] pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} PropLogAI. All rights reserved.
          </p>
          <p className="text-xs text-white/15">
            PropLogAI does not provide financial or investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
