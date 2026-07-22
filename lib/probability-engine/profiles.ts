/* ── Standard Challenge Profiles ────────────────────────────── */

import type { ChallengeProfile } from './types';

export const PROFILES: ChallengeProfile[] = [
  {
    id: 'one-step',
    name: 'One-Step Challenge',
    description: 'Single-phase evaluation with an 8% profit target.',
    profitTarget: 8,
    dailyDrawdown: 2,
    overallDrawdown: 4,
    minimumProfitableDays: 5,
    challengeDays: 30,
  },
  {
    id: 'two-step',
    name: 'Two-Step Challenge',
    description: 'Phase 1 targets 8%, Phase 2 targets 5%. Simulated as the harder Phase 1.',
    profitTarget: 8,
    dailyDrawdown: 2,
    overallDrawdown: 4,
    minimumProfitableDays: 5,
    challengeDays: 30,
  },
  {
    id: 'instant',
    name: 'Instant Funding',
    description: 'No profit target. Stay within drawdown limits with consistent risk.',
    profitTarget: 0,       // no explicit target — survival-based
    dailyDrawdown: 2,
    overallDrawdown: 4,
    minimumProfitableDays: 5,
    challengeDays: 30,
    maxRiskPerTrade: 1,
    consistencyRequirement: 20,
  },
];

export function getProfileById(id: string): ChallengeProfile | undefined {
  return PROFILES.find((p) => p.id === id);
}
