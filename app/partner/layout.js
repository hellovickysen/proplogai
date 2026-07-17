import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PartnerHeaderMenu from '@/components/partner/PartnerHeaderMenu';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'PropLogAI Partners — Affiliate Program',
  description: 'Earn lifetime recurring commission for every trader you refer to PropLogAI.',
};

export default async function PartnerLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // For signed-in partners, resolve approval + pending commission for the header.
  let approved = false;
  let pending = 0;
  if (user) {
    try {
      const admin = createAdminClient();
      if (admin) {
        const { data: aff } = await admin
          .from('affiliates')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (aff?.status === 'approved') {
          approved = true;
          const { data: comms } = await admin
            .from('affiliate_commissions')
            .select('amount, status')
            .eq('affiliate_id', aff.id);
          pending = (comms || [])
            .filter((c) => c.status === 'pending' || c.status === 'approved')
            .reduce((s, c) => s + (Number(c.amount) || 0), 0);
          pending = Math.round(pending * 100) / 100;
        }
      }
    } catch (e) {}
  }

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

          {user ? (
            <PartnerHeaderMenu email={user.email} approved={approved} pending={pending} />
          ) : (
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
              >
                Log in
              </Link>
              <Link
                href="/apply"
                className="rounded-xl px-3.5 py-2 text-xs font-semibold text-[#08080f]"
                style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
              >
                Become an affiliate
              </Link>
            </nav>
          )}
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
