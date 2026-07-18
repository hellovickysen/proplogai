'use client';

/**
 * Small inline plan badge: "Basic", "Trial · Nd", "Elite", or "Admin".
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

  const isTrialing =
    access.isTrialing && access.trialEndsAt && new Date(access.trialEndsAt) > new Date();
  if (isTrialing) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(access.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
    );
    return (
      <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
        Trial · {daysLeft}d
      </span>
    );
  }

  if (access.effectivePlan === 'elite' || access.plan === 'elite') {
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
