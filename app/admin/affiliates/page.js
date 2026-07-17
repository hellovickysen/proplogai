import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import AdminAffiliatesClient from './AdminAffiliatesClient';

export const dynamic = 'force-dynamic';

export default async function AdminAffiliatesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard');

  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-sm text-white/60">Admin client not configured.</p>;
  }

  const [{ data: affiliates }, { data: commissions }, { data: payouts }] = await Promise.all([
    admin
      .from('affiliates')
      .select('id, user_id, name, email, social_links, audience_size, referral_username, commission_rate, status, created_at')
      .order('created_at', { ascending: false }),
    admin.from('affiliate_commissions').select('affiliate_id, amount, status'),
    admin
      .from('affiliate_payout_requests')
      .select('id, affiliate_id, amount, method, status, created_at')
      .order('created_at', { ascending: false }),
  ]);

  const affList = affiliates || [];
  const comms = commissions || [];
  const payList = payouts || [];

  // Aggregate commission totals per affiliate + program-wide.
  const byAff = {};
  let totalOwed = 0;
  let totalPaid = 0;
  for (const c of comms) {
    const a = (byAff[c.affiliate_id] = byAff[c.affiliate_id] || { pending: 0, paid: 0 });
    const amt = Number(c.amount) || 0;
    if (c.status === 'pending' || c.status === 'approved') {
      a.pending += amt;
      totalOwed += amt;
    } else if (c.status === 'paid') {
      a.paid += amt;
      totalPaid += amt;
    }
  }

  const totals = {
    affiliates: affList.length,
    pendingApps: affList.filter((a) => a.status === 'pending').length,
    approved: affList.filter((a) => a.status === 'approved').length,
    owed: Math.round(totalOwed * 100) / 100,
    paid: Math.round(totalPaid * 100) / 100,
    openPayouts: payList.filter((p) => p.status === 'requested' || p.status === 'approved').length,
  };

  // Attach commission totals + friendly names to payouts
  const nameByAff = Object.fromEntries(affList.map((a) => [a.id, a.referral_username || a.name || a.email]));
  const payoutsView = payList.map((p) => ({ ...p, affiliateName: nameByAff[p.affiliate_id] || '—' }));
  const affView = affList.map((a) => ({
    ...a,
    pending: Math.round((byAff[a.id]?.pending || 0) * 100) / 100,
    paid: Math.round((byAff[a.id]?.paid || 0) * 100) / 100,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Affiliates</h1>
        <p className="mt-1 text-sm text-white/50">Approve partners, set commission rates, and process payouts.</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Affiliates" value={totals.affiliates} />
        <Metric label="Pending apps" value={totals.pendingApps} accent="amber" />
        <Metric label="Approved" value={totals.approved} />
        <Metric label="Owed" value={`$${totals.owed.toFixed(2)}`} accent="cyan" />
        <Metric label="Paid out" value={`$${totals.paid.toFixed(2)}`} accent="emerald" />
        <Metric label="Open payouts" value={totals.openPayouts} accent="amber" />
      </div>

      <AdminAffiliatesClient affiliates={affView} payouts={payoutsView} />
    </div>
  );
}

function Metric({ label, value, accent }) {
  const color = accent === 'cyan' ? 'text-cyan-300' : accent === 'emerald' ? 'text-emerald-400' : accent === 'amber' ? 'text-amber-300' : 'text-white';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
