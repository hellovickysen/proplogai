import { createClient } from '@/lib/supabase/server';
import SettingsTabs from '@/components/SettingsTabs';
import PublicProfileSettings from '@/components/PublicProfileSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*, custom_setups')
    .eq('user_id', user.id)
    .maybeSingle();

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
