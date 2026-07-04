"use client";

function InsightCard({ icon, title, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">{title}</span>
      </div>
      {items && items.length > 0 ? (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
              <span className="text-white/55">{typeof item === 'string' ? item : item.text}</span>
              {item.stat && <span className="shrink-0 font-mono text-[9px] text-white/25">{item.stat}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-white/20">{emptyText || 'Not enough data'}</p>
      )}
    </div>
  );
}

export default function InsightsTab({ reports, analyses }) {
  // Aggregate mistakes
  const allMistakes = {};
  (reports || []).forEach((r) => {
    (r?.mistakes?.biggest_mistakes || r?.mistakes?.recurring_mistakes || []).forEach((m) => {
      const key = m.pattern || m.title;
      if (!key) return;
      if (!allMistakes[key]) allMistakes[key] = { count: 0, severity: m.severity };
      allMistakes[key].count++;
    });
  });

  const topMistakes = Object.entries(allMistakes)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([pattern, data]) => ({ text: pattern, stat: `${data.count}×` }));

  const latestReport = reports?.[0]?.mistakes;
  const emotionDist = latestReport?.emotional_analysis?.distribution || latestReport?.psychology?.insights || [];
  const emotionItems = emotionDist.slice(0, 4).map((e) => ({
    text: e.emotion,
    stat: e.percentage != null ? `${e.percentage}%` : e.stat || '',
  }));

  const actionPlan = (latestReport?.action_plan || []).slice(0, 3);
  const guardrails = (latestReport?.psychology?.guardrails || []).slice(0, 3);
  const improvements = (latestReport?.improvements || []).slice(0, 3);

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="text-3xl mb-2">💡</div>
        <p className="text-xs text-white/35">Insights appear after your first review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <InsightCard icon="🔄" title="Recurring Mistakes" items={topMistakes} emptyText="No patterns yet" />
        <InsightCard icon="🧠" title="Emotions" items={emotionItems} emptyText="Log emotions to see patterns" />
        <InsightCard icon="🎯" title="Action Plan" items={actionPlan.map((a) => ({ text: a }))} emptyText="Generate a review" />
        <InsightCard icon="🛡️" title="Your Rules" items={guardrails.map((g) => ({ text: g }))} emptyText="Rules suggested after review" />
      </div>

      {improvements.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-3.5">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400/60">Improvements</div>
          <div className="space-y-1">
            {improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-300/60">
                <span className="text-emerald-400">✔</span><span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
