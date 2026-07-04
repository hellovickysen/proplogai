"use client";

const SEV_COLORS = {
  critical: { bar: 'bg-red-400', text: 'text-red-300', border: 'border-red-400/30' },
  high: { bar: 'bg-orange-400', text: 'text-orange-300', border: 'border-orange-400/30' },
  medium: { bar: 'bg-amber-400', text: 'text-amber-300', border: 'border-amber-400/30' },
  low: { bar: 'bg-white/30', text: 'text-white/50', border: 'border-white/15' },
};

/* ── Horizontal bar ─────────────────────────────────────────── */
function Bar({ pct, color }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
      <div className={'h-full rounded-full transition-all ' + color} style={{ width: Math.min(100, pct) + '%' }} />
    </div>
  );
}

/* ── Mistakes card ──────────────────────────────────────────── */
function MistakesCard({ items }) {
  if (!items.length) return <EmptyMini icon="🔄" text="No patterns yet" />;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Recurring Mistakes</div>
      <div className="space-y-2">
        {items.map((m, i) => {
          const sev = SEV_COLORS[m.severity] || SEV_COLORS.low;
          return (
            <div key={i} className={'flex items-center gap-2.5 rounded-lg border-l-[3px] bg-white/[0.02] px-3 py-2 ' + sev.border}>
              <span className={'flex-1 text-sm font-medium ' + sev.text}>{m.pattern}</span>
              <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-white/40">{m.count}×</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Emotions bar chart ─────────────────────────────────────── */
function EmotionsCard({ items }) {
  if (!items.length) return <EmptyMini icon="🧠" text="Log emotions to see patterns" />;
  const maxPct = Math.max(...items.map((e) => e.pct || 0), 1);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Emotion Distribution</div>
      <div className="space-y-2">
        {items.map((e, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-20 truncate text-xs text-white/55">{e.emotion}</span>
            <Bar pct={(e.pct / maxPct) * 100} color={e.pct > 30 ? 'bg-violet-400' : e.pct > 15 ? 'bg-cyan-400' : 'bg-white/30'} />
            <span className="w-10 text-right font-mono text-xs text-white/40">{e.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Compact list card ──────────────────────────────────────── */
function ListCard({ icon, title, items, numbered }) {
  if (!items.length) return <EmptyMini icon={icon} text={'No ' + title.toLowerCase() + ' yet'} />;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">{title}</div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-white/55">
            {numbered ? (
              <span className="mt-px shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[9px] text-white/30">{i + 1}</span>
            ) : (
              <span className="mt-px text-cyan-400 shrink-0">→</span>
            )}
            <span className="line-clamp-2">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tiny empty state ───────────────────────────────────────── */
function EmptyMini({ icon, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <p className="text-xs text-white/25">{text}</p>
    </div>
  );
}

export default function InsightsTab({ reports, analyses }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="text-3xl mb-2">💡</div>
        <p className="text-xs text-white/35">Insights appear after your first review</p>
      </div>
    );
  }

  // Aggregate mistakes across all reports
  const allMistakes = {};
  (reports || []).forEach((r) => {
    (r?.mistakes?.biggest_mistakes || r?.mistakes?.recurring_mistakes || []).forEach((m) => {
      const key = m.pattern || m.title;
      if (!key) return;
      if (!allMistakes[key]) allMistakes[key] = { count: 0, severity: m.severity, pattern: key };
      allMistakes[key].count++;
    });
  });
  const topMistakes = Object.values(allMistakes).sort((a, b) => b.count - a.count).slice(0, 5);

  // Emotion distribution
  const latestReport = reports?.[0]?.mistakes;
  const emotionDist = latestReport?.emotional_analysis?.distribution || latestReport?.psychology?.insights || [];
  const emotionItems = emotionDist.slice(0, 5).map((e) => ({
    emotion: e.emotion,
    pct: e.percentage != null ? e.percentage : 0,
  }));

  const actionPlan = (latestReport?.action_plan || []).slice(0, 4);
  const guardrails = (latestReport?.psychology?.guardrails || []).slice(0, 4);
  const improvements = (latestReport?.improvements || []).slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <MistakesCard items={topMistakes} />
        <EmotionsCard items={emotionItems} />
        <ListCard icon="🎯" title="Action Plan" items={actionPlan} numbered />
        <ListCard icon="🛡️" title="Your Rules" items={guardrails} />
      </div>

      {improvements.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-emerald-400/50">Improvements</div>
          <div className="space-y-1.5">
            {improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-emerald-300/60">
                <span className="text-emerald-400">✔</span><span className="line-clamp-1">{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
