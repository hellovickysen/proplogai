import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { getDiscountSettings } from '@/lib/affiliate';
import DiscountSettingsClient from './DiscountSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminDiscountsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.email !== ADMIN_EMAIL) redirect('/dashboard');

  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-sm text-white/60">Admin client not configured.</p>;
  }

  const settings = await getDiscountSettings(admin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Discounts</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Partner (influencer) discount and the trial auto-bonus. During a free trial the auto-bonus
          stacks on top of any code (partner or promo); after the trial, codes give their normal rate.
          Everyone is charged on the day they subscribe. Each rate is charged via a Razorpay UPI
          subscription offer you create and paste below — sitewide / occasion codes live under{' '}
          <span className="text-white/70">Promos</span>.
        </p>
      </div>

      <DiscountSettingsClient settings={settings} />
    </div>
  );
}
