import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAIL } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const NAV = [
  { label: 'Overview', href: '/admin', icon: '▦' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'AI Usage', href: '/admin/ai-usage', icon: '✦' },
  { label: 'Revenue', href: '/admin/revenue', icon: '💰' },
];

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Security: redirect non-admin users
  if (!user) redirect('/login');
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard');

  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-white/10 bg-[#0a0a12] sm:flex">
        <div className="px-4 pb-4 pt-5">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ background: 'linear-gradient(135deg,#f87171,#fbbf24)' }}>⚙</span>
            <div>
              <span className="font-display text-sm font-bold">Admin Panel</span>
              <p className="font-mono text-[9px] text-white/40">PropJournal</p>
            </div>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/[0.04] hover:text-white/80"
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] px-4 py-3">
          <Link href="/dashboard" className="text-xs text-cyan-400 hover:underline">← Back to app</Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">Admin</span>
          <span className="font-mono text-xs text-white/40">{user.email}</span>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
