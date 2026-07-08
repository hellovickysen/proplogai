export default function ExpensesLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      {/* Title + add button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 rounded-lg bg-white/[0.06]" />
          <div className="h-3 w-44 rounded bg-white/[0.06]" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>

      {/* 3 stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
            </div>
            <div className="h-8 w-28 rounded bg-white/[0.06]" />
            <div className="mt-2 h-2.5 w-16 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex gap-2">
        {["All", "Subscriptions", "Platform Fees", "Education"].map((t, i) => (
          <div
            key={t}
            className={`h-8 rounded-lg bg-white/[0.06] shrink-0 ${
              i === 0 ? "w-10" : i === 1 ? "w-28" : i === 2 ? "w-28" : "w-20"
            }`}
          />
        ))}
      </div>

      {/* Expense list */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* List header */}
        <div className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-3">
          <div className="h-3 w-24 flex-1 rounded bg-white/[0.06]" />
          <div className="hidden sm:block h-3 w-16 rounded bg-white/[0.06]" />
          <div className="h-3 w-12 rounded bg-white/[0.06]" />
          <div className="h-3 w-14 rounded bg-white/[0.06]" />
        </div>

        {/* Item rows */}
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4 last:border-b-0"
          >
            {/* Icon */}
            <div className="h-9 w-9 rounded-xl bg-white/[0.06] shrink-0" />

            {/* Name + category */}
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className="h-3.5 w-32 rounded bg-white/[0.06]" />
              <div className="h-2.5 w-20 rounded bg-white/[0.06]" />
            </div>

            {/* Date */}
            <div className="hidden sm:block h-3 w-20 rounded bg-white/[0.06] shrink-0" />

            {/* Amount */}
            <div className="h-4 w-16 rounded bg-white/[0.06] shrink-0" />

            {/* Actions */}
            <div className="h-6 w-6 rounded-full bg-white/[0.06] shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-36 rounded bg-white/[0.06]" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}
