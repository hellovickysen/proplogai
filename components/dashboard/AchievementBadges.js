"use client";

import { useState, useEffect } from 'react';
import Confetti, { SuccessCheck } from '@/components/ui/Confetti';

// Big milestones get confetti, small ones get checkmark
const BIG_MILESTONES = ['century', 'streak_30', 'score_90', 'discipline_100'];

export default function AchievementBadges({ achievements }) {
  const [celebration, setCelebration] = useState(null); // { type: 'confetti'|'check', name, icon }

  // Detect newly earned achievements
  useEffect(() => {
    if (!achievements || achievements.length === 0) return;
    const earned = achievements.filter((a) => a.earned);
    try {
      const stored = localStorage.getItem('pj_earned_badges');
      const prev = stored ? JSON.parse(stored) : [];
      const earnedKeys = earned.map((a) => a.key);

      // Find new achievements not in previous list
      const newOnes = earned.filter((a) => !prev.includes(a.key));

      // Save current earned list
      localStorage.setItem('pj_earned_badges', JSON.stringify(earnedKeys));

      if (newOnes.length > 0) {
        // Pick the most significant new achievement
        const best = newOnes.find((a) => BIG_MILESTONES.includes(a.key)) || newOnes[0];
        const isBig = BIG_MILESTONES.includes(best.key);
        setCelebration({ type: isBig ? 'confetti' : 'check', name: best.name, icon: best.icon });
      }
    } catch (e) {}
  }, []);

  // NOW the early return is safe
  if (!achievements || achievements.length === 0) return null;

  const earned = achievements.filter((a) => a.earned);
  const inProgress = achievements.filter((a) => !a.earned && a.progress > 0);

  return (
    <div>
      {/* Celebration animations */}
      {celebration && celebration.type === 'confetti' && (
        <Confetti active={true} onDone={() => setCelebration(null)} />
      )}
      {celebration && celebration.type === 'check' && (
        <SuccessCheck active={true} onDone={() => setCelebration(null)} />
      )}

      {/* Achievement unlocked banner */}
      {celebration && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-4 py-3 animate-pulse">
          <span className="text-xl">{celebration.icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-emerald-300">Achievement unlocked!</div>
            <div className="font-display text-sm font-bold">{celebration.name}</div>
          </div>
        </div>
      )}

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
            Earned ({earned.length}/{achievements.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {earned.map((a) => (
              <div
                key={a.key}
                className="group relative flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2"
                title={a.desc}
              >
                <span className="text-sm">{a.icon}</span>
                <span className="text-xs font-semibold text-white/80">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/30">
            In progress
          </div>
          <div className="flex flex-wrap gap-2">
            {inProgress.map((a) => (
              <div
                key={a.key}
                className="group relative flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.02] px-3 py-2"
                title={a.desc + ' (' + Math.round(a.progress * 100) + '%)'}
              >
                <span className="text-sm opacity-50">{a.icon}</span>
                <span className="text-xs text-white/40">{a.name}</span>
                <span className="font-mono text-[11px] text-white/40">{Math.round(a.progress * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
