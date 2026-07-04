export default function Loading() {
  return (
    <div className="min-h-screen p-4 md:p-8 animate-pulse">
      <div className="h-8 w-32 bg-white/10 rounded-lg mb-2" />
      <div className="h-4 w-64 bg-white/5 rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-white/[0.03] rounded-2xl border border-white/10"
          />
        ))}
      </div>
    </div>
  );
}
