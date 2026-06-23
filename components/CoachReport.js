const SEV = {
  critical: 'bg-red-500/15 text-red-300',
  high: 'bg-orange-500/15 text-orange-300',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-white/10 text-white/50',
};

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

export default function CoachReport({ report, updatedAt }) {
  if (!report) return null;
  const rm = Array.isArray(report.recurring_mistakes) ? report.recurring_mistakes : [];
  const psy = report.psychology || {};
  const insights = Array.isArray(psy.insights) ? psy.insights : [];
  const guards = Array.isArray(psy.guardrails) ? psy.guardrails : [];
  const discipline = report.playbook_discipline || null;

  return (
    <div className="space-y-6">
      {report.headline ? (
        <div className="rounded-2xl border border-white/15 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-6">
          <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">Overall takeaway</div>
          <p className="mt-2 font-display text-xl font-semibold leading-snug">{report.headline}</p>
        </div>
      ) : null}

      {/* Playbook Discipline Section */}
      {discipline && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-base">&#128170;</span>
            <div className="font-display text-base font-semibold" style={gradientText}>Playbook discipline</div>
          </div>
          {discipline.summary && (
            <p className="mb-4 text-sm leading-relaxed text-white/80">{discipline.summary}</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {discipline.setup_adherence_pct != null && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Setup adherence</div>
                <div className={'mt-1 font-display text-xl font-bold ' + (discipline.setup_adherence_pct >= 70 ? 'text-emerald-400' : discipline.setup_adherence_pct >= 40 ? 'text-amber-400' : 'text-red-400')}>
                  {discipline.setup_adherence_pct}%
                </div>
              </div>
            )}
            {discipline.no_setup_count != null && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">No setup trades</div>
                <div className={'mt-1 font-display text-xl font-bold ' + (discipline.no_setup_count === 0 ? 'text-emerald-400' : 'text-amber-400')}>
                  {discipline.no_setup_count}
                </div>
              </div>
            )}
          </div>
          {discipline.worst_pattern && (
            <p className="mt-3 text-xs leading-relaxed text-red-300">
              <span className="text-white/40">Pattern: </span>{discipline.worst_pattern}
            </p>
          )}
          {discipline.recommendation && (
            <p className="mt-2 text-xs leading-relaxed text-cyan-300">
              <span className="text-white/40">Recommendation: </span>{discipline.recommendation}
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 font-display text-base font-semibold">Top recurring mistakes</div>
        {rm.length ? (
          <div className="space-y-3">
            {rm.map((m, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold">{m.pattern}</span>
                  {m.severity ? <span className={'rounded px-2 py-0.5 font-mono text-[10px] uppercase ' + (SEV[m.severity] || SEV.low)}>{m.severity}</span> : null}
                  {m.frequency ? <span className="font-mono text-[11px] text-white/40">{m.frequency}</span> : null}
                </div>
                {m.impact ? <p className="mt-1.5 text-xs leading-relaxed text-white/60">{m.impact}</p> : null}
                {m.fix ? <p className="mt-2 text-xs leading-relaxed text-cyan-300"><span className="text-white/40">Fix: </span>{m.fix}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40">No recurring mistakes detected yet — keep logging trades.</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-3 font-display text-base font-semibold">&#129504; Trading psychology</div>
        {psy.summary ? <p className="mb-4 text-sm leading-relaxed text-white/80">{psy.summary}</p> : null}
        {insights.length ? (
          <div className="mb-4 space-y-2">
            {insights.map((it, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold">{it.emotion}</span>
                  {it.stat ? <span className="font-mono text-[11px] text-amber-300">{it.stat}</span> : null}
                </div>
                {it.observation ? <p className="mt-1 text-xs leading-relaxed text-white/60">{it.observation}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        {guards.length ? (
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-white/40">Guardrails</div>
            <ul className="space-y-1.5">
              {guards.map((g, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed text-white/70">
                  <span className="text-cyan-400">&rarr;</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {updatedAt ? (
        <p className="font-mono text-[11px] text-white/30">
          Generated {new Date(updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      ) : null}
    </div>
  );
}
