export default function CoachLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="h-6 w-40 rounded bg-white/[0.06] mb-4" />
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 rounded bg-white/[0.06]" style={{ width: `${85 - i * 8}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="h-4 w-24 rounded bg-white/[0.06] mb-3" />
              <div className="h-8 w-20 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
