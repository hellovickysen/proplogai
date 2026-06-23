"use client";

const gradientId = 'weeklyScoreGrad';

export default function WeeklyScoreRing({ score, breakdown }) {
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  // Score tone
  const tone = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : score > 0 ? 'text-red-400' : 'text-white/50';

  return (
    <div className="flex items-center gap-6">
      {/* SVG Ring */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffc42d" />
              <stop offset="100%" stopColor="#ff9f1c" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        {/* Score label in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={'font-display text-3xl font-bold ' + tone}>{score}</span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/35">weekly</span>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="space-y-1.5">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-white/40">Score breakdown</div>
          <BreakdownRow label="Journal" pts={breakdown.journal} max={25} />
          <BreakdownRow label="Discipline" pts={breakdown.discipline} max={30} />
          <BreakdownRow label="No revenge" pts={breakdown.revenge} max={25} />
          <BreakdownRow label="Volume" pts={breakdown.volume} max={20} />
        </div>
      )}
    </div>
  );
}

function BreakdownRow({ label, pts, max }) {
  const pct = max > 0 ? (pts / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 font-mono text-[10px] text-white/45">{label}</span>
      <div className="h-1.5 w-20 rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            width: pct + '%',
            background: 'linear-gradient(90deg, #ffc42d, #ff9f1c)',
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>
      <span className="font-mono text-[10px] text-white/50">{pts}/{max}</span>
    </div>
  );
}
