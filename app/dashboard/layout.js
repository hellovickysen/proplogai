import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import QuickLog from '@/components/QuickLog';
import RiskFooter from '@/components/RiskFooter';
import { num, fmtMoney } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_complete, referred_by, referral_balance, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prefs || !prefs.onboarding_complete) {
    redirect('/onboarding');
  }

  // ─── Server-side referral capture ────────────────────────────
  // Reads ref_code cookie set by /r/[code] page. Processes once,
  // then skips on subsequent loads (referred_by already set).
  try {
    const cookieStore = cookies();
    const refCookie = cookieStore.get('ref_code');
    if (refCookie && refCookie.value && !prefs.referred_by) {
      const refCode = refCookie.value;

      // Look up the referral code
      const { data: refRow } = await supabase
        .from('referral_codes')
        .select('user_id, code')
        .eq('code', refCode)
        .maybeSingle();

      if (refRow && refRow.user_id !== user.id) {
        // Check if referral already exists (prevent duplicates)
        const { data: existingRef } = await supabase
          .from('referrals')
          .select('id')
          .eq('referred_user_id', user.id)
          .maybeSingle();

        if (!existingRef) {
          // Mark this user as referred
          await supabase
            .from('user_preferences')
            .update({ referred_by: refCode })
            .eq('user_id', user.id);

          // Create the referral record
          await supabase.from('referrals').insert({
            referrer_id: refRow.user_id,
            referred_user_id: user.id,
            referred_email: user.email || null,
            status: 'pending',
            reward_given: false,
          });
        }
      }
    }
  } catch (e) {
    // Never let referral processing break the dashboard
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: trades } = await supabase.from('trades').select('pnl, trade_date, closed_at, created_at').eq('user_id', user.id);
  let todayPnl = 0;
  (trades || []).forEach((t) => {
    const raw = String(t.trade_date || t.closed_at || t.created_at || '');
    if (raw.slice(0, 10) === today) todayPnl += num(t.pnl);
  });
  const tone = todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} credits={prefs.referral_balance} avatarUrl={prefs.avatar_url} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="font-display text-base font-bold sm:hidden">PropJournal</span>
            <span className="hidden font-mono text-xs uppercase tracking-wider text-white/55 sm:block">PropJournal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5">
              <span className="hidden font-mono text-xs uppercase tracking-wider text-white/55 sm:inline">Today</span>
              <span className={'font-mono text-xs font-semibold sm:text-sm ' + tone}>{fmtMoney(todayPnl)}</span>
            </div>
            <span className="hidden font-mono text-xs text-white/55 sm:block">{user.email}</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <RiskFooter />
      </div>
      <QuickLog />
    </div>
  );
}
