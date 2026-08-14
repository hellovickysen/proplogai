"use client";

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  fetchAnalyticsOverview,
  fetchSetupAnalytics,
  fetchRuleBreachAnalytics,
  fetchDayPatternAnalytics,
  fetchLossAttribution,
  fetchAIExplanation,
  runBackfill,
} from './actions';

/* ─── Date Filter Presets ──── */

const PRESETS = [
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'setups', label: 'Setups', icon: '🎯' },
  { key: 'breaches', label: 'Rule Breaches', icon: '🚨' },
  { key: 'patterns', label: 'Day Patterns', icon: '📅' },
  { key: 'attribution', label: 'Loss Attribution', icon: '💸' },
  { key: 'ai', label: 'AI Analysis', icon: '✦' },
];

/* ─── Shared UI Components ──── */

function Card({ children, className = '' }) {
  return (
    <div className={'rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 ' + className}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <Card>
      <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className={'text-2xl font-bold ' + (accent || 'text-white')}>{value}</div>
      {sub && <div className="mt-1 text-xs text-white/50">{sub}</div>}
    </Card>
  );
}

function TradeList({ trades, initialCount = 5 }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? trades : trades.slice(0, initialCount);
  if (!trades || trades.length === 0) return <div className="text-xs text-white/30 mt-2">No trades</div>;

  return (
    <div className="mt-3">
      <div className="space-y-1.5">
        {visible.map((t) => {
          const pnl = Number(t.pnl);
          const isWin = pnl > 0;
          return (
            <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white/80">{t.pair}</span>
                <span className={'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ' + (t.direction === 'long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                  {t.direction}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {t.trade_date && <span className="text-white/30">{t.trade_date}</span>}
                <span className={'font-mono font-semibold ' + (isWin ? 'text-emerald-400' : 'text-red-400')}>
                  {isWin ? '+' : ''}{pnl != null ? '$' + Math.abs(pnl).toFixed(2) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {trades.length > initialCount && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          {showAll ? 'Show less' : `Show all ${trades.length} trades →`}
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">📭</div>
      <div className="text-sm text-white/40">{message}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />
    </div>
  );
}

function ConfidenceLabel({ count, minSample = 10 }) {
  if (count >= minSample) return null;
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
      Low sample ({count} trades)
    </span>
  );
}

/* ─── Overview Tab ──── */

function OverviewTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return (
    <Card className="border-red-500/20">
      <div className="text-sm text-red-400">Error loading analytics: {data.error}</div>
      <div className="text-xs text-white/40 mt-2">Try clicking "Re-evaluate All Trades" above, or refresh the page.</div>
    </Card>
  );
  const totalTrades = data.totalTrades || 0;
  const totalBreaches = data.totalBreaches || 0;
  const uniqueBreachedTrades = data.uniqueBreachedTrades || 0;
  const lossFromBreaches = data.lossFromBreaches || 0;
  if (totalTrades === 0) return <EmptyState message="No trades in this period. Log some trades to see your analytics." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Trades" value={totalTrades} />
        <StatCard label="Rule Breaches" value={totalBreaches} accent={totalBreaches > 0 ? 'text-red-400' : 'text-emerald-400'} sub={`${uniqueBreachedTrades} trades affected`} />
        <StatCard label="Loss from Breaches" value={lossFromBreaches > 0 ? '-$' + lossFromBreaches.toFixed(2) : '$0'} accent={lossFromBreaches > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <StatCard label="Breach Rate" value={totalTrades > 0 ? Math.round((uniqueBreachedTrades / totalTrades) * 100) + '%' : '0%'} accent={uniqueBreachedTrades > 0 ? 'text-amber-400' : 'text-emerald-400'} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.strongestAdherence && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💪</span>
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">Strongest Adherence</span>
            </div>
            <div className="text-lg font-semibold text-emerald-400">{data.strongestAdherence.label}</div>
            <div className="text-xs text-white/50 mt-1">{data.strongestAdherence.rate}% follow rate</div>
          </Card>
        )}
        {data.biggestLeak && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">Biggest Repeated Leak</span>
            </div>
            <div className="text-lg font-semibold text-red-400">{data.biggestLeak.label}</div>
            <div className="text-xs text-white/50 mt-1">{data.biggestLeak.rate}% breach rate · {data.biggestLeak.count} violations</div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── Setups Tab ──── */

function SetupsTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return (
    <Card className="border-red-500/20">
      <div className="text-sm text-red-400">Error: {data.error}</div>
      <div className="text-xs text-white/40 mt-2">Try clicking "Re-evaluate All Trades" above.</div>
    </Card>
  );
  if (!data.setups || data.setups.length === 0) return <EmptyState message="No setup data in this period." />;

  return (
    <div className="space-y-3">
      <div className="text-xs text-white/40 mb-2">{data.totalTrades} trades · {data.setups.length} setups used</div>
      {data.setups.map((s) => (
        <Card key={s.name}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{s.name}</span>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/50">{s.count} trades</span>
                {s.improvementPriority > 2 && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">Needs attention</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                <span className="text-emerald-400">{s.wins}W</span>
                <span className="text-red-400">{s.losses}L</span>
                <span className={s.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {s.totalPnl >= 0 ? '+' : ''}{s.totalPnl.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-right">
              {s.adherenceRate !== null && (
                <div className={'text-lg font-bold ' + (s.adherenceRate >= 70 ? 'text-emerald-400' : s.adherenceRate >= 40 ? 'text-amber-400' : 'text-red-400')}>
                  {s.adherenceRate}%
                </div>
              )}
              <div className="text-[10px] text-white/30 uppercase">adherence</div>
            </div>
          </div>

          <div className="flex gap-3 text-[11px] text-white/40 border-t border-white/[0.04] pt-2 mt-2">
            {s.followed > 0 && <span>✅ {s.followed} followed</span>}
            {s.partial > 0 && <span>⚡ {s.partial} partial</span>}
            {s.notFollowed > 0 && <span className="text-red-400/60">❌ {s.notFollowed} not followed</span>}
            {s.badSl > 0 && <span className="text-amber-400/60">⚠️ {s.badSl} bad SL</span>}
            {s.noSetup > 0 && <span className="text-red-400/60">🚫 {s.noSetup} no setup</span>}
          </div>

          <TradeList trades={s.trades} />
        </Card>
      ))}
    </div>
  );
}

/* ─── Rule Breaches Tab ──── */

function BreachesTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return (
    <Card className="border-red-500/20">
      <div className="text-sm text-red-400">Error: {data.error}</div>
      <div className="text-xs text-white/40 mt-2">Try clicking "Re-evaluate All Trades" above.</div>
    </Card>
  );
  if (!data.rules || data.rules.length === 0) return <EmptyState message="No rule breaches detected in this period." />;

  return (
    <div className="space-y-3">
      <div className="text-xs text-white/40 mb-2">{data.totalEvaluations} evaluations across all rules</div>
      {data.rules.map((r) => (
        <Card key={r.key}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{r.label}</span>
                <span className={'rounded-full px-2 py-0.5 text-[10px] font-medium ' + (r.breachRate > 30 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}>
                  {r.breachRate}% breach rate
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
                <span className="text-red-400">{r.broken} breaches</span>
                <span className="text-emerald-400">{r.followed} followed</span>
                {r.unknown > 0 && <span>{r.unknown} unknown</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-400">-${r.lossAmount.toFixed(2)}</div>
              <div className="text-[10px] text-white/30 uppercase">loss from breaches</div>
            </div>
          </div>

          {/* Monthly breakdown */}
          {Object.keys(r.monthlyBreakdown).length > 1 && (
            <div className="mt-2 border-t border-white/[0.04] pt-2">
              <div className="text-[10px] text-white/30 uppercase mb-1.5">Monthly Trend</div>
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(r.monthlyBreakdown).sort().map(([month, count]) => (
                  <span key={month} className="rounded bg-white/[0.04] px-2 py-1 text-[10px] text-white/50">
                    {month}: <span className="text-red-400 font-medium">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <TradeList trades={r.trades} />
        </Card>
      ))}
    </div>
  );
}

/* ─── Day Patterns Tab ──── */

function PatternsTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return (
    <Card className="border-red-500/20">
      <div className="text-sm text-red-400">Error: {data.error}</div>
      <div className="text-xs text-white/40 mt-2">Try clicking "Re-evaluate All Trades" above.</div>
    </Card>
  );
  if (data.totalTrades === 0) return <EmptyState message="No trades in this period." />;

  return (
    <div className="space-y-4">
      {/* Best / Worst Day */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.bestDate && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🟢</span>
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">Best Day</span>
            </div>
            <div className="text-lg font-semibold text-emerald-400">+${data.bestDate.pnl.toFixed(2)}</div>
            <div className="text-xs text-white/50 mt-1">{data.bestDate.date} · {data.bestDate.trades} trades · {data.bestDate.wins}W / {data.bestDate.losses}L</div>
            <TradeList trades={data.bestDate.tradeList} />
          </Card>
        )}
        {data.worstDate && (
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔴</span>
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">Worst Day</span>
            </div>
            <div className="text-lg font-semibold text-red-400">{data.worstDate.pnl >= 0 ? '+' : '-'}${Math.abs(data.worstDate.pnl).toFixed(2)}</div>
            <div className="text-xs text-white/50 mt-1">{data.worstDate.date} · {data.worstDate.trades} trades · {data.worstDate.wins}W / {data.worstDate.losses}L</div>
            <TradeList trades={data.worstDate.tradeList} />
          </Card>
        )}
      </div>

      {/* Monday Comparison */}
      {data.mondayComparison && data.mondayComparison.mondayTrades >= 3 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📅</span>
            <span className="text-sm font-semibold text-white">Why Mondays?</span>
            <ConfidenceLabel count={data.mondayComparison.mondayTrades} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[10px] text-white/30 uppercase mb-1">Monday Avg P&L</div>
              <div className={'text-xl font-bold ' + (data.mondayComparison.mondayPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {data.mondayComparison.mondayPnl >= 0 ? '+' : ''}${data.mondayComparison.mondayPnl.toFixed(2)}
              </div>
              <div className="text-xs text-white/40">{data.mondayComparison.mondayTrades} trades · {data.mondayComparison.mondayWinRate}% win rate</div>
            </div>
            <div>
              <div className="text-[10px] text-white/30 uppercase mb-1">Other Days Avg P&L</div>
              <div className={'text-xl font-bold ' + (data.mondayComparison.otherDaysAvgPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {data.mondayComparison.otherDaysAvgPnl >= 0 ? '+' : ''}${data.mondayComparison.otherDaysAvgPnl.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Weekday Breakdown */}
      <Card>
        <div className="text-xs font-medium uppercase tracking-wider text-white/40 mb-3">Weekday Performance</div>
        <div className="space-y-2">
          {data.weekdays.map((w) => (
            <div key={w.day} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-white/80">{w.day}</span>
                <span className="text-xs text-white/40">{w.trades} trades</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className={w.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>{w.winRate}% WR</span>
                <span className={'font-mono font-semibold ' + (w.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {w.pnl >= 0 ? '+' : ''}{w.pnl.toFixed(2)}
                </span>
                {w.breaches > 0 && (
                  <span className="text-red-400/60">{w.breaches} breaches</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <ConfidenceLabel count={data.totalTrades} minSample={20} />
      </Card>
    </div>
  );
}

/* ─── Loss Attribution Tab ──── */

function AttributionTab({ data }) {
  if (!data) return <LoadingState />;
  if (data.error) return (
    <Card className="border-red-500/20">
      <div className="text-sm text-red-400">Error: {data.error}</div>
      <div className="text-xs text-white/40 mt-2">Try clicking "Re-evaluate All Trades" above.</div>
    </Card>
  );
  if (!data.categories || data.categories.length === 0) return <EmptyState message="No categorized losses in this period." />;

  const totalLoss = data.categories.reduce((sum, c) => sum + c.totalLoss, 0);

  return (
    <div className="space-y-3">
      <div className="text-xs text-white/40 mb-2">
        Total attributable loss: <span className="text-red-400 font-medium">-${totalLoss.toFixed(2)}</span>
      </div>
      {data.categories.map((cat) => (
        <Card key={cat.key}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-white">{cat.label}</div>
              <div className="mt-1 text-xs text-white/50">{cat.count} instances · {cat.trades.length} unique trades</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-400">-${cat.totalLoss.toFixed(2)}</div>
              {totalLoss > 0 && (
                <div className="text-[10px] text-white/30">{Math.round((cat.totalLoss / totalLoss) * 100)}% of total</div>
              )}
            </div>
          </div>
          <TradeList trades={cat.trades} />
        </Card>
      ))}
    </div>
  );
}

/* ─── AI Analysis Tab ──── */

function AITab({ preset }) {
  const [analysisType, setAnalysisType] = useState('overview');
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const AI_TYPES = [
    { key: 'overview', label: 'Overall Patterns' },
    { key: 'weekday_patterns', label: 'Weekday Analysis' },
    { key: 'rule_breaches', label: 'Rule Breach Patterns' },
    { key: 'loss_attribution', label: 'Loss Root Causes' },
    { key: 'setup_analysis', label: 'Setup Performance' },
  ];

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setExplanation(null);
    const result = await fetchAIExplanation(analysisType, preset);
    if (result.error) setError(result.error);
    else setExplanation(result.explanation);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✦</span>
          <span className="text-sm font-semibold text-white">AI Pattern Analysis</span>
        </div>
        <p className="text-xs text-white/50 mb-4">
          AI analyzes your verified analytics data to explain patterns, identify hidden correlations, and suggest your Next Focus.
          It only reads your aggregated stats — it never creates violations or modifies your data.
        </p>

        {/* Analysis type selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {AI_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => { setAnalysisType(t.key); setExplanation(null); setError(null); }}
              className={'rounded-lg px-3 py-1.5 text-xs font-medium transition-all ' +
                (analysisType === t.key
                  ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
                  : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/20 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze with AI'}
        </button>
      </Card>

      {error && (
        <Card className="border-red-500/20">
          <div className="text-sm text-red-400">{error}</div>
        </Card>
      )}

      {explanation && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <span className="text-xs font-medium uppercase tracking-wider text-white/40">AI Insights</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed whitespace-pre-wrap">
            {explanation}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Main Analytics Page ──── */

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview');
  const [preset, setPreset] = useState('all');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  const loadData = useCallback(async (t, p) => {
    setLoading(true);
    let result;
    switch (t) {
      case 'overview': result = await fetchAnalyticsOverview(p); break;
      case 'setups': result = await fetchSetupAnalytics(p); break;
      case 'breaches': result = await fetchRuleBreachAnalytics(p); break;
      case 'patterns': result = await fetchDayPatternAnalytics(p); break;
      case 'attribution': result = await fetchLossAttribution(p); break;
      case 'ai': result = null; break; // AI tab loads on demand
      default: result = null;
    }
    setData((prev) => ({ ...prev, [t + '_' + p]: result }));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tab !== 'ai') loadData(tab, preset);
  }, [tab, preset, loadData]);

  const cacheKey = tab + '_' + preset;
  const currentData = data[cacheKey] || null;

  async function handleBackfill() {
    setBackfilling(true);
    setBackfillResult(null);
    const result = await runBackfill();
    setBackfillResult(result);
    setBackfilling(false);
    // Reload current data
    setData({});
    loadData(tab, preset);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 pb-24 sm:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white sm:text-2xl">AI Analytics</h1>
        <p className="mt-1 text-sm text-white/50">
          Deep insights into your trading patterns, rule adherence, and areas for improvement.
        </p>
      </div>

      {/* Backfill Banner */}
      <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-white/60">
            <span className="font-medium text-violet-300">Auto-evaluation:</span> Trades are automatically cross-checked against your Rulebook rules.
            {backfillResult && (
              <span className="ml-2">
                <span className="text-emerald-400">
                  Evaluated {backfillResult.total} trades ({backfillResult.evaluated} checks)
                </span>
                {backfillResult.errors && backfillResult.errors.length > 0 && (
                  <span className="ml-2 text-red-400">
                    {backfillResult.errors.length} errors: {backfillResult.errors[0]}
                  </span>
                )}
                {backfillResult.debug && (
                  <span className="ml-2 text-white/30">
                    [DB: {backfillResult.debug.tradeCount} trades for user]
                  </span>
                )}
                {backfillResult.error && (
                  <span className="ml-2 text-red-400">{backfillResult.error}</span>
                )}
              </span>
            )}
          </div>
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-300 transition-all hover:bg-violet-500/30 disabled:opacity-50"
          >
            {backfilling ? 'Evaluating...' : 'Re-evaluate All Trades'}
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={'rounded-lg px-3 py-1.5 text-xs font-medium transition-all ' +
              (preset === p.key
                ? 'bg-white/10 text-white ring-1 ring-white/20'
                : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/70')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ' +
              (tab === t.key
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70')}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {loading && !currentData ? (
          <LoadingState />
        ) : (
          <>
            {tab === 'overview' && <OverviewTab data={currentData} />}
            {tab === 'setups' && <SetupsTab data={currentData} />}
            {tab === 'breaches' && <BreachesTab data={currentData} />}
            {tab === 'patterns' && <PatternsTab data={currentData} />}
            {tab === 'attribution' && <AttributionTab data={currentData} />}
            {tab === 'ai' && <AITab preset={preset} />}
          </>
        )}
      </div>
    </div>
  );
}
