export default function RulebookLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
            <div className="h-6 w-6 rounded bg-white/[0.06] flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-48 rounded bg-white/[0.06] mb-2" />
              <div className="h-3 w-32 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
