import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Fab from '@/components/Fab';
import RiskFooter from '@/components/RiskFooter';
import { num, fmtMoney } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check onboarding — redirect new users to /onboarding (outside dashboard layout)
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prefs || !prefs.onboarding_complete) {
    redirect('/onboarding');
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: trades } = await supabase.from('trades').select('pnl, trade_date, closed_at, created_at');
  let todayPnl = 0;
  (trades || []).forEach((t) => {
    const raw = String(t.trade_date || t.closed_at || t.created_at || '');
    if (raw.slice(0, 10) === today) todayPnl += num(t.pnl);
  });
  const tone = todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
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
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70 transition-colors hover:text-white sm:px-3 sm:py-1.5 sm:text-sm">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <RiskFooter />
      </div>
      <Fab />
    </div>
  );
}
