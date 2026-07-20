import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserAccess, PLANS } from '@/lib/plans';
import { getDiscountSettings } from '@/lib/affiliate';
import CheckoutClient from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function UpgradePage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const access = await getUserAccess(supabase, user);

  // Admins and users who already pay for Elite (active, non-trial) have nothing
  // to buy. Trialing users ARE allowed here so they can subscribe early.
  if (access.isAdmin || (access.effectivePlan === 'elite' && !access.isTrialing)) {
    redirect('/dashboard/settings?tab=billing');
  }

  // Trial auto-bonus (applied automatically when subscribing during the trial).
  // site_settings is readable with the user's client (RLS allows select).
  const discount = await getDiscountSettings(supabase);

  const initialCoupon = typeof searchParams?.code === 'string'
    ? searchParams.code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
    : '';

  return (
    <CheckoutClient
      priceMonthly={PLANS.elite.priceMonthly}
      priceYearly={PLANS.elite.priceYearly}
      yearlyTotal={Math.round(PLANS.elite.priceYearly * 12 * 100) / 100}
      initialCoupon={initialCoupon}
      isTrialing={!!access.isTrialing}
      trialEndsAt={access.trialEndsAt || null}
      trialAutoPct={discount.trialAutoPct}
      trialAutoConfigured={!!discount.trialAutoOfferUpi}
      trialAutoCode={discount.trialAutoCode}
    />
  );
}
