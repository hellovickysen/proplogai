export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-white/50">Profile, security, and journal preferences.</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
        Settings (profile, password, avatar, and journal preferences) are coming in the next update.
      </div>
    </div>
  );
}
