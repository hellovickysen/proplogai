import { createClient } from '@/lib/supabase/server';
import RewardsTabs from '@/components/rewards/RewardsTabs';

export const dynamic = 'force-dynamic';

export default async function RewardsPage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Refer-a-friend data (unchanged from the old Referrals page)
  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('referral_balance')
    .eq('user_id', user.id)
    .maybeSingle();

  // Affiliate row for the Partners tab. Resilient if migration 0039 hasn't run yet.
  let affiliate = null;
  try {
    const { data } = await supabase
      .from('affiliates')
      .select('id, status, referral_username, commission_rate')
      .eq('user_id', user.id)
      .maybeSingle();
    affiliate = data || null;
  } catch (e) {
    affiliate = null;
  }

  const initialTab = searchParams?.tab === 'partners' ? 'partners' : 'refer';

  return (
    <RewardsTabs
      initialTab={initialTab}
      referral={{ code: refCode?.code || null, referrals: referrals || [], balance: prefs?.referral_balance || 0 }}
      affiliate={affiliate}
      userEmail={user.email || ''}
    />
  );
}
