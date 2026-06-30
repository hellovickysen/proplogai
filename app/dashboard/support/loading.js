/**
 * Generic loading skeleton — copy this file to:
 *   app/dashboard/trophies/loading.js
 *   app/dashboard/referrals/loading.js
 *   app/dashboard/support/loading.js
 *   app/dashboard/rulebook/loading.js
 *   app/dashboard/notifications/loading.js
 *
 * Rename the component function accordingly (e.g. TrophiesLoading).
 */
export default function GenericLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      {/* Title bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-white/[0.06]" />
          <div className="h-3 w-48 rounded bg-white/[0.06]" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Card 1 — primary content area */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-28 rounded bg-white/[0.06]" />
          <div className="h-6 w-16 rounded bg-white/[0.06]" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.06]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-40 rounded bg-white/[0.06]" />
                <div className="h-2.5 w-24 rounded bg-white/[0.06]" />
              </div>
              <div className="h-4 w-12 shrink-0 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>

      {/* Card 2 — secondary section */}
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 h-5 w-24 rounded bg-white/[0.06]" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
              <div className="h-6 w-28 rounded bg-white/[0.06]" />
              <div className="h-2.5 w-full rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>

      {/* Card 3 — tertiary / extra info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 h-5 w-20 rounded bg-white/[0.06]" />
        <div className="space-y-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-11 w-full rounded-xl bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}
