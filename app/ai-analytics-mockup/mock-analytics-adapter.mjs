import { normalizeAnalyticsSession } from "../../lib/analytics-session.mjs";
import { loggedSetupStatus } from "../api/ai-analytics/local-data/rule-evidence.mjs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SESSIONS = ["Asian", "London", "New York"];
const SETUPS = [
  "London Breakout",
  "NY AM Momentum",
  "Trend Continuation",
  "Mean Reversion",
  "Opening Range",
  "Pullback Continuation",
  "Range Rejection",
  "Liquidity Sweep",
  "VWAP Reclaim",
  "Session Reversal",
  "Breakout Retest",
  "News Fade",
  "Gap Continuation",
  "Late Session Scalp",
];

function round(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percent(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function hashInt(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dateString(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

function addDays(value, amount) {
  const date = typeof value === "string" ? parseDate(value) : new Date(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateString(date);
}

function reportingToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function startOfWeek(value) {
  const date = parseDate(value);
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(value, -offset);
}

function monthBounds(value, offset = 0) {
  const date = parseDate(value);
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset + 1, 0));
  return { from: dateString(first), to: dateString(last) };
}

function getPeriodBounds(period, today) {
  if (period === "thisMonth") return { ...monthBounds(today), to: today };
  if (period === "thisWeek") return { from: startOfWeek(today), to: today };
  if (period === "lastWeek") {
    const thisMonday = startOfWeek(today);
    return { from: addDays(thisMonday, -7), to: addDays(thisMonday, -1) };
  }
  if (period === "lastMonth") return monthBounds(today, -1);
  return { from: null, to: null };
}

function getPreviousPeriodBounds(period, today) {
  if (period === "thisMonth") return monthBounds(today, -1);
  if (period === "thisWeek") return getPeriodBounds("lastWeek", today);
  if (period === "lastWeek") {
    const thisMonday = startOfWeek(today);
    return { from: addDays(thisMonday, -14), to: addDays(thisMonday, -8) };
  }
  if (period === "lastMonth") return monthBounds(today, -2);
  return { from: null, to: null };
}

function isCompletedTrade(trade) {
  // The logged P&L is the completion signal; opened_at/closed_at are not.
  // A reporting date is still required to place a trade in a timeframe.
  if (!trade?.trade_date || trade.pnl === null || trade.pnl === undefined || trade.pnl === "") return false;
  return Number.isFinite(Number(trade.pnl));
}

function generateMockTrades(today) {
  const trades = [];
  const firstDate = addDays(today, -420);
  for (let current = firstDate; current <= today; current = addDays(current, 1)) {
    const weekdayIndex = parseDate(current).getUTCDay();
    if (weekdayIndex === 0 || weekdayIndex === 6) continue;
    const daySeed = hashInt(current);
    if (daySeed % 9 === 0) continue;

    const tradeCount = 1 + (daySeed % 4);
    for (let tradeIndex = 0; tradeIndex < tradeCount; tradeIndex += 1) {
      const seed = hashInt(`${current}:${tradeIndex}`);
      const session = SESSIONS[(seed + tradeIndex) % SESSIONS.length];
      const setup = SETUPS[(seed + weekdayIndex * 3) % SETUPS.length];
      const outcomeRoll = seed % 100;
      const winThreshold = session === "London" ? 57 : session === "Asian" ? 54 : 49;
      let pnl = 0;
      if (outcomeRoll < winThreshold) pnl = 65 + (seed % 176);
      else if (outcomeRoll < 94) pnl = -(55 + (seed % 151));

      const evidenceRoll = hashInt(`${current}:${tradeIndex}:rules`) % 100;
      const evidenceStatus = evidenceRoll < 70 ? "clean" : evidenceRoll < 91 ? "broken" : "unknown";
      const setupRoll = hashInt(`${current}:${tradeIndex}:setup`) % 100;
      const setupFollowed = setupRoll < 78 ? "yes" : setupRoll < 91 ? "partial" : setupRoll < 97 ? "no" : null;

      trades.push({
        id: `mock-${current}-${tradeIndex + 1}`,
        trade_date: current,
        created_at: `${current}T${String(8 + tradeIndex * 2).padStart(2, "0")}:00:00Z`,
        pnl,
        session,
        setup,
        setup_ids: [setup],
        setup_follow_map: setupFollowed ? { [setup]: setupFollowed } : {},
        evidenceStatus,
        riskR: round(0.55 + (hashInt(`${current}:${tradeIndex}:risk`) % 51) / 100, 2),
      });
    }
  }
  return trades;
}

function filterBounds(trades, bounds) {
  return trades.filter((trade) =>
    isCompletedTrade(trade) &&
    (!bounds.from || trade.trade_date >= bounds.from) &&
    (!bounds.to || trade.trade_date <= bounds.to));
}

function filterPeriod(trades, period, today) {
  const { from, to } = getPeriodBounds(period, today);
  return trades.filter((trade) => isCompletedTrade(trade) && (!from || trade.trade_date >= from) && (!to || trade.trade_date <= to));
}

function groupBy(items, keyOf) {
  return items.reduce((groups, item) => {
    const key = keyOf(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function resultCounts(trades) {
  return trades.reduce((counts, trade) => {
    const pnl = Number(trade.pnl);
    if (pnl > 0) counts.wins += 1;
    else if (pnl < 0) counts.losses += 1;
    else counts.breakEven += 1;
    return counts;
  }, { wins: 0, losses: 0, breakEven: 0 });
}

function evidenceCounts(trades) {
  return trades.reduce((counts, trade) => {
    counts[trade.evidenceStatus] = (counts[trade.evidenceStatus] || 0) + 1;
    return counts;
  }, { clean: 0, partial: 0, broken: 0, unknown: 0 });
}

function setupReviewStatus(trade) {
  const status = trade.setupStatus || loggedSetupStatus(trade);
  return status === "followed" ? "yes" : ["partial", "broken"].includes(status) ? "no" : trade.setupFollowed || null;
}

function setupAdherence(trades) {
  const known = trades.map(setupReviewStatus).filter(Boolean);
  return known.length ? percent(known.filter((status) => status === "yes").length, known.length) : null;
}

function setupAdherenceForName(trades, setupName) {
  const valid = (value) => ["yes", "no", "partial"].includes(value);
  const known = trades.map((trade) => {
    const specific = trade.setup_follow_map?.[setupName];
    if (valid(specific)) return specific;
    const aggregate = trade.setupFollowed || trade.setup_followed;
    const names = [...new Set(trade.setupNames?.length ? trade.setupNames : String(trade.setup || "").split(",").map((name) => name.trim()).filter(Boolean))];
    // A global failure/partial cannot identify which of several tags failed.
    return valid(aggregate) && (aggregate === "yes" || names.length === 1) ? aggregate : null;
  }).filter(Boolean);
  return known.length ? percent(known.filter((status) => status === "yes").length, known.length) : null;
}

function dayEvidenceStatus(trades, includeDayRule = true) {
  if (includeDayRule && trades.some((trade) => trade.dayRuleBreach)) return "broken";
  if (trades.some((trade) => trade.evidenceStatus === "broken")) return "broken";
  if (trades.every((trade) => trade.evidenceStatus === "clean")) return "clean";
  if (trades.some((trade) => trade.evidenceStatus === "partial")) return "partial";
  return "unknown";
}

function inTradeOrder(trades) {
  // Backfilled trades can be created days after they were traded. A recorded
  // close time resolves same-day order; otherwise creation time is the fallback.
  return [...trades].sort((a, b) =>
    a.trade_date.localeCompare(b.trade_date) ||
    String(a.created_at || "").localeCompare(String(b.created_at || "")) ||
    String(a.id || "").localeCompare(String(b.id || "")));
}

function maxDrawdown(trades) {
  let running = 0;
  let peak = 0;
  let drawdown = 0;
  inTradeOrder(trades).forEach((trade) => {
    running += Number(trade.pnl);
    peak = Math.max(peak, running);
    drawdown = Math.max(drawdown, peak - running);
  });
  return round(drawdown, 2);
}

function postLossDiscipline(trades, contextTrades = trades) {
  const selectedIds = new Set(trades.map((trade) => trade.id));
  const accounts = groupBy(contextTrades, (trade) => trade.account_id || "none");
  const stats = { followed: 0, notFollowed: 0, unknown: 0, stopped: 0, loggedOrderFollowUps: 0, retrospective: 0 };
  const timestamp = (value) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
  for (const accountTrades of Object.values(accounts)) {
    for (const rows of Object.values(groupBy(accountTrades, (trade) => trade.trade_date))) {
      const times = rows.map((trade) => timestamp(trade.opened_at));
      const executionOrder = times.every((time) => time !== null) && new Set(times).size === rows.length;
      const ordered = executionOrder
        ? [...rows].sort((a, b) => timestamp(a.opened_at) - timestamp(b.opened_at))
        : inTradeOrder(rows);
      ordered.forEach((loss, index) => {
        if (Number(loss.pnl) >= 0 || !selectedIds.has(loss.id)) return;
        const next = ordered[index + 1];
        if (!next) { stats.stopped += 1; return; }
        if (!selectedIds.has(next.id)) return;
        if (!executionOrder) stats.loggedOrderFollowUps += 1;
        const setup = next.setupStatus || loggedSetupStatus(next);
        const lot = next.riskChecks?.find((check) => check.key === "maximum_lot_contract_size")
          || next.loggedRuleChecks?.find((check) => check.key === "maximum_lot_contract_size");
        if (lot?.retrospective) stats.retrospective += 1;
        if (["broken", "partial"].includes(setup) || ["broken", "partial"].includes(lot?.outcome)) stats.notFollowed += 1;
        else if (setup === "followed" && lot?.outcome === "followed") stats.followed += 1;
        else stats.unknown += 1;
      });
    }
  }
  const reviewed = stats.followed + stats.notFollowed;
  return { ...stats, reviewed, rate: reviewed ? percent(stats.followed, reviewed) : null };
}

function riskConsistency(trades) {
  const labels = { daily_loss_limit: "Daily loss limit", maximum_lot_contract_size: "Lot / contract size", maximum_trades_per_day: "Trades per day" };
  const breakdown = Object.entries(labels).map(([key, label]) => {
    const units = new Map();
    for (const trade of trades) {
      for (const check of trade.riskChecks || []) {
        if (check.key === key) units.set(check.unitKey, check);
      }
    }
    const checks = [...units.values()];
    const followed = checks.filter((check) => check.outcome === "followed").length;
    const broken = checks.filter((check) => check.outcome === "broken").length;
    const reviewed = followed + broken;
    return { key, label, followed, broken, reviewed, unknown: checks.length - reviewed, retrospective: checks.filter((check) => check.retrospective).length, rate: reviewed ? followed / reviewed * 100 : null };
  });
  const known = breakdown.filter((row) => row.rate !== null);
  return { breakdown, components: known.length, rate: known.length ? Math.round(known.reduce((sum, row) => sum + row.rate, 0) / known.length) : null };
}

function monthlyDayOutcomes(trades) {
  // A calendar date counts once across the selected accounts, representing
  // the trader's net result that day rather than separate account sessions.
  const days = Object.values(groupBy(trades, (trade) => trade.trade_date));
  const activeMonths = new Set(trades.map((trade) => trade.trade_date.slice(0, 7))).size;
  const totals = days.map((day) => day.reduce((sum, trade) => sum + Math.round(Number(trade.pnl) * 100), 0));
  const counts = [totals.filter((pnl) => pnl > 0).length, totals.filter((pnl) => pnl < 0).length, totals.filter((pnl) => pnl === 0).length];
  if (!activeMonths) return { activeMonths: 0, tradedDays: 0, profitableDays: 0, losingDays: 0, breakEvenDays: 0, averageTradedDays: null, averageProfitableDays: null, averageLosingDays: null, averageBreakEvenDays: null, winDayRate: null };
  const averageTradedDays = Math.round(days.length / activeMonths);
  // Round the three outcome counts together so they equal the displayed
  // traded-day average. Integer remainders keep ties deterministic.
  const averages = counts.map((count) => Math.floor(count / activeMonths));
  const order = counts.map((count, index) => ({ index, remainder: count % activeMonths })).sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const remaining = averageTradedDays - averages.reduce((sum, count) => sum + count, 0);
  for (let index = 0; index < remaining; index += 1) averages[order[index].index] += 1;
  return { activeMonths, tradedDays: days.length, profitableDays: counts[0], losingDays: counts[1], breakEvenDays: counts[2], averageTradedDays, averageProfitableDays: averages[0], averageLosingDays: averages[1], averageBreakEvenDays: averages[2], winDayRate: percent(counts[0], days.length) };
}

function buildSummary(trades, contextTrades = trades) {
  const setupCounts = trades.reduce((counts, trade) => {
    const status = trade.setupStatus || loggedSetupStatus(trade);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { followed: 0, partial: 0, broken: 0, unknown: 0 });
  const ruleCounts = trades.reduce((counts, trade) => {
    const status = trade.ruleStatus || (trade.id?.startsWith("mock-") ? trade.evidenceStatus : "unknown");
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, { followed: 0, clean: 0, partial: 0, broken: 0, unknown: 0 });
  const outcomes = resultCounts(trades);
  const grossProfitCents = trades.filter((trade) => Number(trade.pnl) > 0).reduce((sum, trade) => sum + Math.round(Number(trade.pnl) * 100), 0);
  const grossLossCents = trades.filter((trade) => Number(trade.pnl) < 0).reduce((sum, trade) => sum + Math.abs(Math.round(Number(trade.pnl) * 100)), 0);
  const conclusive = ruleCounts.followed + ruleCounts.clean + ruleCounts.partial + ruleCounts.broken;
  const hasRuleChecks = trades.some((trade) => Array.isArray(trade.loggedRuleChecks));
  const ruleChecks = trades.flatMap((trade) => trade.loggedRuleChecks || []);
  const checkCounts = ruleChecks.reduce((counts, check) => {
    counts[check.outcome] = (counts[check.outcome] || 0) + 1;
    return counts;
  }, { followed: 0, partial: 0, broken: 0, unknown: 0 });
  const checked = checkCounts.followed + checkCounts.partial + checkCounts.broken;
  const ruleRate = hasRuleChecks
    ? checked ? percent(checkCounts.followed, checked) : null
    : conclusive ? percent(ruleCounts.followed + ruleCounts.clean, conclusive) : null;
  const ruleCheckBreakdown = [...new Set(ruleChecks.map((check) => check.key))].map((key) => ({
    key,
    ...ruleChecks.filter((check) => check.key === key).reduce((counts, check) => {
      counts[check.outcome] = (counts[check.outcome] || 0) + 1;
      return counts;
    }, { followed: 0, partial: 0, broken: 0, unknown: 0 }),
  }));
  const setupRate = setupAdherence(trades);
  const risk = riskConsistency(trades);
  const postLoss = postLossDiscipline(trades, contextTrades);
  const riskRate = risk.rate;
  const postLossRate = postLoss.rate;
  const disciplineInputs = [
    { key: "rules", label: "Rule adherence", value: ruleRate, weight: 35 },
    { key: "setup", label: "Setup adherence", value: setupRate, weight: 20 },
    { key: "risk", label: "Risk consistency", value: riskRate, weight: 20 },
    { key: "postLoss", label: "Post-loss discipline", value: postLossRate, weight: 25 },
  ];
  const availableComponents = disciplineInputs.filter(({ value }) => Number.isFinite(value));
  // Rule and setup evidence are required. Missing components are omitted,
  // with the available weights rescaled; they never become zero or a pass.
  const canScore = Number.isFinite(ruleRate) && Number.isFinite(setupRate);
  const availableWeight = availableComponents.reduce((sum, item) => sum + item.weight, 0);
  const disciplineScore = canScore
    ? Math.round(availableComponents.reduce((sum, item) => sum + item.value * item.weight, 0) / availableWeight)
    : null;
  const disciplineProvisional = canScore && (availableComponents.length < 4 || risk.components < 3 || risk.breakdown.some((row) => row.unknown > 0) || postLoss.unknown > 0 || postLoss.loggedOrderFollowUps > 0 || postLoss.retrospective > 0 || setupCounts.unknown > 0 || (hasRuleChecks && checkCounts.unknown > 0));
  return {
    totalTrades: trades.length,
    wins: outcomes.wins,
    losses: outcomes.losses,
    breakEven: outcomes.breakEven,
    averageWin: outcomes.wins ? round(grossProfitCents / outcomes.wins / 100, 2) : null,
    averageLoss: outcomes.losses ? -round(grossLossCents / outcomes.losses / 100, 2) : null,
    monthlyDays: monthlyDayOutcomes(trades),
    grossProfit: grossProfitCents / 100,
    grossLoss: grossLossCents / 100,
    profitFactor: grossLossCents ? round(grossProfitCents / grossLossCents, 2) : null,
    clean: setupCounts.followed,
    partial: setupCounts.partial,
    notFollowed: setupCounts.broken,
    needsEvidence: setupCounts.unknown,
    ruleAdherence: ruleRate,
    ruleReviewed: conclusive,
    ruleCheckCounts: hasRuleChecks ? { ...checkCounts, checked } : null,
    ruleCheckBreakdown,
    retrospectiveRuleChecks: ruleChecks.filter((check) => check.retrospective).length,
    setupAdherence: setupRate,
    setupReviewed: trades.filter((trade) => setupReviewStatus(trade) !== null).length,
    riskConsistency: riskRate,
    riskConsistencyBreakdown: risk.breakdown,
    riskConsistencyComponents: risk.components,
    postLossDiscipline: postLossRate,
    postLossEvidence: postLoss,
    discipline: disciplineScore,
    disciplineProvisional,
    disciplineComponents: availableComponents,
    disciplineMissing: disciplineInputs.filter(({ value }) => !Number.isFinite(value)).map(({ label }) => label),
    netPnl: round(trades.reduce((sum, trade) => sum + Number(trade.pnl), 0), 2),
    winRate: percent(outcomes.wins, trades.length),
    maxDrawdown: maxDrawdown(trades),
  };
}

function executionGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function sampleConfidence(trades) {
  if (trades >= 30) return "Established";
  if (trades >= 10) return "Developing";
  return "Provisional";
}

function outcomeMixPerTen(outcomes) {
  const values = [outcomes.wins, outcomes.losses, outcomes.breakEven];
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) return { wins: 0, losses: 0, breakEven: 0 };
  const exact = values.map((value) => value / total * 10);
  const result = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, remainder: value - result[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const remaining = 10 - result.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < remaining; index += 1) {
    result[order[index].index] += 1;
  }
  return { wins: result[0], losses: result[1], breakEven: result[2] };
}

function maxStreaks(trades) {
  let win = 0;
  let loss = 0;
  let maxWin = 0;
  let maxLoss = 0;
  const closedTimes = trades.map((trade) => Date.parse(trade.closed_at || ""));
  const recordedOrder = closedTimes.every(Number.isFinite) && new Set(closedTimes).size === trades.length;
  const ordered = recordedOrder ? [...trades].sort((a, b) => Date.parse(a.closed_at) - Date.parse(b.closed_at)) : inTradeOrder(trades);
  ordered.forEach((trade) => {
    if (Number(trade.pnl) > 0) {
      win += 1;
      loss = 0;
      maxWin = Math.max(maxWin, win);
    } else if (Number(trade.pnl) < 0) {
      loss += 1;
      win = 0;
      maxLoss = Math.max(maxLoss, loss);
    } else {
      win = 0;
      loss = 0;
    }
  });
  return { maxWinStreak: maxWin, maxLossStreak: maxLoss, streakOrder: recordedOrder ? "Recorded close times" : "Saved log order" };
}

function buildSetups(trades, setupNames = SETUPS) {
  return setupNames.map((name) => {
    const setupTrades = trades.filter((trade) => trade.setup === name || trade.setupNames?.includes(name));
    const outcomes = resultCounts(setupTrades);
    const evidence = evidenceCounts(setupTrades);
    const positive = setupTrades.filter((trade) => Number(trade.pnl) > 0);
    const negative = setupTrades.filter((trade) => Number(trade.pnl) < 0);
    const setupRate = setupAdherenceForName(setupTrades, name);
    const cleanEvidence = evidence.clean + evidence.partial + evidence.broken;
    const cleanRate = cleanEvidence && evidence.unknown === 0 ? percent(evidence.clean, cleanEvidence) : null;
    const score = setupRate !== null && cleanRate !== null
      ? Math.round(setupRate * 0.6 + cleanRate * 0.4)
      : null;
    return {
      name,
      trades: setupTrades.length,
      ...outcomes,
      avgWin: averageCurrency(tradePnlCents(positive), positive.length),
      avgLoss: averageCurrency(tradePnlCents(negative), negative.length),
      ...maxStreaks(setupTrades),
      setupAdherence: setupRate,
      cleanTradeRate: cleanRate,
      avgRisk: setupTrades.some((trade) => Number.isFinite(Number(trade.riskR)) && Number(trade.riskR) > 0)
        ? `${round(setupTrades.filter((trade) => Number.isFinite(Number(trade.riskR)) && Number(trade.riskR) > 0).reduce((sum, trade) => sum + Number(trade.riskR), 0) / setupTrades.filter((trade) => Number.isFinite(Number(trade.riskR)) && Number(trade.riskR) > 0).length, 2).toFixed(2)}R`
        : "—",
      pnl: tradePnlCents(setupTrades) / 100,
      executionScore: score,
      executionGrade: score === null ? null : executionGrade(score),
      historicalWinRate: percent(outcomes.wins, setupTrades.length),
      sampleConfidence: sampleConfidence(setupTrades.length),
      outcomeMix: outcomeMixPerTen(outcomes),
      needsEvidence: evidence.unknown,
    };
  }).filter((setup) => setup.trades > 0);
}

export function compareSetupEvidence(a, b) {
  const rank = { Established: 3, Developing: 2, Provisional: 1 };
  return (rank[b.sampleConfidence] || 0) - (rank[a.sampleConfidence] || 0)
    || Number(Number.isFinite(b.executionScore)) - Number(Number.isFinite(a.executionScore))
    || (b.executionScore ?? -1) - (a.executionScore ?? -1)
    || b.trades - a.trades || a.name.localeCompare(b.name);
}

function withDeltas(summary, previous) {
  const keys = ["totalTrades", "clean", "partial", "notFollowed", "needsEvidence", "discipline", "ruleAdherence", "setupAdherence", "riskConsistency", "postLossDiscipline"];
  return keys.reduce((result, key) => ({
    ...result,
    [`${key}Delta`]: previous && Number.isFinite(summary[key]) && Number.isFinite(previous[key])
      && (key !== "discipline" || (summary.disciplineComponents.map(({ key }) => key).join(",") === previous.disciplineComponents.map(({ key }) => key).join(",") && summary.disciplineProvisional === previous.disciplineProvisional))
      ? summary[key] - previous[key]
      : null,
  }), { ...summary });
}

function tradePnlCents(trades) {
  return trades.reduce((sum, trade) => sum + Math.round(Number(trade.pnl) * 100), 0);
}

function averageCurrency(totalCents, count) {
  if (!count) return null;
  const cents = totalCents / count;
  return Math.sign(cents) * Math.round(Math.abs(cents)) / 100;
}

function buildSessionRows(trades, weekdayTotal) {
  return [...SESSIONS, "Unassigned"].map((name) => {
    const sessionTrades = trades.filter((trade) => (trade.session || "Unassigned") === name);
    if (!sessionTrades.length) return { name, trades: 0, occurrences: 0, wins: 0, losses: 0, breakEven: 0, totalPnl: null, share: null, winRate: null, averagePnl: null };
    const outcomes = resultCounts(sessionTrades);
    const occurrences = Object.values(groupBy(sessionTrades, (trade) => trade.trade_date));
    return {
      name,
      trades: sessionTrades.length,
      occurrences: occurrences.length,
      ...outcomes,
      totalPnl: tradePnlCents(sessionTrades) / 100,
      share: percent(sessionTrades.length, weekdayTotal),
      winRate: percent(outcomes.wins, sessionTrades.length),
      averagePnl: averageCurrency(tradePnlCents(sessionTrades), occurrences.length),
    };
  });
}

function buildWeekdays(selectedTrades, allTrades) {
  const selectedByDay = groupBy(selectedTrades, (trade) => DAY_NAMES[parseDate(trade.trade_date).getUTCDay()]);
  const allByDay = groupBy(allTrades, (trade) => DAY_NAMES[parseDate(trade.trade_date).getUTCDay()]);
  const details = {};
  const days = WEEKDAYS.map((day) => {
    const trades = selectedByDay[day] || [];
    const allDayTrades = allByDay[day] || [];
    const dailyGroups = Object.values(groupBy(trades, (trade) => trade.trade_date));
    const dailyCents = dailyGroups.map(tradePnlCents);
    const dailyPnls = dailyCents.map((cents) => cents / 100);
    const outcomes = resultCounts(trades);
    const evidence = evidenceCounts(trades);
    const allEvidence = evidenceCounts(allDayTrades);
    const setupCounts = trades.reduce((counts, trade) => {
      const names = trade.setupNames?.length ? trade.setupNames : [trade.setup];
      names.filter((name) => name && name !== "No Setup").forEach((name) => {
        counts[name] = (counts[name] || 0) + 1;
      });
      return counts;
    }, {});
    const [topSetup = "No logged setup", topSetupCount = 0] = Object.entries(setupCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || [];
    const distributionCounts = dailyGroups.reduce((counts, rows) => {
      counts[Math.min(rows.length, 3) - 1] += 1;
      return counts;
    }, [0, 0, 0]);
    const conclusive = evidence.clean + evidence.partial + evidence.broken;
    const allConclusive = allEvidence.clean + allEvidence.partial + allEvidence.broken;
    const positive = trades.filter((trade) => Number(trade.pnl) > 0);
    const negative = trades.filter((trade) => Number(trade.pnl) < 0);
    const totalCents = tradePnlCents(trades);
    const totalPnl = trades.length ? totalCents / 100 : null;
    const tradingDays = dailyGroups.length;
    details[day] = {
      tradingDays,
      ...outcomes,
      averageDayPnl: averageCurrency(totalCents, tradingDays),
      medianDayPnl: tradingDays ? averageCurrency(median(dailyCents), 1) : null,
      greenDayRate: tradingDays ? percent(dailyPnls.filter((pnl) => pnl > 0).length, tradingDays) : null,
      tradeWinRate: trades.length ? percent(outcomes.wins, trades.length) : null,
      setupAdherence: setupAdherence(trades),
      averageWin: averageCurrency(tradePnlCents(positive), positive.length),
      averageLoss: averageCurrency(tradePnlCents(negative), negative.length),
      totalPnl,
      setupTrades: topSetupCount,
      setupShare: trades.length ? percent(topSetupCount, trades.length) : null,
      averageTradesPerDay: tradingDays ? round(trades.length / tradingDays, 1) : null,
      distribution: distributionCounts.map((count) => tradingDays ? percent(count, tradingDays) : null),
      sessions: buildSessionRows(trades, trades.length),
      insufficientEvidence: evidence.unknown,
    };
    return {
      day,
      month: conclusive && evidence.unknown === 0 ? percent(evidence.clean, conclusive) : null,
      all: allConclusive && allEvidence.unknown === 0 ? percent(allEvidence.clean, allConclusive) : null,
      selectedPnl: totalPnl,
      allPnl: allDayTrades.length ? tradePnlCents(allDayTrades) / 100 : null,
      selectedWinRate: trades.length ? percent(outcomes.wins, trades.length) : null,
      allWinRate: allDayTrades.length ? percent(resultCounts(allDayTrades).wins, allDayTrades.length) : null,
      selectedSetupAdherence: setupAdherence(trades),
      allSetupAdherence: setupAdherence(allDayTrades),
      trades: trades.length,
      clean: evidence.clean,
      partial: evidence.partial,
      breached: evidence.broken,
      unknown: evidence.unknown,
      setup: topSetup,
    };
  });
  return { days, details };
}

function bucketKey(count) {
  return count === 1 ? "one" : count === 2 ? "two" : "three-plus";
}

const BUCKET_META = {
  one: { label: "1-trade", sessionLabel: "1 trade", dayDescription: "1-trade days", exampleLabel: "a 1-trade day" },
  two: { label: "2-trades", sessionLabel: "2 trades", dayDescription: "2-trade days", exampleLabel: "a 2-trade day" },
  "three-plus": { label: "3+ trades", sessionLabel: "3+ trades", dayDescription: "3+ trade days", exampleLabel: "a 3+ trade day" },
};

function buildFrequency(trades) {
  const dayGroups = Object.values(groupBy(trades, (trade) => `${trade.account_id || "unassigned"}|${trade.trade_date}`));
  // Average over calendar months that actually contain a completed trade.
  // A partial current month counts as one observed month, not a projection.
  const activeMonths = new Set(trades.map((trade) => trade.trade_date.slice(0, 7))).size;
  const rows = ["one", "two", "three-plus"].map((key) => {
    const groups = dayGroups.filter((rowsForDay) => bucketKey(rowsForDay.length) === key);
    const pnlCents = groups.map(tradePnlCents);
    const statuses = groups.map(dayEvidenceStatus);
    const cleanDays = statuses.filter((status) => status === "clean").length;
    const breachedDays = statuses.filter((status) => status === "broken").length;
    const conclusiveDays = statuses.filter((status) => status !== "unknown").length;
    return {
      key,
      label: BUCKET_META[key].label,
      dayDescription: BUCKET_META[key].dayDescription,
      exampleLabel: BUCKET_META[key].exampleLabel,
      averageDays: activeMonths ? groups.length / activeMonths : null,
      share: dayGroups.length ? percent(groups.length, dayGroups.length) : null,
      sampleDays: groups.length,
      green: groups.length ? percent(pnlCents.filter((pnl) => pnl > 0).length, groups.length) : null,
      red: groups.length ? percent(pnlCents.filter((pnl) => pnl < 0).length, groups.length) : null,
      breakEven: groups.length ? percent(pnlCents.filter((pnl) => pnl === 0).length, groups.length) : null,
      averagePnl: averageCurrency(pnlCents.reduce((sum, pnl) => sum + pnl, 0), groups.length),
      medianPnl: groups.length ? averageCurrency(median(pnlCents), 1) : null,
      cleanDayRate: conclusiveDays === groups.length && conclusiveDays > 0 ? percent(cleanDays, conclusiveDays) : null,
      setupRate: setupAdherence(groups.flat()),
      breachDayRate: conclusiveDays ? percent(breachedDays, groups.length) : null,
    };
  });
  return { completedDays: dayGroups.length, activeMonths, rows };
}

function buildSessionFrequency(trades) {
  const result = {};
  ["All sessions", ...SESSIONS, "Unassigned"].forEach((sessionName) => {
    const sessionTrades = sessionName === "All sessions" ? trades : trades.filter((trade) => (trade.session || "Unassigned") === sessionName);
    const occurrences = Object.values(groupBy(sessionTrades, (trade) => `${trade.account_id || "unassigned"}|${trade.trade_date}|${trade.session || "Unassigned"}`));
    result[sessionName] = ["one", "two", "three-plus"].map((key) => {
      const groups = occurrences.filter((rows) => bucketKey(rows.length) === key);
      const pnlCents = groups.map(tradePnlCents);
      const statuses = groups.map((rows) => dayEvidenceStatus(rows, false));
      const conclusive = statuses.filter((status) => status !== "unknown");
      const clean = statuses.filter((status) => status === "clean");
      return {
        key,
        label: BUCKET_META[key].sessionLabel,
        occurrences: groups.length,
        winRate: groups.length ? percent(pnlCents.filter((pnl) => pnl > 0).length, groups.length) : null,
        averagePnl: averageCurrency(pnlCents.reduce((sum, pnl) => sum + pnl, 0), groups.length),
        cleanRate: groups.length > 0 && conclusive.length === groups.length ? percent(clean.length, groups.length) : null,
      };
    });
  });
  return result;
}

const cache = new Map();

export function buildMockPeriodAnalytics(period, today = reportingToday()) {
  const cacheKey = `${today}:${period}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const allTrades = generateMockTrades(today).filter(isCompletedTrade);
  const selectedTrades = filterPeriod(allTrades, period, today);
  const previousTrades = period === "all" ? null : filterBounds(allTrades, getPreviousPeriodBounds(period, today));
  const weekdays = buildWeekdays(selectedTrades, allTrades);
  const summary = buildSummary(selectedTrades, allTrades);
  const result = {
    source: "mock",
    trades: selectedTrades,
    summary: withDeltas(summary, previousTrades ? buildSummary(previousTrades, allTrades) : null),
    setups: buildSetups(selectedTrades),
    days: weekdays.days,
    weekdayDetails: weekdays.details,
    frequency: buildFrequency(selectedTrades),
    sessionFrequency: buildSessionFrequency(selectedTrades),
  };
  cache.set(cacheKey, result);
  return result;
}

export function buildPeriodAnalyticsFromTrades(inputTrades, period, today = reportingToday(), setupNames = []) {
  const allTrades = (inputTrades || []).filter(isCompletedTrade).map((trade) => ({ ...trade, session: normalizeAnalyticsSession(trade.session) }));
  const selectedTrades = filterPeriod(allTrades, period, today);
  const previousTrades = period === "all" ? null : filterBounds(allTrades, getPreviousPeriodBounds(period, today));
  const weekdays = buildWeekdays(selectedTrades, allTrades);
  const summary = buildSummary(selectedTrades, allTrades);
  const observedSetupNames = [...new Set(allTrades.flatMap((trade) => trade.setupNames?.length ? trade.setupNames : [trade.setup]).filter((name) => name && name !== "No Setup"))];
  const names = [...new Set([...(setupNames || []), ...observedSetupNames])];
  return {
    source: "account",
    trades: selectedTrades,
    summary: withDeltas(summary, previousTrades ? buildSummary(previousTrades, allTrades) : null),
    setups: buildSetups(selectedTrades, names),
    days: weekdays.days,
    weekdayDetails: weekdays.details,
    frequency: buildFrequency(selectedTrades),
    sessionFrequency: buildSessionFrequency(selectedTrades),
  };
}

export const mockAnalyticsInternals = {
  isCompletedTrade,
  getPeriodBounds,
  resultCounts,
  dayEvidenceStatus,
  outcomeMixPerTen,
  executionGrade,
  sampleConfidence,
};

export function setupComposition(summary) {
  const counts = [summary.clean, summary.partial, summary.notFollowed, summary.needsEvidence].map((value) => Math.max(0, Number(value) || 0));
  const total = Number(summary.totalTrades) || 0;
  const exact = counts.map((count) => total > 0 ? count / total * 100 : 0);
  const rounded = exact.map(Math.floor);
  if (total > 0 && counts.reduce((sum, count) => sum + count, 0) === total) {
    const order = exact.map((share, index) => ({ index, remainder: share - rounded[index] })).sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    const remaining = 100 - rounded.reduce((sum, share) => sum + share, 0);
    for (let index = 0; index < remaining; index += 1) rounded[order[index].index] += 1;
  }
  let start = 0;
  return counts.map((count, index) => {
    const segment = { count, share: exact[index], percent: rounded[index], start };
    start += exact[index];
    return segment;
  });
}
