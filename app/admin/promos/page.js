import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { getDiscountSettings } from '@/lib/affiliate';
import PromoCodesClient from './PromoCodesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPromosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard');

  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-sm text-white/60">Admin client not configured.</p>;
  }

  const [{ data: promos }, discount] = await Promise.all([
    admin
      .from('promo_codes')
      .select('id, code, label, discount_pct, razorpay_offer_id, razorpay_offer_id_upi, razorpay_offer_id_upi_trial, active, starts_at, expires_at, max_redemptions, redeemed_count, created_at')
      .order('created_at', { ascending: false }),
    getDiscountSettings(admin),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Promo Codes</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Store-wide discount codes for occasions (e.g. DIWALI50). Each code maps to a Razorpay
          subscription offer you create in the Razorpay Dashboard — paste its Offer Id below. During a
          free trial the {discount.trialAutoPct}% trial bonus stacks on top, so also create an in-trial
          offer at (code % + {discount.trialAutoPct}%). These carry no partner commission.
        </p>
      </div>

      <PromoCodesClient promos={promos || []} trialAutoPct={discount.trialAutoPct} />
    </div>
  );
}
