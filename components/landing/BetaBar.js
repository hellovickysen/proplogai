import { BETA_LIMIT } from '@/components/landing/LandingData';

/**
 * Shared beta-spots bar used by the Hero and the Final CTA.
 * Pure presentational — `count` comes from the server component (site_settings).
 */
export default function BetaBar({ count }) {
  const pct = Math.min(100, (count / BETA_LIMIT) * 100);
  const remaining = Math.max(0, BETA_LIMIT - count);
  const barColor = count >= 480 ? 'linear-gradient(120deg, #f87171, #ef4444)'
    : count >= 400 ? 'linear-gradient(120deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(120deg, #a78bfa, #22d3ee)';
  const dotColor = count >= 480 ? 'bg-red-400' : count >= 400 ? 'bg-amber-400' : 'bg-emerald-300';
  const textColor = count >= 480 ? 'text-red-300' : count >= 400 ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white/70">
          <span className={`h-2 w-2 rounded-full ${dotColor} shadow-[0_0_10px_rgba(52,211,153,0.7)]`} />
          Beta spots filling up
        </span>
        <span className={`font-mono text-sm font-bold ${textColor}`}>{remaining} left</span>
      </div>
      <div className="h-3 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + '%', background: barColor }} />
      </div>
      <div className="mt-2 text-center font-mono text-xs text-white/40">{count} / {BETA_LIMIT} traders joined</div>
    </div>
  );
}
