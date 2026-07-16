export default function AccountsLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-36 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white/[0.06]" />
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-white/[0.06] mb-2" />
                <div className="h-3 w-20 rounded bg-white/[0.06]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 rounded-lg bg-white/[0.06]" />
              <div className="h-12 rounded-lg bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
