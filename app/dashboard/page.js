import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const NAV = [
  { label: 'Dashboard', icon: '▦', active: true },
  { label: 'Trades', icon: '▤' },
  { label: 'Journal', icon: '✎' },
  { label: 'Analytics', icon: '📈' },
  { label: 'AI Coach', icon: '✦' },
  { label: 'Settings', icon: '⚙' },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = user.email ? user.email.split('@')[0] : 'trader';

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-white/10 bg-white/[0.02] p-4 sm:flex">
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-sm" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 0 18px rgba(139,92,246,0.5)' }}>&#9670;</span>
          <span className="font-display text-lg font-bold tracking-tight">PipMind</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <span
              key={item.label}
              className={
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm ' +
                (item.active ? 'bg-white/10 text-white' : 'text-white/50')
              }
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h1 className="font-display text-lg font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-white/50">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="px-6 py-10">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div
              className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
              style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              &#10022;
            </div>
            <h2 className="font-display text-2xl font-bold">You&apos;re in, {name}!</h2>
            <p className="mx-auto mt-3 max-w-md text-white/60">
              Your PipMind workspace is live. Next up: logging trades and your daily journal &mdash; then the AI coach
              starts finding your patterns.
            </p>
            <p className="mt-6 font-mono text-xs text-white/40">Sprint 1 complete &middot; auth + database connected</p>
          </div>
        </div>
      </main>
    </div>
  );
}
