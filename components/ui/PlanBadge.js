'use client';

/**
 * Small inline plan badge: "Basic", "Elite", or "Beta" tag.
 * Used in sidebar, header, settings, profile.
 */
export default function PlanBadge({ access }) {
  if (!access) return null;

  if (access.isAdmin) {
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
        Admin
      </span>
    );
  }

  if (access.isBeta) {
    return (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        Beta
      </span>
    );
  }

  if (access.plan === 'elite') {
    return (
      <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
        Elite
      </span>
    );
  }

  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/60">
      Basic
    </span>
  );
}
