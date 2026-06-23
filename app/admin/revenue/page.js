import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminRevenuePage() {
  if (!isAdminConfigured()) return <div className="p-8 text-white/55">Add SUPABASE_SERVICE_ROLE_KEY first.</div>;
  const sb = createAdminClient();
  if (!sb) return <div className="p-8 text-white/55">Admin client unavailable.</div>;

  try {
    let plans = { free: 0, pro: 0, elite: 0 };
    let totalUsers = 0;

    try {
      const { data: subs } = await sb.from('subscriptions').select('plan, status');
      const list = subs || [];
      totalUsers = list.length;
      list.forEach((s) => {
        const p = s.plan || 'free';
        if (s.status === 'active') plans[p] = (plans[p] || 0) + 1;
      });
    } catch {
      // subscriptions table might be empty or not exist — that's fine
    }

    const proRevenue = (plans.pro || 0) * 14.99;
    const eliteRevenue = (plans.elite || 0) * 29.99;
    const mrr = proRevenue + eliteRevenue;

    return (
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold">Revenue</h1>
        <p className="mb-6 text-sm text-white/50">Subscription metrics and revenue tracking.</p>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-400/20 p-5" style={{ background: 'rgba(52,211,153,0.06)' }}>
            <div className="font-mono text-xs text-white/55">MRR</div>
            <div className="mt-2 font-display text-3xl font-bold text-emerald-400">${mrr.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-mono text-xs text-white/55">Total subscribers</div>
            <div className="mt-2 font-display text-3xl font-bold">{totalUsers}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-mono text-xs text-white/55">Paid users</div>
            <div className="mt-2 font-display text-3xl font-bold">{(plans.pro || 0) + (plans.elite || 0)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-mono text-xs text-white/55">ARR</div>
            <div className="mt-2 font-display text-3xl font-bold">${(mrr * 12).toFixed(0)}</div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-4 font-display text-base font-semibold">Plan breakdown</h2>
          <div className="space-y-3">
            {[
              { name: 'Free', price: '$0', count: plans.free || 0 },
              { name: 'Pro', price: '$14.99/mo', count: plans.pro || 0 },
              { name: 'Elite', price: '$29.99/mo', count: plans.elite || 0 },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-4">
                <div className="w-16 text-sm font-semibold">{p.name}</div>
                <div className="w-24 font-mono text-xs text-white/45">{p.price}</div>
                <div className="font-mono text-lg font-bold">{p.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
          <h2 className="font-display text-base font-semibold text-amber-300">Stripe not yet connected</h2>
          <p className="mt-2 text-sm text-white/50">
            Revenue numbers are based on subscription counts in the database. Real payment data will show once Stripe is integrated.
          </p>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-8">
        <h2 className="font-display text-lg font-bold text-red-300">Error loading revenue data</h2>
        <p className="mt-2 text-sm text-white/55">{err?.message || 'Check Vercel logs.'}</p>
      </div>
    );
  }
}
