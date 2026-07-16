export default function SettingsLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-28 rounded-lg bg-white/[0.06]" />
      </div>
      <div className="mb-6 flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 rounded bg-white/[0.06] mb-2" />
            <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
          </div>
        ))}
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}
