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

function scoreBg(val) {
  if (val >= 80) return 'border-emerald-400/20 bg-emerald-500/[0.06]';
  if (val >= 60) return 'border-amber-400/20 bg-amber-500/[0.06]';
  if (val >= 40) return 'border-orange-400/20 bg-orange-500/[0.06]';
  return 'border-red-400/20 bg-red-500/[0.06]';
}

function TrendArrow({ current, previous }) {
  if (previous == null || current == null) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  return (
    <span className={'font-mono text-[10px] ' + (diff > 0 ? 'text-emerald-400' : 'text-red-400')}>
      {diff > 0 ? '▲' : '▼'}{Math.abs(diff)}
    </span>
  );
}

function Sparkline({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="url(#sg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
    </svg>
  );
}

export default function OverviewTab({ reports, tradeAnalyses }) {
  const latest = reports?.[0] || null;
  const previous = reports?.[1] || null;
  const latestScores = latest?.mistakes?.scores || {};
  const previousScores = previous?.mistakes?.scores || {};
  const improvements = latest?.mistakes?.improvements || [];

  const scoreHistory = {};
  SCORE_KEYS.forEach(({ key }) => { scoreHistory[key] = []; });
  [...(reports || [])].reverse().forEach((r) => {
    const s = r?.mistakes?.scores;
    if (s) SCORE_KEYS.forEach(({ key }) => { if (s[key] != null) scoreHistory[key].push(s[key]); });
  });

  return (
    <div className="space-y-5">
      {/* Score Cards */}
      {latest ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {SCORE_KEYS.map(({ key, label, icon }) => {
            const val = latestScores[key] || 0;
            return (
              <div key={key} className={'rounded-2xl border p-3.5 ' + scoreBg(val)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs">{icon}</span>
                  <TrendArrow current={latestScores[key]} previous={previousScores[key]} />
                </div>
                <div className={'mt-1.5 font-display text-2xl font-bold ' + scoreColor(val)}>
                  {latestScores[key] != null ? latestScores[key] : '—'}
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">{label}</div>
                {scoreHistory[key].length > 1 && <div className="mt-1.5"><Sparkline data={scoreHistory[key]} /></div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="text-3xl mb-2">◎</div>
          <p className="text-xs text-white/35">Generate a review to see scores</p>
        </div>
      )}

      {/* Progress */}
      {improvements.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-emerald-400/60">Progress</div>
          <div className="space-y-1.5">
            {improvements.slice(0, 3).map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                <span className="text-emerald-400">✔</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats — compact row */}
      {tradeAnalyses && tradeAnalyses.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Analyzed', val: tradeAnalyses.length },
            { label: 'Avg Score', val: Math.round(tradeAnalyses.reduce((a, t) => a + (t.mistakes?.trade_score || t.mistakes?.execution_score || 0), 0) / tradeAnalyses.length), color: true },
            { label: 'Reviews', val: reports?.length || 0 },
            { label: 'Grade', val: tradeAnalyses[0]?.mistakes?.grade || '—', gradient: true },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
              <div className={'font-display text-lg font-bold ' + (s.gradient ? '' : s.color ? scoreColor(s.val) : '')} style={s.gradient ? gradientText : undefined}>
                {s.val}
              </div>
              <div className="font-mono text-[8px] uppercase tracking-wider text-white/30">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
