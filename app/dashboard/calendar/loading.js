export default function CalendarLoading() {
  return (
    <div className="p-6 mx-auto animate-pulse">
      {/* Title */}
      <div className="h-8 w-32 rounded-lg bg-white/[0.06] mb-6" />

      {/* Calendar card skeleton */}
      <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="h-4 w-10 rounded bg-white/[0.06]" />
          <div className="h-5 w-24 rounded bg-white/[0.06]" />
          <div className="h-4 w-10 rounded bg-white/[0.06]" />
        </div>

        {/* Monthly P&L */}
        <div className="py-4 flex justify-center">
          <div className="h-7 w-40 rounded-lg bg-white/[0.06]" />
        </div>

        {/* Calendar grid skeleton */}
        <div className="px-2 pb-4">
          {/* DOW header */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-white/[0.03]" />
            ))}
          </div>
          {/* Week rows */}
          {Array.from({ length: 5 }).map((_, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-px mb-px">
              {Array.from({ length: 7 }).map((_, di) => (
                <div key={di} className="h-28 rounded bg-white/[0.02] border border-white/[0.05]" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Performance skeleton */}
      <div className="hidden sm:block mt-8">
        <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
          <div className="px-6 pt-5 pb-4">
            <div className="h-6 w-48 rounded-lg bg-white/[0.06]" />
          </div>
          <div className="px-4 pb-5">
            <div className="h-20 rounded-lg bg-white/[0.03]" />
          </div>
        </div>
      </div>
    </div>
  );
}
