import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';

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
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="font-mono text-xs uppercase tracking-wider text-white/40">PipMind</div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/50">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
