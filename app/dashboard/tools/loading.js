export default function ToolsLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-24 rounded-lg bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="h-10 w-10 rounded-xl bg-white/[0.06] mb-3" />
            <div className="h-5 w-28 rounded bg-white/[0.06] mb-2" />
            <div className="h-3 w-full rounded bg-white/[0.06]" />
            <div className="h-3 w-3/4 rounded bg-white/[0.06] mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
