'use client';

/**
 * Warning banner shown to beta users when accessing Elite-only features.
 * "You're using this feature free during beta. After beta, it requires the Elite plan."
 *
 * Props:
 *   feature - feature key from FEATURES config (e.g. 'ai_analysis')
 *   featureLabel - human-readable label (optional, falls back to feature key)
 *   remaining - { used, limit, remaining } for rate-limited features (optional)
 */
export default function BetaFeatureWarning({ feature, featureLabel, remaining }) {
  return (
    <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-sm text-amber-400">⚡</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-300">
            Beta access — {featureLabel || feature}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            You&apos;re using this feature free during beta. After beta, it will require the Elite plan ($9.99/mo).
          </p>
          {remaining && remaining.limit !== Infinity && (
            <p className="mt-1 font-mono text-[10px] text-white/35">
              {remaining.used} / {remaining.limit} used this month
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
