import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Fab from '@/components/Fab';
import { num, fmtMoney } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check onboarding status (skip for the onboarding page itself)
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();
  const needsOnboarding = !prefs || !prefs.onboarding_complete;

  const today = new Date().toISOString().slice(0, 10);
  const { data: trades } = await supabase.from('trades').select('pnl, closed_at, created_at');
  let todayPnl = 0;
  (trades || []).forEach((t) => {
    const raw = String(t.closed_at || t.created_at || '');
    if (raw.slice(0, 10) === today) todayPnl += num(t.pnl);
  });
  const tone = todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400';

  // Onboarding gets a clean full-screen layout (no sidebar/header)
  if (needsOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="font-display text-base font-bold sm:hidden">PipMind</span>
            <span className="hidden font-mono text-xs uppercase tracking-wider text-white/40 sm:block">PipMind</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">Today</span>
              <span className={'font-mono text-sm font-semibold ' + tone}>{fmtMoney(todayPnl)}</span>
            </div>
            <span className="hidden font-mono text-xs text-white/50 sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <Fab />
    </div>
  );
}
