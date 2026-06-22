import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingFlow from '@/components/OnboardingFlow';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Already onboarded? Skip straight to dashboard.
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefs && prefs.onboarding_complete) redirect('/dashboard');

  return <OnboardingFlow userEmail={user.email} />;
}
