"use client";

/** Pulsing skeleton placeholder for loading states. */
export function SkeletonBox({ className = '' }) {
  return (
    <div className={'animate-pulse rounded-xl bg-white/[0.06] ' + className} />
  );
}

/** Skeleton for a stat card row. */
export function StatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <SkeletonBox className="mb-3 h-3 w-16" />
          <SkeletonBox className="h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a trade table. */
export function TableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2">
      <SkeletonBox className="h-8 w-full" />
      {[...Array(rows)].map((_, i) => (
        <SkeletonBox key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/** Skeleton for the calendar grid. */
export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1 p-4">
      {[...Array(35)].map((_, i) => (
        <SkeletonBox key={i} className="h-24" />
      ))}
    </div>
  );
}

/** Skeleton for the equity curve chart. */
export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <SkeletonBox className="mb-3 h-4 w-28" />
      <SkeletonBox className="h-[200px] w-full" />
    </div>
  );
}
