// A rule is only "followed" when the log or a saved evaluation proves it.
// Missing reviews, outcomes, and unsupported behavioural checks stay unknown.
import { RULEBOOK_DEFAULT_LIMITS } from "../../../../lib/rulebook-default-limits.mjs";
import { ruleForTradeComparison, sameRuleSettings } from "../../../../lib/rulebook-history.mjs";

const DEFAULT_LIMIT_RULES = [
  { rule_key: "daily_loss_limit", title: "Daily Loss Limit", value: RULEBOOK_DEFAULT_LIMITS.daily_loss_limit, unit: "$", guidance: "A completed day beyond this displayed limit exceeds the retrospective comparison. If the day finished within the limit after several trades, their order still needs review." },
  { rule_key: "maximum_lot_contract_size", title: "Maximum Lot / Contract Size", value: RULEBOOK_DEFAULT_LIMITS.maximum_lot_contract_size, unit: "lot / contract" },
  { rule_key: "maximum_trades_per_day", title: "Maximum Trades Per Day", value: RULEBOOK_DEFAULT_LIMITS.maximum_trades_per_day, unit: "trades", guidance: "A day over this displayed limit exceeds the retrospective comparison; the exact excess trade needs reliable execution order." },
  { rule_key: "consecutive_loss_limit", title: "Consecutive Loss Limit", value: RULEBOOK_DEFAULT_LIMITS.consecutive_loss_limit, unit: "losses", guidance: "The sequence needs reliable execution order before this rule can be judged." },
];

// Displayed defaults are retrospective comparison values, never invented
// dated rule-history events. A saved user/account rule takes precedence.
export function withDisplayedRulebookDefaults(rules = []) {
  const present = new Set(rules.filter((rule) => !rule.account_id).map((rule) => rule.rule_key));
  return [
    ...rules,
    ...DEFAULT_LIMIT_RULES.filter((rule) => !present.has(rule.rule_key)).map((rule) => ({
      ...rule, id: `display-default:${rule.rule_key}`, account_id: null,
      category: "non_negotiable", enabled: true, displayDefault: true,
    })),
  ];
}
const EVALUATION_KEYS = {
  maximum_lot_contract_size: "max_lot_size",
  maximum_trades_per_day: "over_trading",
  trade_my_setup: "setup_adherence",
};

// Setup-follow status is independent of the Rulebook. Only rules that can be
// checked against logged trade/day fields contribute to the automatic rule
// status; behavioural rules still need their own review.
const LOGGED_RULE_KEYS = new Set([
  "maximum_lot_contract_size",
  "daily_loss_limit",
  "trading_hours",
  "maximum_trades_per_day",
  "no_overtrading",
]);

export function loggedRuleStatus(checks) {
  const outcomes = checks.filter(({ rule }) => LOGGED_RULE_KEYS.has(rule.rule_key)).map(({ outcome }) => outcome);
  if (!outcomes.length) return "unknown";
  if (outcomes.includes("broken")) return "broken";
  if (outcomes.includes("partial")) return "partial";
  return outcomes.every((outcome) => outcome === "followed") ? "followed" : "unknown";
}

function positiveNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function applicableRules(rules, accountId, date = null) {
  const byKey = new Map();
  for (const rule of rules || []) {
    if (rule.category === "response" || rule.account_id) continue;
    const version = date ? ruleForTradeComparison(rule, date) : rule;
    if (version) byKey.set(rule.rule_key, version);
  }
  for (const rule of rules || []) {
    if (rule.category === "response" || rule.account_id !== accountId) continue;
    const version = date ? ruleForTradeComparison(rule, date) : rule;
    if (version && (!version.retrospective || !byKey.has(rule.rule_key) || byKey.get(rule.rule_key).retrospective)) byKey.set(rule.rule_key, version);
  }
  return [...byKey.values()].filter((rule) => rule.enabled && !(rule.rule_key === "news_trading" && rule.value === "no_rule"));
}

export function loggedSetupStatus(trade) {
  const setupNames = String(trade.setup || "").split(",").map((name) => name.trim().toLowerCase());
  if (setupNames.includes("no setup") || String(trade.no_setup_reason || "").trim()) return "broken";
  const reviews = Object.values(trade.setup_follow_map || {}).filter((value) => ["yes", "no", "partial"].includes(value));
  if (reviews.includes("partial") || (reviews.includes("yes") && reviews.includes("no"))) return "partial";
  if (reviews.includes("no")) return "broken";
  if (reviews.length && reviews.every((value) => value === "yes")) return "followed";
  if (trade.setup_followed === "partial") return "partial";
  if (trade.setup_followed === "no") return "broken";
  if (trade.setup_followed === "yes") return "followed";
  if (setupNames.includes("bad sl")) return "broken";
  if (setupNames.length === 1 && setupNames[0] === "good sl") return "followed";
  return "unknown";
}

