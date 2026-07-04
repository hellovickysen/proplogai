"use client";

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function InsightCard({ icon, title, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="font-display text-sm font-semibold">{title}</span>
      </div>
      {items && items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/60">
              <span className="mt-0.5 text-white/25">•</span>
              <span>{typeof item === 'string' ? item : item.text}</span>
              {item.stat && <span className="ml-auto shrink-0 font-mono text-[10px] text-white/30">{item.stat}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/30">{emptyText || 'Not enough data yet'}</p>
      )}
    </div>
  );
}

export default function InsightsTab({ reports, analyses }) {
  // Aggregate mistakes across all reports
  const allMistakes = {};
  (reports || []).forEach((r) => {
    const mistakes = r?.mistakes?.biggest_mistakes || r?.mistakes?.recurring_mistakes || [];
    mistakes.forEach((m) => {
      const key = m.pattern || m.title;
      if (!key) return;
      if (!allMistakes[key]) allMistakes[key] = { count: 0, severity: m.severity, latest: m };
      allMistakes[key].count++;
    });
  });

  const topMistakes = Object.entries(allMistakes)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([pattern, data]) => ({
      text: pattern,
      stat: `${data.count}× across reviews`,
    }));

  // Emotion insights from latest report
  const latestReport = reports?.[0]?.mistakes;
  const emotionDist = latestReport?.emotional_analysis?.distribution || latestReport?.psychology?.insights || [];
  const emotionItems = emotionDist.slice(0, 5).map((e) => ({
    text: `${e.emotion}: ${e.observation || e.stat || ''}`,
    stat: e.percentage != null ? `${e.percentage}%` : '',
  }));

  // Best/worst sessions from analyses
  const sessionStats = {};
  (analyses || []).forEach((a) => {
    const score = a?.mistakes?.trade_score ?? a?.mistakes?.execution_score;
    // We'd need the trade data for session, but we can use what's available
  });

  // Action plan from latest report
  const actionPlan = latestReport?.action_plan || [];

  // Guardrails/rules from psychology
  const guardrails = latestReport?.psychology?.guardrails || [];

  return (
    <div className="space-y-4">
      {reports && reports.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightCard
              icon="🔄"
              title="Recurring Mistakes"
              items={topMistakes}
              emptyText="No recurring patterns detected yet"
            />
            <InsightCard
              icon="🧠"
              title="Emotional Patterns"
              items={emotionItems}
              emptyText="Log emotions with trades to see patterns"
            />
            <InsightCard
              icon="🎯"
              title="Action Plan"
              items={actionPlan.map((a) => ({ text: a }))}
              emptyText="Generate a review to get your action plan"
            />
            <InsightCard
              icon="🛡️"
              title="Your Trading Rules"
              items={guardrails.map((g) => ({ text: g }))}
              emptyText="Propol will suggest rules based on your patterns"
            />
          </div>

          {/* Improvement tracking */}
          {latestReport?.improvements && latestReport.improvements.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm">📈</span>
                <span className="font-display text-sm font-semibold text-emerald-300">Improvements You&apos;ve Made</span>
              </div>
              <div className="space-y-1.5">
                {latestReport.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-emerald-300/70">
                    <span className="mt-0.5 text-emerald-400">✔</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}>
            💡
          </div>
          <h3 className="font-display text-lg font-bold">Insights build over time</h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-white/45">
            Generate your first Propol review to start seeing patterns in your trading behavior, emotions, and discipline.
          </p>
        </div>
      )}
    </div>
  );
}
