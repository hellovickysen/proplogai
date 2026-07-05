'use client';

/**
 * Warning banner shown to beta users when accessing Elite-only features.
 * "You're using this feature free during beta. After beta, it requires the Elite plan."
 *
 * Props:
 * feature - feature key from FEATURES config (e.g. 'ai_analysis')
 * featureLabel - human-readable label (optional, falls back to feature key)
 * remaining - { used, limit, remaining } for rate-limited features (optional)
 */
export default function BetaFeatureWarning({ feature, featureLabel, remaining }) {
  return (
    <div className="mb-5 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">⚡</span>
        <div>
          <p className="text-sm font-semibold text-violet-300">
            Beta access — {featureLabel || feature}
          </p>
          <p className="text-xs text-white/50 mt-1">
            You're using this feature free during beta. After beta, it will require the Elite plan (₹799/mo).
          </p>
          {remaining && remaining.limit > 0 && remaining.limit !== -1 && (
            <p className="text-xs text-white/40 mt-1 font-mono">
              {remaining.used} / {remaining.limit} used this month
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
