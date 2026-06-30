export default function CoachLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      {/* Title + subtitle */}
      <div className="mb-8 space-y-3">
        <div className="h-7 w-36 rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-72 rounded bg-white/[0.06]" />
      </div>

      {/* Large report card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {/* Card header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-white/[0.06]" />
            <div className="h-3 w-48 rounded bg-white/[0.06]" />
          </div>
          <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
        </div>

        {/* Score ring placeholder */}
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="h-36 w-36 shrink-0 rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-4 w-40 rounded bg-white/[0.06]" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded bg-white/[0.06]" />
                  <div className="h-3 w-8 rounded bg-white/[0.06]" />
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.06]">
                  <div
                    className="h-2 rounded-full bg-white/[0.1]"
                    style={{ width: `${40 + i * 12}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight blocks */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
            >
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-4 w-full rounded bg-white/[0.06]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>

        {/* Action button row */}
        <div className="mt-6 flex gap-3">
          <div className="h-10 w-36 rounded-xl bg-white/[0.06]" />
          <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />
        </div>
      </div>

      {/* Recent feedback list */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 h-5 w-28 rounded bg-white/[0.06]" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="mb-3 flex items-start gap-3 border-b border-white/[0.05] pb-3 last:border-b-0 last:mb-0 last:pb-0"
          >
            <div className="mt-0.5 h-8 w-8 rounded-full bg-white/[0.06] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-full rounded bg-white/[0.06]" />
              <div className="h-3 w-4/5 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
