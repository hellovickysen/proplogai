const TABS = 5;
const FIELD_ROWS = [
  { labelW: "w-20", inputW: "w-full" },
  { labelW: "w-24", inputW: "w-full" },
  { labelW: "w-16", inputW: "w-48" },
  { labelW: "w-28", inputW: "w-full" },
];

export default function SettingsLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      {/* Title */}
      <div className="mb-6 space-y-2">
        <div className="h-7 w-24 rounded-lg bg-white/[0.06]" />
        <div className="h-3 w-52 rounded bg-white/[0.06]" />
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[...Array(TABS)].map((_, i) => (
          <div
            key={i}
            className={`h-9 rounded-xl bg-white/[0.06] shrink-0 ${
              i === 0 ? "w-28 bg-white/[0.1]" : "w-24"
            }`}
          />
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {/* Section label */}
        <div className="mb-5 h-4 w-36 rounded bg-white/[0.06]" />

        {/* Avatar row */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/[0.06] shrink-0" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.06]" />
            <div className="h-8 w-28 rounded-xl bg-white/[0.06]" />
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-5">
          {FIELD_ROWS.map((row, i) => (
            <div key={i} className="grid gap-1.5">
              <div className={`h-3 ${row.labelW} rounded bg-white/[0.06]`} />
              <div className={`h-10 ${row.inputW} rounded-xl bg-white/[0.06]`} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-white/[0.06]" />

        {/* Second section */}
        <div className="mb-5 h-4 w-32 rounded bg-white/[0.06]" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3 w-36 rounded bg-white/[0.06]" />
                <div className="h-2.5 w-52 rounded bg-white/[0.06]" />
              </div>
              {/* Toggle pill */}
              <div className="h-6 w-11 rounded-full bg-white/[0.06] shrink-0" />
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-end gap-3">
          <div className="h-10 w-24 rounded-xl bg-white/[0.06]" />
          <div className="h-10 w-28 rounded-xl bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}
