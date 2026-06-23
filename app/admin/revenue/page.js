import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminRevenuePage() {
  const sb = createAdminClient();

  // Get all subscriptions
  const { data: subs } = await sb.from('subscriptions').select('plan, status, created_at');
  const list = subs || [];

  // Plan breakdown
  const plans = { free: 0, pro: 0, elite: 0 };
  const active = { free: 0, pro: 0, elite: 0 };
  list.forEach((s) => {
    const p = s.plan || 'free';
    plans[p] = (plans[p] || 0) + 1;
    if (s.status === 'active') active[p] = (active[p] || 0) + 1;
  });

  const totalUsers = list.length;
  const proRevenue = active.pro * 14.99;
  const eliteRevenue = active.elite * 29.99;
  const mrr = proRevenue + eliteRevenue;

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Revenue</h1>
      <p className="mb-6 text-sm text-white/50">Subscription metrics and revenue tracking.</p>

      {/* MRR */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-400/20 p-5" style={{ background: 'rgba(52,211,153,0.06)' }}>
          <div className="font-mono text-xs text-white/55">Monthly Recurring Revenue</div>
          <div className="mt-2 font-display text-3xl font-bold text-emerald-400">${mrr.toFixed(2)}</div>
          <div className="mt-1 text-xs text-white/40">MRR</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="font-mono text-xs text-white/55">Total subscribers</div>
          <div className="mt-2 font-display text-3xl font-bold">{totalUsers}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="font-mono text-xs text-white/55">Paid users</div>
          <div className="mt-2 font-display text-3xl font-bold">{active.pro + active.elite}</div>
          <div className="mt-1 text-xs text-white/40">{totalUsers ? Math.round(((active.pro + active.elite) / totalUsers) * 100) : 0}% conversion</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="font-mono text-xs text-white/55">Annual run rate</div>
          <div className="mt-2 font-display text-3xl font-bold">${(mrr * 12).toFixed(0)}</div>
          <div className="mt-1 text-xs text-white/40">ARR</div>
        </div>
      </div>

      {/* Plan breakdown */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 font-display text-base font-semibold">Plan breakdown</h2>
        <div className="space-y-4">
          {[
            { name: 'Free', price: '$0', count: active.free, total: plans.free, color: 'bg-white/20' },
            { name: 'Pro', price: '$14.99/mo', count: active.pro, total: plans.pro, color: 'bg-violet-500/40' },
            { name: 'Elite', price: '$29.99/mo', count: active.elite, total: plans.elite, color: 'bg-cyan-500/40' },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-4">
              <div className="w-20 text-sm font-semibold">{p.name}</div>
              <div className="w-24 font-mono text-xs text-white/45">{p.price}</div>
              <div className="flex-1">
                <div className="h-6 rounded-lg bg-white/[0.06]">
                  <div
                    className={'flex h-full items-center rounded-lg px-2 text-xs font-semibold ' + p.color}
                    style={{ width: Math.max(totalUsers ? (p.count / totalUsers) * 100 : 0, p.count > 0 ? 10 : 0) + '%', minWidth: p.count > 0 ? 40 : 0 }}
                  >
                    {p.count}
                  </div>
                </div>
              </div>
              <div className="w-20 text-right font-mono text-xs text-white/45">
                {p.name !== 'Free' ? '$' + (p.count * parseFloat(p.price.replace('$', '').replace('/mo', ''))).toFixed(2) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe integration notice */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
        <h2 className="font-display text-base font-semibold text-amber-300">Stripe not yet connected</h2>
        <p className="mt-2 text-sm text-white/50">
          Revenue numbers are based on subscription counts in the database. Once Stripe/Lemon Squeezy is integrated, this page will show real payment data, churn rates, and transaction history.
        </p>
      </div>
    </div>
  );
}
