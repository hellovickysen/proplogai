"use client";

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

const SCORE_KEYS = [
  { key: 'discipline', label: 'Discipline', icon: '🎯' },
  { key: 'psychology', label: 'Psychology', icon: '🧠' },
  { key: 'consistency', label: 'Consistency', icon: '📈' },
  { key: 'risk_management', label: 'Risk Mgmt', icon: '🛡️' },
  { key: 'execution', label: 'Execution', icon: '⚡' },
];

function scoreColor(val) {
  if (val >= 80) return 'text-emerald-400';
  if (val >= 60) return 'text-amber-400';
  if (val >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function TrendArrow({ current, previous }) {
  if (previous == null || current == null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="font-mono text-[10px] text-white/30">—</span>;
  return (
    <span className={'font-mono text-[10px] ' + (diff > 0 ? 'text-emerald-400' : 'text-red-400')}>
      {diff > 0 ? '▲' : '▼'} {Math.abs(diff)}
    </span>
  );
}

function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="url(#sparkGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function OverviewTab({ reports, tradeAnalyses }) {
  // Get latest report scores
  const latest = reports && reports.length > 0 ? reports[0] : null;
  const previous = reports && reports.length > 1 ? reports[1] : null;
  const latestScores = latest?.mistakes?.scores || {};
  const previousScores = previous?.mistakes?.scores || {};

  // Build sparkline data from report history (oldest to newest)
  const scoreHistory = {};
  SCORE_KEYS.forEach(({ key }) => { scoreHistory[key] = []; });
  const sorted = [...(reports || [])].reverse();
  sorted.forEach((r) => {
    const s = r?.mistakes?.scores;
    if (s) {
      SCORE_KEYS.forEach(({ key }) => {
        if (s[key] != null) scoreHistory[key].push(s[key]);
      });
    }
  });

  // Progress highlights — find improvements from past reports
  const improvements = latest?.mistakes?.improvements || [];

  // Mistake patterns that have reduced
  const latestMistakes = latest?.mistakes?.biggest_mistakes || latest?.mistakes?.recurring_mistakes || [];
  const prevMistakes = previous?.mistakes?.biggest_mistakes || previous?.mistakes?.recurring_mistakes || [];

  return (
    <div className="space-y-6">
      {/* Propol Persona Scores */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">◎</span>
          <span className="font-display text-base font-semibold" style={gradientText}>Propol Performance Scores</span>
          {!latest && <span className="font-mono text-[10px] text-white/30">Generate a review to see scores</span>}
        </div>
        {latest ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SCORE_KEYS.map(({ key, label, icon }) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{icon}</span>
                  <TrendArrow current={latestScores[key]} previous={previousScores[key]} />
                </div>
                <div className={'mt-2 font-display text-2xl font-bold ' + scoreColor(latestScores[key] || 0)}>
                  {latestScores[key] != null ? latestScores[key] : '—'}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">{label}</div>
                {scoreHistory[key].length > 1 && (
                  <div className="mt-2">
                    <Sparkline data={scoreHistory[key]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-sm text-white/45">Generate your first Propol review to see your performance scores.</p>
          </div>
        )}
      </div>

      {/* Your Progress */}
      {improvements.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-3 font-display text-base font-semibold">✨ Your Progress</div>
          <div className="space-y-2">
            {improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-0.5 text-emerald-400">✔</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {tradeAnalyses && tradeAnalyses.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-3 font-display text-base font-semibold">📊 Analysis Summary</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Trades analyzed</div>
              <div className="mt-1 font-display text-xl font-bold">{tradeAnalyses.length}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Avg score</div>
              <div className={'mt-1 font-display text-xl font-bold ' + scoreColor(
                Math.round(tradeAnalyses.reduce((a, t) => a + (t.mistakes?.trade_score || t.mistakes?.execution_score || 0), 0) / tradeAnalyses.length)
              )}>
                {Math.round(tradeAnalyses.reduce((a, t) => a + (t.mistakes?.trade_score || t.mistakes?.execution_score || 0), 0) / tradeAnalyses.length)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Reviews</div>
              <div className="mt-1 font-display text-xl font-bold">{reports?.length || 0}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Latest grade</div>
              <div className="mt-1 font-display text-xl font-bold" style={gradientText}>
                {tradeAnalyses[0]?.mistakes?.grade || '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
