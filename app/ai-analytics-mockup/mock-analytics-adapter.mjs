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
    counts[trade.evidenceStatus] += 1;
    return counts;
  }, { clean: 0, broken: 0, unknown: 0 });
}

function setupAdherence(trades) {
  const known = trades.filter((trade) => trade.setup_follow_map?.[trade.setup]);
  return percent(known.filter((trade) => trade.setup_follow_map[trade.setup] === "yes").length, known.length);
}

function dayEvidenceStatus(trades) {
  if (trades.some((trade) => trade.evidenceStatus === "broken")) return "broken";
  if (trades.every((trade) => trade.evidenceStatus === "clean")) return "clean";
  return "unknown";
}

function maxDrawdown(trades) {
  let running = 0;
  let peak = 0;
  let drawdown = 0;
  [...trades]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .forEach((trade) => {
      running += Number(trade.pnl);
      peak = Math.max(peak, running);
      drawdown = Math.max(drawdown, peak - running);
    });
  return Math.round(drawdown);
}

function postLossDiscipline(trades) {
  const ordered = [...trades].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const followUps = [];
  for (let index = 1; index < ordered.length; index += 1) {
    if (Number(ordered[index - 1].pnl) < 0 && ordered[index].evidenceStatus !== "unknown") {
      followUps.push(ordered[index]);
    }
  }
  return percent(followUps.filter((trade) => trade.evidenceStatus === "clean").length, followUps.length);
}

function riskConsistency(trades) {
  if (!trades.length) return 0;
  const values = trades.map((trade) => trade.riskR);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.max(0, Math.min(100, Math.round((1 - Math.sqrt(variance) / average) * 100)));
}

