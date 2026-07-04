"use client";

const SEV_COLORS = {
  critical: { border: 'border-red-400/30' },
  high: { border: 'border-orange-400/30' },
  medium: { border: 'border-amber-400/30' },
  low: { border: 'border-white/15' },
};

/* ── Horizontal bar ─────────────────────────────────────────── */
function Bar({ pct, color }) {
  return (
    <div className="h-2.5 flex-1 rounded-full bg-white/[0.06]">
      <div className={'h-full rounded-full transition-all ' + color} style={{ width: Math.max(4, Math.min(100, pct)) + '%' }} />
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
              <span className="flex-1 text-sm font-medium text-white/70 line-clamp-1">{m.pattern}</span>
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
  // Normalize: if no percentages, distribute evenly
  const hasPct = items.some((e) => e.pct > 0);
  const total = items.length;
  const normalized = hasPct
    ? items
    : items.map((e, i) => ({ ...e, pct: Math.round(100 / total) }));
  const maxPct = Math.max(...normalized.map((e) => e.pct), 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-white/35">Emotions</div>
      <div className="space-y-2.5">
        {normalized.map((e, i) => {
          const colors = ['bg-violet-400', 'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400', 'bg-red-400'];
          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-white/55">{e.label}</span>
                {e.detail && <span className="text-[10px] text-white/25">{e.detail}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Bar pct={(e.pct / maxPct) * 100} color={colors[i % colors.length]} />
                <span className="w-8 text-right font-mono text-xs text-white/40">{e.pct}%</span>
              </div>
            </div>
          );
        })}
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
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-white/55">
            {numbered ? (
              <span className="mt-px shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.08] font-mono text-[9px] text-white/35">{i + 1}</span>
            ) : (
              <span className="mt-px text-cyan-400 shrink-0">→</span>
            )}
            <span className="line-clamp-1">{item}</span>
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

  // Emotion distribution — handle both formats (percentage-based and text-based)
  const latestReport = reports?.[0]?.mistakes;
  const rawEmotions = latestReport?.emotional_analysis?.distribution || latestReport?.psychology?.insights || [];
  const emotionItems = rawEmotions.slice(0, 5).map((e) => {
    const pct = e.percentage != null ? e.percentage : 0;
    // Extract just the emotion name (before any parenthetical)
    const emotionName = (e.emotion || '').split('(')[0].split('+')[0].trim();
    const shortLabel = emotionName.length > 15 ? emotionName.slice(0, 15) + '…' : emotionName;
    // Use stat or observation as detail
    const detail = e.stat || e.observation || '';
    const shortDetail = detail.length > 30 ? detail.slice(0, 30) + '…' : detail;
    return { label: shortLabel || e.emotion, pct, detail: shortDetail };
  });

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
