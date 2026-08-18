import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/settings/SettingsTabs';
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

  // Backup status is optional until the staging migration has been applied.
  const { data: backupConnection } = await supabase
    .from('backup_drive_connections')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: latestBackup } = await supabase
    .from('backup_runs')
    .select('completed_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const backupStatus = {
    driveConnected: backupConnection?.status === 'connected',
    lastCompletedAt: latestBackup?.completed_at || null,
  };

  // From Razorpay callback redirect
  const paymentStatus = searchParams?.status || null;
  const activeTab = searchParams?.tab || null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-white/40 mb-6">Profile, public sharing, journal preferences, and billing.</p>

      <SettingsTabs
        user={user}
        prefs={prefs}
        planAccess={planAccess}
        subscription={subscription || null}
        backupStatus={backupStatus}
        paymentStatus={paymentStatus}
        initialTab={activeTab}
      />
    </div>
  );
}