function checkFromTrade(trade, rule, completedCount, dailyPnl) {
  if (rule.rule_key === "daily_loss_limit") {
    const limit = positiveNumber(rule.value);
    // This evaluates the completed day's net P&L, not which trade crossed
    // the threshold or whether trading continued after it was reached.
    if (limit === null || !Number.isFinite(dailyPnl)) return "unknown";
    if (Math.round(dailyPnl * 100) < -Math.round(limit * 100)) return "broken";
    // Final net P&L can conceal an earlier intraday breach that was later
    // recovered. Only a single-trade day proves the stop rule was followed.
    return completedCount === 1 ? "followed" : "unknown";
  }
  if (rule.rule_key === "maximum_lot_contract_size") {
    const limit = positiveNumber(rule.value);
    const actual = positiveNumber(trade.lot_size);
    return limit !== null && actual !== null ? (actual > limit ? "broken" : "followed") : "unknown";
  }
  if (rule.rule_key === "trade_my_setup") return loggedSetupStatus(trade);
  if (rule.rule_key === "maximum_trades_per_day" || rule.rule_key === "no_overtrading") {
    const limit = positiveNumber(rule.value);
    // A day over the limit is a proven day-level breach, but without reliable
    // execution order it cannot be attributed to a particular trade.
    return limit === null ? "unknown" : completedCount <= limit ? "followed" : "broken";
  }
  if (rule.rule_key === "trading_hours") {
    const allowed = Array.isArray(rule.metadata?.sessions) ? rule.metadata.sessions : [];
    const normalize = (value) => {
      const name = String(value || "").trim().toLowerCase();
      return name === "ny" || name === "new york" ? "new york" : name === "asia" || name === "asian" ? "asian" : name;
    };
    const session = normalize(trade.session);
    if (!allowed.length || !session || session === "unassigned") return "unknown";
    return allowed.some((value) => normalize(value) === session) ? "followed" : "broken";
  }
  // Realized P&L cannot establish planned risk, and a missing emotion/stop
  // history cannot prove that a behavioural rule was followed.
  return "unknown";
}

function savedOutcomeIsUsable(rule, evaluation) {
  if (!evaluation || !["followed", "partial", "broken"].includes(evaluation.outcome)) return false;
  if (evaluation.evidence?.source !== "manual") return false;
  const snapshotId = evaluation.rule_snapshot?.id;
  if (snapshotId !== rule.id) return false;
  if (evaluation.rule_snapshot?.value !== undefined && String(evaluation.rule_snapshot.value) !== String(rule.value)) return false;
  if (evaluation.rule_snapshot?.unit !== undefined && evaluation.rule_snapshot.unit !== rule.unit) return false;
  if (rule.effective_from && evaluation.rule_snapshot?.effective_from !== rule.effective_from) return false;
  if (rule.version_recorded_at && evaluation.rule_snapshot?.version_recorded_at !== rule.version_recorded_at) return false;
  if (evaluation.rule_snapshot?.settings !== undefined && !sameRuleSettings(evaluation.rule_snapshot.settings, rule.metadata)) return false;
  return true;
}

export function ruleChecksForTrade(trade, rules, evaluations = [], completedCount = 0, dailyPnl = null) {
  const saved = new Map((evaluations || []).map((evaluation) => [evaluation.rule_key, evaluation]));
  const date = trade.trade_date || trade.created_at?.slice(0, 10);
  return applicableRules(rules, trade.account_id || null, date).map((rule) => {
    const automatic = checkFromTrade(trade, rule, completedCount, dailyPnl);
    const key = EVALUATION_KEYS[rule.rule_key] || rule.rule_key;
    const evaluation = saved.get(rule.rule_key) || saved.get(key);
    if (automatic !== "unknown") {
      const detail = rule.rule_key === "daily_loss_limit"
        ? `Completed day P&L: ${dailyPnl < 0 ? "−" : "+"}$${Math.abs(dailyPnl).toFixed(2)}; Rulebook loss limit: $${Number(rule.value).toFixed(2)}. This is a day-level check, not proof of which trade crossed the limit.`
        : rule.rule_key === "maximum_lot_contract_size"
          ? `Logged size: ${trade.lot_size}; comparison maximum: ${rule.value} lot / contract.`
          : rule.rule_key === "maximum_trades_per_day"
            ? `Completed trades on this account and day: ${completedCount}; comparison limit: ${rule.value}. This is a day-level result, not proof of which trade exceeded the limit.`
          : null;
      return { rule, outcome: automatic, source: "automatic", detail };
    }
    if (savedOutcomeIsUsable(rule, evaluation)) return { rule, outcome: evaluation.outcome, source: "manual", note: evaluation.evidence?.note || "" };
    return { rule, outcome: "unknown", source: "unknown", note: evaluation?.evidence?.source === "manual" ? evaluation.evidence?.note || "" : "" };
  });
}

