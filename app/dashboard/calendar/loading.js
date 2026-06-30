const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-lg bg-white/[0.06]" />
          <div className="h-3 w-40 rounded bg-white/[0.06]" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {/* Calendar nav bar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 rounded bg-white/[0.06]" />
          </div>
          <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
        </div>

        {/* Day-of-week header */}
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {DAY_LABELS.map((d) => (
            <div key={d} className="flex justify-center">
              <div className="h-3 w-7 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>

        {/* 7 × 5 day cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-white/[0.06] flex flex-col items-end justify-start p-1.5"
            >
              {/* Date number */}
              <div className="h-3.5 w-5 rounded bg-white/[0.04]" />
              {/* P&L bar hint */}
              {i % 3 !== 0 && (
                <div className="mt-auto h-1.5 w-full rounded-sm bg-white/[0.04]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary row below calendar */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="mt-3 h-6 w-20 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
