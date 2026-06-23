import AnalyzeButton from '@/components/AnalyzeButton';

const SEV = {
  critical: 'bg-red-500/15 text-red-300',
  high: 'bg-orange-500/15 text-orange-300',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-white/10 text-white/50',
};

const GRADE_COLOR = { A: 'text-emerald-400', B: 'text-emerald-400', C: 'text-amber-400', D: 'text-red-400', F: 'text-red-400' };

const gradientText = { background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export default function AiInsight({ insight, tradeId }) {
  const a = insight && insight.mistakes ? insight.mistakes : null;
  if (!a) return null;
  const grade = a.grade || '—';
  const score = insight.severity != null ? insight.severity : a.execution_score != null ? a.execution_score : null;
  const mistakes = Array.isArray(a.mistakes) ? a.mistakes : [];
  const wentWell = Array.isArray(a.went_well) ? a.went_well : [];

  return (
    <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-base font-semibold" style={gradientText}>&#10022; AI Coach</div>
        <div className="flex items-center gap-3">
          <span className={'font-display text-2xl font-bold ' + (GRADE_COLOR[grade] || 'text-white')}>{grade}</span>
          {score != null ? <span className="font-mono text-xs text-white/50">{score}/100</span> : null}
        </div>
      </div>

      {a.summary ? <p className="mb-5 text-sm leading-relaxed text-white/80">{a.summary}</p> : null}

      {mistakes.length ? (
        <div className="mb-5">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-white/40">Mistakes detected</div>
          <div className="space-y-2">
            {mistakes.map((m, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold">{m.title}</span>
                  {m.severity ? (
                    <span className={'rounded px-2 py-0.5 font-mono text-[10px] uppercase ' + (SEV[m.severity] || SEV.low)}>{m.severity}</span>
                  ) : null}
                </div>
                {m.detail ? <p className="mt-1 text-xs leading-relaxed text-white/60">{m.detail}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {wentWell.length ? (
        <div className="mb-5">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-white/40">What went well</div>
          <ul className="space-y-1.5">
            {wentWell.map((w, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-white/70">
                <span className="text-emerald-400">&#10003;</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {a.fix ? (
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-cyan-300">Coach&apos;s fix</div>
          <p className="text-sm leading-relaxed text-white/85">{a.fix}</p>
        </div>
      ) : null}

      <div className="mt-5">
        <AnalyzeButton tradeId={tradeId} label="&#8635; Re-analyze" />
      </div>
    </div>
  );
}
