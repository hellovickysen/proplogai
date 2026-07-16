export default function TrophiesLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-36 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="h-40 bg-white/[0.06]" />
            <div className="p-4">
              <div className="h-4 w-28 rounded bg-white/[0.06] mb-2" />
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
