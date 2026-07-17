import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAffiliateStats, PARTNER_DISCOUNT_PCT } from '@/lib/affiliate';
import AffiliateClient from './AffiliateClient';

export const dynamic = 'force-dynamic';

export default async function AffiliateDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  if (!admin) {
    return <Shell><Notice title="Temporarily unavailable" body="The partner dashboard is not configured right now. Please try again later." /></Shell>;
  }

  const { data: aff } = await admin
    .from('affiliates')
    .select('id, status, name, referral_username, commission_rate')
    .eq('user_id', user.id)
    .maybeSingle();

  // Not an affiliate yet
  if (!aff) {
    return (
      <Shell>
        <Notice
          title="You're not a partner yet"
          body="Apply to join the PropLogAI partner program and start earning lifetime recurring commission."
          cta={{ href: '/apply', label: 'Apply now' }}
        />
      </Shell>
    );
  }

  if (aff.status !== 'approved') {
    const map = {
      pending: { title: 'Application under review', body: 'Thanks for applying! Your application is being reviewed. You’ll get access as soon as it’s approved.', tone: 'amber' },
      rejected: { title: 'Application not approved', body: 'Unfortunately your application was not approved at this time.', tone: 'red' },
      suspended: { title: 'Account suspended', body: 'Your partner account is currently suspended. Please contact support if you think this is a mistake.', tone: 'red' },
    };
    const m = map[aff.status] || map.pending;
    return (
      <Shell>
        <Notice title={m.title} body={m.body} tone={m.tone} />
      </Shell>
    );
  }

  // Approved — load stats, coupon, recent commissions, payouts (all scoped to aff.id)
  const [stats, { data: coupon }, { data: commissions }, { data: payouts }] = await Promise.all([
    getAffiliateStats(admin, aff.id),
    admin.from('affiliate_coupons').select('code, last_edited_at').eq('affiliate_id', aff.id).maybeSingle(),
    admin
      .from('affiliate_commissions')
      .select('amount, status, cycle, created_at')
      .eq('affiliate_id', aff.id)
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('affiliate_payout_requests')
      .select('amount, status, method, created_at')
      .eq('affiliate_id', aff.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const hasOpenPayout = (payouts || []).some((p) => p.status === 'requested' || p.status === 'approved');
  const discountPct = Math.round(PARTNER_DISCOUNT_PCT * 100);

  return (
    <Shell>
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
          Welcome back{aff.name ? `, ${aff.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-white/50">
          Your commission rate is{' '}
          <span className="font-semibold text-cyan-300">{Math.round((aff.commission_rate || 0) * 100)}%</span> — lifetime recurring.
        </p>
      </div>

      <AffiliateClient
        coupon={coupon?.code || ''}
        stats={stats}
        hasOpenPayout={hasOpenPayout}
        discountPct={discountPct}
      />

      {/* Recent commissions */}
      <section className="mt-8">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/55">Recent commissions</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {(commissions || []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-white/45">No commissions yet. Share your coupon code to start earning.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-wider text-white/45">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c, i) => (
                  <tr key={i} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-5 py-3 text-white/70">{fmtDate(c.created_at)}</td>
                    <td className="px-5 py-3 capitalize text-white/60">{c.cycle}</td>
                    <td className="px-5 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-5 py-3 text-right font-mono text-emerald-400">${fmtMoney(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Payout history */}
      {(payouts || []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-wider text-white/55">Payout requests</h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[11px] uppercase tracking-wider text-white/45">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr key={i} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-5 py-3 text-white/70">{fmtDate(p.created_at)}</td>
                    <td className="px-5 py-3 text-white/60">{p.method || '—'}</td>
                    <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-5 py-3 text-right font-mono text-white/80">${fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </Shell>
  );
}

/* ─── small server-side UI helpers ─────────────────────────── */
function Shell({ children }) {
  return <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">{children}</div>;
}

function Notice({ title, body, cta, tone }) {
  const toneCls =
    tone === 'red'
      ? 'border-red-400/30 bg-red-500/10'
      : tone === 'amber'
      ? 'border-amber-400/30 bg-amber-500/10'
      : 'border-white/10 bg-white/[0.03]';
  return (
    <div className={`rounded-2xl border ${toneCls} p-8 text-center`}>
      <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f]"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    approved: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
    paid: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
    reversed: 'text-red-300 border-red-400/30 bg-red-500/10',
    rejected: 'text-red-300 border-red-400/30 bg-red-500/10',
    requested: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${map[status] || 'text-white/60 border-white/15 bg-white/5'}`}>
      {status}
    </span>
  );
}

function fmtMoney(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}
