import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import Link from 'next/link';
import NotificationBell from '@/components/notifications/NotificationBell';

export const dynamic = 'force-dynamic';

/* Admin notification types — only these show in the admin bell */
const ADMIN_TYPES = ['new_support_ticket', 'new_user_signup'];

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard');

  // Admin-only notification count (filtered to admin types)
  let notifCount = 0;
  try {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .in('type', ADMIN_TYPES);
    notifCount = count || 0;
  } catch (e) {}

  // Open ticket count for sidebar badge
  let ticketCount = 0;
  try {
    const sb = createAdminClient();
    if (sb) {
      const { count } = await sb
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      ticketCount = count || 0;
    }
  } catch (e) {}

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-white/10 bg-[#0a0a12] sm:flex">
        <div className="px-4 pb-4 pt-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ background: 'linear-gradient(135deg,#f87171,#fbbf24)' }}>&#9881;</span>
            <div>
              <span className="font-display text-sm font-bold">Admin Panel</span>
              <p className="font-mono text-[9px] text-white/40">PropLogAI</p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {[
            { label: 'Overview', href: '/admin', icon: '▦' },
            { label: 'Users', href: '/admin/users', icon: '👥' },
            { label: 'Tickets', href: '/admin/tickets', icon: '📩', badge: ticketCount },
            { label: 'AI Usage', href: '/admin/ai-usage', icon: '✦' },
            { label: 'Revenue', href: '/admin/revenue', icon: '💰' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/[0.04] hover:text-white/80"
            >
              <span className="w-4 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-[#08080f]"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/[0.06] px-4 py-3">
          <Link href="/dashboard" className="text-xs text-cyan-400 hover:underline">&larr; Back to app</Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">Admin</span>
          <div className="flex items-center gap-3">
            <NotificationBell initialCount={notifCount} typeFilter={ADMIN_TYPES} />
            <span className="font-mono text-xs text-white/40">{user.email}</span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
