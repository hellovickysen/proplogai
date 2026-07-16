export default function NotificationsLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-36 rounded-lg bg-white/[0.06]" />
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="h-8 w-8 rounded-full bg-white/[0.06] flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-white/[0.06] mb-2" />
              <div className="h-3 w-32 rounded bg-white/[0.06]" />
            </div>
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
