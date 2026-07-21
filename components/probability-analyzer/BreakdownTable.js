'use client';

export default function BreakdownTable({ breakdown }) {
  if (!breakdown || breakdown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-white/55">
        Probability Breakdown
      </h3>
      <div className="space-y-2">
        {breakdown.map((item) => (
          <div
            key={item.factor}
            className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3"
          >
            <span className="text-sm text-white/80">{item.factor}</span>
            <div className="flex items-center gap-3">
              {/* Bar visualization */}
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.abs(item.impact) * 3)}%`,
                    background: item.impact >= 0 ? '#34d399' : '#f87171',
                  }}
                />
              </div>
              <span
                className="min-w-[3.5rem] text-right font-mono text-sm font-semibold"
                style={{ color: item.impact >= 0 ? '#34d399' : '#f87171' }}
              >
                {item.impact >= 0 ? '+' : ''}{item.impact}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
