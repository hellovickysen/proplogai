import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingFlowFiveStep from '@/components/onboarding/OnboardingFlowFiveStep';

export const dynamic = 'force-dynamic';

export default async function DisciplineOnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: preferences, error } = await supabase
    .from('user_preferences')
    .select('active_account_id, onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw new Error('Unable to load onboarding preferences.');
  if (preferences?.onboarding_complete) redirect('/dashboard/discipline');

  return <OnboardingFlowFiveStep accountLabel={preferences?.active_account_id ? 'your selected account' : 'your account'} />;
}
