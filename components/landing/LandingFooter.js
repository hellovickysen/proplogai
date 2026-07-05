import Link from 'next/link';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Propol AI Coach', href: '/dashboard/coach' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund-policy' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Support Portal', href: '/dashboard/support' },
      { label: 'support@proplogai.com', href: 'mailto:support@proplogai.com' },
    ],
  },
];

/**
 * Shared multi-column footer for all public/landing pages.
 * Inspired by Lyrafin AI — logo + tagline, 3 link columns, copyright + risk disclaimer.
 */
export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#07070b]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-10">
        {/* Top row: branding + link columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Branding */}
          <div>
            <Link href="/" className="inline-block font-display text-lg font-bold" style={gradientText}>
              PropLogAI
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/40">
              AI Trading Performance Coach. Analyze your journal, track your discipline, and build better trading habits — all in one place.
            </p>
            <a href="mailto:support@proplogai.com" className="mt-3 inline-block text-xs text-white/30 hover:text-white/50 transition-colors">
              support@proplogai.com
            </a>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white/35">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => {
                  const isExternal = link.href.startsWith('mailto:');
                  return (
                    <li key={link.href}>
                      {isExternal ? (
                        <a href={link.href} className="text-sm text-white/55 hover:text-white/80 transition-colors">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm text-white/55 hover:text-white/80 transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar: copyright + risk disclaimer */}
        <div className="mt-10 border-t border-white/[0.06] pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} PropLogAI. All rights reserved.
            </p>
            <p className="max-w-md text-[10px] leading-relaxed text-white/20">
              PropLogAI is an educational tool for trading journal analysis. It does not provide financial, investment, or trading advice. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