function buildSummary(trades) {
  const evidence = evidenceCounts(trades);
  const outcomes = resultCounts(trades);
  const conclusive = evidence.clean + evidence.broken;
  const ruleRate = percent(evidence.clean, conclusive);
  const setupRate = setupAdherence(trades);
  const riskRate = riskConsistency(trades);
  const postLossRate = postLossDiscipline(trades);
  return {
    totalTrades: trades.length,
    clean: evidence.clean,
    notFollowed: evidence.broken,
    needsEvidence: evidence.unknown,
    ruleAdherence: ruleRate,
    setupAdherence: setupRate,
    riskConsistency: riskRate,
    postLossDiscipline: postLossRate,
    discipline: Math.round(ruleRate * 0.35 + setupRate * 0.2 + riskRate * 0.2 + postLossRate * 0.25),
    netPnl: Math.round(trades.reduce((sum, trade) => sum + Number(trade.pnl), 0)),
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
  [...trades].sort((a, b) => a.created_at.localeCompare(b.created_at)).forEach((trade) => {
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
  return { maxWinStreak: maxWin, maxLossStreak: maxLoss };
}

function buildSetups(trades) {
  return SETUPS.map((name) => {
    const setupTrades = trades.filter((trade) => trade.setup === name);
    const outcomes = resultCounts(setupTrades);
    const evidence = evidenceCounts(setupTrades);
    const positive = setupTrades.filter((trade) => Number(trade.pnl) > 0);
    const negative = setupTrades.filter((trade) => Number(trade.pnl) < 0);
    const setupRate = setupAdherence(setupTrades);
    const cleanRate = percent(evidence.clean, evidence.clean + evidence.broken);
    const score = Math.round(setupRate * 0.6 + cleanRate * 0.4);
    return {
      name,
      trades: setupTrades.length,
      ...outcomes,
      avgWin: positive.length ? Math.round(positive.reduce((sum, trade) => sum + Number(trade.pnl), 0) / positive.length) : 0,
      avgLoss: negative.length ? Math.round(negative.reduce((sum, trade) => sum + Number(trade.pnl), 0) / negative.length) : 0,
      ...maxStreaks(setupTrades),
      setupAdherence: setupRate,
      cleanTradeRate: cleanRate,
      avgRisk: setupTrades.length ? `${round(setupTrades.reduce((sum, trade) => sum + trade.riskR, 0) / setupTrades.length, 2).toFixed(2)}R` : "—",
      pnl: Math.round(setupTrades.reduce((sum, trade) => sum + Number(trade.pnl), 0)),
      executionScore: score,
      executionGrade: executionGrade(score),
      historicalWinRate: percent(outcomes.wins, setupTrades.length),
      sampleConfidence: sampleConfidence(setupTrades.length),
      outcomeMix: outcomeMixPerTen(outcomes),
      needsEvidence: evidence.unknown,
    };
  });
}

function withDeltas(summary, previous) {
  const keys = ["totalTrades", "clean", "notFollowed", "needsEvidence", "discipline", "ruleAdherence", "setupAdherence", "riskConsistency", "postLossDiscipline"];
  return keys.reduce((result, key) => ({ ...result, [`${key}Delta`]: previous ? summary[key] - previous[key] : null }), { ...summary });
}

function buildSessionRows(trades, weekdayTotal) {
  return [...SESSIONS, "Unassigned"].map((name) => {
    const sessionTrades = trades.filter((trade) => (trade.session || "Unassigned") === name);
    if (!sessionTrades.length) return { name, trades: 0, occurrences: 0, share: 0, winRate: null, averagePnl: null };
    const outcomes = resultCounts(sessionTrades);
    const occurrences = Object.values(groupBy(sessionTrades, (trade) => trade.trade_date));
    return {
      name,
      trades: sessionTrades.length,
      occurrences: occurrences.length,
      share: percent(sessionTrades.length, weekdayTotal),
      winRate: percent(outcomes.wins, sessionTrades.length),
      averagePnl: Math.round(occurrences.reduce((sum, rows) => sum + rows.reduce((daySum, trade) => daySum + Number(trade.pnl), 0), 0) / occurrences.length),
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
    const dailyPnls = dailyGroups.map((rows) => rows.reduce((sum, trade) => sum + Number(trade.pnl), 0));
    const outcomes = resultCounts(trades);
    const evidence = evidenceCounts(trades);
    const allEvidence = evidenceCounts(allDayTrades);
    const setupCounts = trades.reduce((counts, trade) => {
      counts[trade.setup] = (counts[trade.setup] || 0) + 1;
      return counts;
    }, {});
    const [topSetup = "No logged setup", topSetupCount = 0] = Object.entries(setupCounts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || [];
    const distributionCounts = dailyGroups.reduce((counts, rows) => {
      counts[Math.min(rows.length, 3) - 1] += 1;
      return counts;
    }, [0, 0, 0]);
    const conclusive = evidence.clean + evidence.broken;
    const allConclusive = allEvidence.clean + allEvidence.broken;
    const positive = trades.filter((trade) => Number(trade.pnl) > 0).map((trade) => Number(trade.pnl));
    const negative = trades.filter((trade) => Number(trade.pnl) < 0).map((trade) => Number(trade.pnl));
    const totalPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl), 0);
    const tradingDays = dailyGroups.length;
    details[day] = {
      tradingDays,
      averageDayPnl: tradingDays ? Math.round(totalPnl / tradingDays) : 0,
      medianDayPnl: Math.round(median(dailyPnls)),
      greenDayRate: percent(dailyPnls.filter((pnl) => pnl > 0).length, tradingDays),
      tradeWinRate: percent(outcomes.wins, trades.length),
      setupAdherence: setupAdherence(trades),
      averageWin: positive.length ? Math.round(positive.reduce((sum, pnl) => sum + pnl, 0) / positive.length) : 0,
      averageLoss: negative.length ? Math.round(negative.reduce((sum, pnl) => sum + pnl, 0) / negative.length) : 0,
      totalPnl: Math.round(totalPnl),
      setupTrades: topSetupCount,
      setupShare: percent(topSetupCount, trades.length),
      averageTradesPerDay: tradingDays ? round(trades.length / tradingDays, 1) : 0,
      distribution: distributionCounts.map((count) => percent(count, tradingDays)),
      sessions: buildSessionRows(trades, trades.length),
      insufficientEvidence: evidence.unknown,
    };
    return {
      day,
      month: percent(evidence.clean, conclusive),
      all: percent(allEvidence.clean, allConclusive),
      trades: trades.length,
      clean: evidence.clean,
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
  const dayGroups = Object.values(groupBy(trades, (trade) => trade.trade_date));
  // Normalise partial periods to an 18-active-day trading month, matching the
  // product question: "how many of these days do I usually take in a month?"
  const activeMonths = Math.max(round(dayGroups.length / 18, 2), 0.01);
  const rows = ["one", "two", "three-plus"].map((key) => {
    const groups = dayGroups.filter((rowsForDay) => bucketKey(rowsForDay.length) === key);
    const pnls = groups.map((rowsForDay) => rowsForDay.reduce((sum, trade) => sum + Number(trade.pnl), 0));
    const statuses = groups.map(dayEvidenceStatus);
    const cleanDays = statuses.filter((status) => status === "clean").length;
    const breachedDays = statuses.filter((status) => status === "broken").length;
    const conclusiveDays = statuses.filter((status) => status !== "unknown").length;
    return {
      key,
      label: BUCKET_META[key].label,
      dayDescription: BUCKET_META[key].dayDescription,
      exampleLabel: BUCKET_META[key].exampleLabel,
      averageDays: groups.length / activeMonths,
      share: percent(groups.length, dayGroups.length),
      sampleDays: groups.length,
      green: percent(pnls.filter((pnl) => pnl > 0).length, groups.length),
      red: percent(pnls.filter((pnl) => pnl < 0).length, groups.length),
      breakEven: percent(pnls.filter((pnl) => pnl === 0).length, groups.length),
      averagePnl: groups.length ? Math.round(pnls.reduce((sum, pnl) => sum + pnl, 0) / groups.length) : 0,
      medianPnl: Math.round(median(pnls)),
      cleanDayRate: percent(cleanDays, conclusiveDays),
      setupRate: setupAdherence(groups.flat()),
      breachDayRate: percent(breachedDays, groups.length),
    };
  });
  return { completedDays: dayGroups.length, activeMonths, rows };
}

function buildSessionFrequency(trades) {
  const result = {};
  ["All sessions", ...SESSIONS].forEach((sessionName) => {
    const sessionTrades = sessionName === "All sessions" ? trades : trades.filter((trade) => trade.session === sessionName);
    const occurrences = Object.values(groupBy(sessionTrades, (trade) => `${trade.trade_date}|${trade.session || "Unassigned"}`));
    result[sessionName] = ["one", "two", "three-plus"].map((key) => {
      const groups = occurrences.filter((rows) => bucketKey(rows.length) === key);
      const pnls = groups.map((rows) => rows.reduce((sum, trade) => sum + Number(trade.pnl), 0));
      const statuses = groups.map(dayEvidenceStatus);
      const conclusive = statuses.filter((status) => status !== "unknown");
      const clean = statuses.filter((status) => status === "clean");
      return {
        key,
        label: BUCKET_META[key].sessionLabel,
        occurrences: groups.length,
        winRate: percent(pnls.filter((pnl) => pnl > 0).length, groups.length),
        averagePnl: groups.length ? Math.round(pnls.reduce((sum, pnl) => sum + pnl, 0) / groups.length) : 0,
        cleanRate: percent(clean.length, conclusive.length),
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
  const summary = buildSummary(selectedTrades);
  const result = {
    trades: selectedTrades,
    summary: withDeltas(summary, previousTrades ? buildSummary(previousTrades) : null),
    setups: buildSetups(selectedTrades),
    days: weekdays.days,
    weekdayDetails: weekdays.details,
    frequency: buildFrequency(selectedTrades),
    sessionFrequency: buildSessionFrequency(selectedTrades),
  };
  cache.set(cacheKey, result);
  return result;
}

export const mockAnalyticsInternals = {
  isCompletedTrade,
  getPeriodBounds,
  resultCounts,
  dayEvidenceStatus,
  outcomeMixPerTen,
};
