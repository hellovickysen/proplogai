import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function PartnerSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: aff } = admin
    ? await admin
        .from('affiliates')
        .select('name, email, social_links, audience_size, payout_method, referral_username, status')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  if (!aff) redirect('/apply');

  return (
    <div className="mx-auto max-w-lg px-5 py-10 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-white">Partner settings</h1>
      <p className="mt-1 text-sm text-white/50">Update your profile and default payout method.</p>
      <SettingsClient
        initial={{
          name: aff.name || '',
          email: user.email || aff.email || '',
          social_links: aff.social_links || '',
          audience_size: aff.audience_size || '',
          payout_method: aff.payout_method || '',
          referral_username: aff.referral_username || '',
          status: aff.status || 'pending',
        }}
      />
    </div>
  );
}