export function attachRuleEvidence(trades, rules, evaluations = []) {
  const completedByAccountDay = new Map();
  for (const trade of trades || []) {
    const date = trade.trade_date || trade.created_at?.slice(0, 10);
    if (trade.pnl === null || trade.pnl === undefined || trade.pnl === "" || !Number.isFinite(Number(trade.pnl)) || !date) continue;
    const key = `${trade.account_id || "none"}|${date}`;
    const summary = completedByAccountDay.get(key) || { count: 0, pnlCents: 0 };
    summary.count += 1;
    summary.pnlCents += Math.round(Number(trade.pnl) * 100);
    completedByAccountDay.set(key, summary);
  }
  const savedByTrade = new Map();
  for (const evaluation of evaluations || []) {
    if (!savedByTrade.has(evaluation.trade_id)) savedByTrade.set(evaluation.trade_id, []);
    savedByTrade.get(evaluation.trade_id).push(evaluation);
  }

  return (trades || []).map((trade) => {
    if (trade.pnl === null || trade.pnl === undefined || trade.pnl === "" || !Number.isFinite(Number(trade.pnl))) {
      return { ...trade, setupStatus: loggedSetupStatus(trade), ruleStatus: "unknown", evidenceStatus: "unknown", dayRuleBreach: false, ruleComparisonRetrospective: false };
    }
    const date = trade.trade_date || trade.created_at?.slice(0, 10);
    const applicable = applicableRules(rules, trade.account_id || null, date);
    const setup = loggedSetupStatus(trade);
    if (!applicable.length) return { ...trade, setupStatus: setup, ruleStatus: "unknown", evidenceStatus: setup === "broken" ? "broken" : setup === "partial" ? "partial" : "unknown", dayRuleBreach: false, ruleComparisonRetrospective: false };

    const saved = savedByTrade.get(trade.id) || [];
    const day = completedByAccountDay.get(`${trade.account_id || "none"}|${date}`);
    const completedCount = day?.count || 0;
    const dailyPnl = day ? day.pnlCents / 100 : null;
    const dailyLimit = applicable.find((rule) => ["maximum_trades_per_day", "no_overtrading"].includes(rule.rule_key) && positiveNumber(rule.value) !== null);
    const maxTrades = positiveNumber(dailyLimit?.value);
    const lossLimit = positiveNumber(applicable.find((rule) => rule.rule_key === "daily_loss_limit")?.value);
    const dayRuleBreach = (maxTrades !== null && completedCount > maxTrades)
      || (lossLimit !== null && dailyPnl !== null && Math.round(dailyPnl * 100) < -Math.round(lossLimit * 100));
    const riskChecks = ["daily_loss_limit", "maximum_lot_contract_size", "maximum_trades_per_day"].map((key) => {
      const rule = applicable.find((item) => item.rule_key === key || (key === "maximum_trades_per_day" && item.rule_key === "no_overtrading" && positiveNumber(item.value) !== null));
      const limit = positiveNumber(rule?.value);
      const actual = key === "daily_loss_limit" ? dailyPnl : key === "maximum_lot_contract_size" ? positiveNumber(trade.lot_size) : completedCount;
      const outcome = limit === null || actual === null || !Number.isFinite(actual) ? "unknown"
        : key === "daily_loss_limit" ? (Math.round(actual * 100) >= -Math.round(limit * 100) ? "followed" : "broken")
        : actual <= limit ? "followed" : "broken";
      return { key, outcome, unitKey: key === "maximum_lot_contract_size" ? trade.id : `${trade.account_id || "none"}|${date}`, retrospective: Boolean(rule?.retrospective) };
    });
    const checks = ruleChecksForTrade(trade, applicable, saved, completedCount, dailyPnl);
    const outcomes = checks.map((check) => check.outcome);
    if (!applicable.some((rule) => rule.rule_key === "trade_my_setup") && setup !== "unknown") outcomes.push(setup);
    const allFollowed = outcomes.length > 0 && outcomes.every((outcome) => outcome === "followed");
    const mixed = outcomes.includes("partial") || (outcomes.includes("followed") && outcomes.includes("broken"));

    return {
      ...trade,
      setupStatus: setup,
      ruleStatus: loggedRuleStatus(checks),
      riskChecks,
      loggedRuleChecks: checks.filter(({ rule }) => LOGGED_RULE_KEYS.has(rule.rule_key)).map(({ rule, outcome }) => ({
        key: rule.rule_key, outcome, retrospective: Boolean(rule.retrospective),
      })),
      ruleComparisonRetrospective: applicable.some((rule) => rule.retrospective),
      dayRuleBreach,
      evidenceStatus: setup === "broken" ? "broken" : allFollowed ? "clean" : mixed ? "partial" : outcomes.includes("broken") ? "broken" : "unknown",
    };
  });
}
