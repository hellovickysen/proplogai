export default function PropExpensesLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg bg-white/[0.06]" />
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="h-3 w-16 rounded bg-white/[0.06] mb-2" />
            <div className="h-7 w-20 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-white/10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 rounded bg-white/[0.06]" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-white/[0.04]">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 rounded bg-white/[0.06]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
