import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserAccess, PLANS } from '@/lib/plans';
import { PARTNER_DISCOUNT_PCT } from '@/lib/affiliate';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function UpgradePage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const access = await getUserAccess(supabase, user);
  // Already on Elite (active/trialing/beta/admin) — nothing to buy.
  if (access.effectivePlan === 'elite') {
    redirect('/dashboard/settings?tab=billing');
  }

  const initialCoupon = typeof searchParams?.code === 'string'
    ? searchParams.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
    : '';

  return (
    <CheckoutClient
      priceMonthly={PLANS.elite.priceMonthly}
      priceYearly={PLANS.elite.priceYearly}
      yearlyTotal={Math.round(PLANS.elite.priceYearly * 12 * 100) / 100}
      discountPct={Math.round(PARTNER_DISCOUNT_PCT * 100)}
      initialCoupon={initialCoupon}
    />
  );
}
