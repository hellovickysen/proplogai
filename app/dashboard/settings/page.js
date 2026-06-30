import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/settings/SettingsTabs';
import PublicProfileSettings from '@/components/profile/PublicProfileSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-white/55">Profile, security, and journal preferences.</p>
      <div className="mt-6">
        <SettingsTabs user={user} prefs={prefs} />
      </div>
      <div className="mt-8">
        <PublicProfileSettings prefs={prefs} />
      </div>
    </div>
  );
}
