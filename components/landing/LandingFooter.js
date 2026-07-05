import Link from 'next/link';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

/**
 * Shared multi-column footer for all public/landing pages.
 * Lyrafin-inspired: large tagline, spacious link columns, clean bottom bar.
 */
export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#07070b]">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:px-10">

        {/* Top section: branding + tagline */}
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-display text-lg font-bold" style={gradientText}>PropLogAI</span>
            </Link>
            <h2 className="mt-6 max-w-md text-[28px] font-bold leading-[1.25] tracking-tight text-white sm:text-[32px]">
              Your AI-powered trading performance coach.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/40">
              Analyze your journal, track your discipline, and build better trading habits — all in one place.
            </p>
            <a href="mailto:support@proplogai.com" className="mt-4 inline-block text-sm text-white/30 hover:text-white/50 transition-colors">
              support@proplogai.com
            </a>
          </div>

          {/* Right side: CTA card (like Lyrafin's email subscription) */}
          <div className="flex items-start justify-end">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-violet-400/70 mb-2">Get Started</p>
              <p className="text-base font-semibold text-white mb-2">
                Start journaling your trades today.
              </p>
              <p className="text-sm text-white/40 mb-5">
                Free forever on Basic. 14-day Elite trial with full AI coaching.
              </p>
              <Link
                href="/login?mode=signup"
                className="block w-full rounded-xl py-3 text-center text-sm font-bold text-[#08080f]"
                style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
              >
                Start free →
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-white/[0.06]" />

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-3">
          {/* Product */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Product
            </h4>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-sm text-white/55 hover:text-white/80 transition-colors">Dashboard</Link></li>
              <li><Link href="/pricing" className="text-sm text-white/55 hover:text-white/80 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard/coach" className="text-sm text-white/55 hover:text-white/80 transition-colors">Propol AI Coach</Link></li>
              <li><Link href="/login?mode=signup" className="text-sm text-white/55 hover:text-white/80 transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Resources
            </h4>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-sm text-white/55 hover:text-white/80 transition-colors">Contact Us</Link></li>
              <li><Link href="/dashboard/support" className="text-sm text-white/55 hover:text-white/80 transition-colors">Support</Link></li>
              <li><a href="mailto:support@proplogai.com" className="text-sm text-white/55 hover:text-white/80 transition-colors">Email Support</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Company
            </h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-white/55 hover:text-white/80 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/55 hover:text-white/80 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="text-sm text-white/55 hover:text-white/80 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/[0.06] pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} PropLogAI. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-white/25 hover:text-white/50 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-white/25 hover:text-white/50 transition-colors">Terms of Service</Link>
          </div>
        </div>

        {/* Risk disclaimer */}
        <p className="mt-4 text-[10px] leading-relaxed text-white/15 max-w-2xl">
          PropLogAI is an educational tool for trading journal analysis. It does not provide financial, investment, or trading advice. Past performance does not guarantee future results.
        </p>
      </div>
    </footer>
  );
}
