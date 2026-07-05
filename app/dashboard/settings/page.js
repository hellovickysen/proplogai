import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/settings/SettingsTabs';
import PublicProfileSettings from '@/components/profile/PublicProfileSettings';
import BillingTab from '@/components/settings/BillingTab';
import { getUserAccess } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prefs, error: prefsError } = await supabase
    .from('user_preferences')
    .select('*, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

  if (prefsError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-white/50">
          Something went wrong loading your data. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Plan access
  const access = await getUserAccess(supabase, user);
  const planAccess = access.toJSON();

  // Subscription data for billing tab
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, billing_cycle, trial_ends_at, renews_at, cancelled_at, razorpay_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle();

  // Payment status from Razorpay callback redirect
  const paymentStatus = searchParams?.status || null;
  const activeTab = searchParams?.tab || null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-white/40 mb-6">Profile, security, billing, and journal preferences.</p>

      <div className="space-y-8">
        <SettingsTabs user={user} prefs={prefs} initialTab={activeTab} />

        {/* Billing section */}
        <div id="billing">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Billing
          </h2>
          <BillingTab
            planAccess={planAccess}
            subscription={subscription || null}
            paymentStatus={paymentStatus}
          />
        </div>

        {/* Public Profile section */}
        <div>
          <PublicProfileSettings user={user} prefs={prefs} />
        </div>
      </div>
    </div>
  );
}
