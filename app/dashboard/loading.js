export default function DashboardLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="mt-3 h-8 w-24 rounded bg-white/[0.06]" />
            <div className="mt-2 h-3 w-12 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Equity chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-white/[0.06]" />
              <div className="h-7 w-20 rounded-lg bg-white/[0.06]" />
            </div>
            <div className="h-[140px] sm:h-[200px] rounded-lg bg-white/[0.06]" />
          </div>

          {/* Recent trades */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-white/[0.06]" />
              <div className="h-6 w-16 rounded bg-white/[0.06]" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-2 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/[0.06] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-white/[0.06]" />
                  <div className="h-2.5 w-14 rounded bg-white/[0.06]" />
                </div>
                <div className="h-4 w-16 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Calendar widget */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-white/[0.06]" />
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
                <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
              </div>
            </div>
            {/* Day labels */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-3 rounded bg-white/[0.06]" />
              ))}
            </div>
            {/* Day cells */}
            {[...Array(5)].map((_, row) => (
              <div key={row} className="mb-1 grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, col) => (
                  <div key={col} className="h-8 rounded-lg bg-white/[0.06]" />
                ))}
              </div>
            ))}
          </div>

          {/* Extra card placeholder */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 h-5 w-24 rounded bg-white/[0.06]" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.06]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
