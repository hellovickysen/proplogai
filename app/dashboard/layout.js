import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
            <span className="hidden font-mono text-xs text-white/50 sm:block">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
