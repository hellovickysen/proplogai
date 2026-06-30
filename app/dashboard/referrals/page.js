import { createClient } from '@/lib/supabase/server';
import ReferralDashboard from '@/components/referrals/ReferralDashboard';

export const dynamic = 'force-dynamic';

export default async function ReferralsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: refCode, error: refCodeError } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (refCodeError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Referrals</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: referrals, error: referralsError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  if (referralsError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Referrals</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('referral_balance')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <ReferralDashboard
      code={refCode?.code || null}
      referrals={referrals || []}
      balance={prefs?.referral_balance || 0}
    />
  );
}
