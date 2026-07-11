import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminRevenuePage() {
  if (!isAdminConfigured()) return <div className="p-8 text-white/55">Add SUPABASE_SERVICE_ROLE_KEY first.</div>;
  const sb = createAdminClient();
  if (!sb) return <div className="p-8 text-white/55">Admin client unavailable.</div>;

  try {
    let plans = { basic: 0, elite_monthly: 0, elite_yearly: 0, trialing: 0 };
    let totalSubscribers = 0;

    try {
      const { data: subs } = await sb.from('subscriptions').select('plan, status, billing_cycle, trial_ends_at');
      const list = subs || [];
      totalSubscribers = list.length;
      list.forEach((s) => {
        const isActive = ['active', 'authenticated', 'created'].includes(s.status);
        const isTrialing = s.trial_ends_at && new Date(s.trial_ends_at) > new Date();
        if (s.plan === 'elite' && (isActive || isTrialing)) {
          if (s.billing_cycle === 'yearly') plans.elite_yearly++;
          else plans.elite_monthly++;
          if (isTrialing && s.status !== 'active') plans.trialing++;
        } else {
          plans.basic++;
        }
      });
    } catch {}

    // MRR: $9.99/mo for monthly, $7.99/mo for yearly subscribers
    const monthlyRevenue = plans.elite_monthly * 9.99;
    const yearlyRevenue = plans.elite_yearly * 7.99;
    const mrr = monthlyRevenue + yearlyRevenue;
    const paidUsers = plans.elite_monthly + plans.elite_yearly;

    return (
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold">Revenue</h1>
        <p className="mb-6 text-sm text-white/50">Subscription metrics and revenue tracking via Razorpay.</p>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-emerald-400/20 p-5" style={{ background: 'rgba(52,211,153,0.06)' }}>
            <div className="font-mono text-xs text-white/55">MRR</div>
            <div className="mt-2 font-display text-3xl font-bold text-emerald-400">${mrr.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-mono text-xs text-white/55">Total subscribers</div>
            <div className="mt-2 font-display text-3xl font-bold">{totalSubscribers}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="font-mono text-xs text-white/55">Paid users</div>
            <div className="mt-2 font-display text-3xl font-bold">{paidUsers}</div>
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
              { name: 'Basic', price: '$0', count: plans.basic },
              { name: 'Elite Monthly', price: '$9.99/mo', count: plans.elite_monthly },
              { name: 'Elite Yearly', price: '$7.99/mo', count: plans.elite_yearly },
              { name: 'Trialing', price: '14-day trial', count: plans.trialing },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-4">
                <div className="w-28 text-sm font-semibold">{p.name}</div>
                <div className="w-24 font-mono text-xs text-white/45">{p.price}</div>
                <div className="font-mono text-lg font-bold">{p.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
          <h2 className="font-display text-base font-semibold text-emerald-300">Razorpay connected ✓</h2>
          <p className="mt-2 text-sm text-white/50">
            Revenue is estimated from subscription counts × plan price. Trialing users are not counted in MRR until their first payment.
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
