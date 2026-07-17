import Link from 'next/link';
import Logo from '@/components/Logo';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'PropLogAI Partners — Affiliate Program',
  description: 'Earn lifetime recurring commission for every trader you refer to PropLogAI.',
};

export default function PartnerLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#07070b' }}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07070b]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 sm:inline">
              Partners
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
            >
              Dashboard
            </Link>
            <Link
              href="/apply"
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#08080f]"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              Become an affiliate
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="font-mono text-[11px] text-white/35">
            PropLogAI Partners &middot; Lifetime recurring commission
          </p>
          <a
            href="https://proplogai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-cyan-400/80 hover:text-cyan-300"
          >
            proplogai.com &rarr;
          </a>
        </div>
      </footer>
    </div>
  );
}
