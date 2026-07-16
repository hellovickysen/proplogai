export default function ReferralsLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
      </div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="h-5 w-36 rounded bg-white/[0.06] mb-3" />
        <div className="h-10 w-full rounded-xl bg-white/[0.06] mb-4" />
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="h-3 w-20 rounded bg-white/[0.06] mb-3" />
            <div className="h-8 w-16 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
