export default function TradesLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      {/* Title + action button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 rounded-lg bg-white/[0.06]" />
          <div className="h-3 w-36 rounded bg-white/[0.06]" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Filter / tab bar */}
      <div className="mb-5 flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-white/[0.06]" />
        ))}
      </div>

      {/* Table header */}
      <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-3 w-14 rounded bg-white/[0.06]" />
        ))}
      </div>

      {/* Trade row skeletons */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/[0.05] p-4 last:border-b-0"
          >
            {/* Instrument badge */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-white/[0.06] shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-4 w-20 rounded bg-white/[0.06]" />
                <div className="h-3 w-14 rounded bg-white/[0.06]" />
              </div>
            </div>

            {/* Direction pill */}
            <div className="h-6 w-12 rounded-full bg-white/[0.06] shrink-0" />

            {/* Entry / exit */}
            <div className="hidden sm:block space-y-1.5 shrink-0">
              <div className="h-3 w-16 rounded bg-white/[0.06]" />
              <div className="h-3 w-16 rounded bg-white/[0.06]" />
            </div>

            {/* P&L */}
            <div className="h-5 w-20 rounded bg-white/[0.06] shrink-0" />

            {/* RR */}
            <div className="hidden md:block h-4 w-10 rounded bg-white/[0.06] shrink-0" />

            {/* Options dots */}
            <div className="h-6 w-6 rounded-full bg-white/[0.06] shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-white/[0.06]" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}
