export default function CalendarLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-xl bg-white/[0.06]" />
          <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
          <div className="h-9 w-9 rounded-xl bg-white/[0.06]" />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-4 rounded bg-white/[0.06]" />
          ))}
        </div>
        {[...Array(5)].map((_, row) => (
          <div key={row} className="mb-1 grid grid-cols-7 gap-1">
            {[...Array(7)].map((_, col) => (
              <div key={col} className="h-14 rounded-lg bg-white/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
