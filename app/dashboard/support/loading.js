export default function SupportLoading() {
  return (
    <div className="px-3 py-8 sm:px-4 animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-36 rounded-lg bg-white/[0.06]" />
      </div>
      <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
        <div>
          <div className="h-4 w-20 rounded bg-white/[0.06] mb-2" />
          <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
        </div>
        <div>
          <div className="h-4 w-24 rounded bg-white/[0.06] mb-2" />
          <div className="h-32 w-full rounded-xl bg-white/[0.06]" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}
