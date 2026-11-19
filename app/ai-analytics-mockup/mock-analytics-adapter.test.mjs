import { resolveAnalyticsSetups } from "../../lib/analytics-setup.mjs";
import { attachRuleEvidence } from "../api/ai-analytics/local-data/rule-evidence.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  setupComposition,
  compareSetupEvidence,
  buildMockPeriodAnalytics,
  buildPeriodAnalyticsFromTrades,
  mockAnalyticsInternals,
} from "./mock-analytics-adapter.mjs";

test("missing P&L is incomplete while numeric zero is break-even", () => {
  assert.equal(mockAnalyticsInternals.isCompletedTrade({ trade_date: "2026-10-01", pnl: null }), false);
  assert.equal(mockAnalyticsInternals.isCompletedTrade({ trade_date: "2026-10-01", pnl: 0 }), true);
  assert.equal(mockAnalyticsInternals.isCompletedTrade({ trade_date: "2026-10-01", pnl: 42, opened_at: null, closed_at: null }), true);
  assert.equal(mockAnalyticsInternals.isCompletedTrade({ trade_date: "2026-10-01", pnl: null, closed_at: "2026-10-01T12:00:00Z" }), false);
  assert.deepEqual(mockAnalyticsInternals.resultCounts([
    { pnl: 100 },
    { pnl: -50 },
    { pnl: 0 },
  ]), { wins: 1, losses: 1, breakEven: 1 });
});

test("period boundaries are deterministic", () => {
  assert.deepEqual(mockAnalyticsInternals.getPeriodBounds("thisWeek", "2026-10-04"), { from: "2026-09-28", to: "2026-10-04" });
  assert.deepEqual(mockAnalyticsInternals.getPeriodBounds("lastWeek", "2026-10-04"), { from: "2026-09-21", to: "2026-09-27" });
  assert.deepEqual(mockAnalyticsInternals.getPeriodBounds("lastMonth", "2026-10-04"), { from: "2026-09-01", to: "2026-09-30" });
});

test("weekday and frequency aggregates remain internally consistent", () => {
  for (const period of ["all", "thisMonth", "thisWeek", "lastWeek", "lastMonth"]) {
    const analytics = buildMockPeriodAnalytics(period, "2026-10-04");
    assert.equal(
      analytics.summary.clean + analytics.summary.partial + analytics.summary.notFollowed + analytics.summary.needsEvidence,
      analytics.summary.totalTrades,
    );
    assert.equal(analytics.summary.totalTrades, analytics.trades.length);
    assert.equal(analytics.days.reduce((sum, day) => sum + day.trades, 0), analytics.trades.length);
    assert.equal(analytics.frequency.rows.reduce((sum, row) => sum + row.sampleDays, 0), analytics.frequency.completedDays);
    analytics.frequency.rows.forEach((row) => {
      assert.ok(Math.abs(row.green + row.red + row.breakEven - 100) <= 1 || row.sampleDays === 0);
    });
    analytics.days.forEach((day) => {
      assert.equal(day.clean + day.partial + day.breached + day.unknown, day.trades);
      const detail = analytics.weekdayDetails[day.day];
      assert.equal(detail.distribution.reduce((sum, value) => sum + value, 0) >= 99 || detail.tradingDays === 0, true);
      assert.equal(detail.distribution.reduce((sum, value) => sum + value, 0) <= 101 || detail.tradingDays === 0, true);
    });
    analytics.setups.forEach((setup) => {
      assert.equal(setup.wins + setup.losses + setup.breakEven, setup.trades);
      const mixTotal = setup.outcomeMix.wins + setup.outcomeMix.losses + setup.outcomeMix.breakEven;
      assert.equal(mixTotal, setup.trades ? 10 : 0);
    });
  }
});

test("a broken rule makes a day conclusive while unknown-only evidence remains incomplete", () => {
  assert.equal(mockAnalyticsInternals.dayEvidenceStatus([
    { evidenceStatus: "broken" },
    { evidenceStatus: "unknown" },
  ]), "broken");
  assert.equal(mockAnalyticsInternals.dayEvidenceStatus([
    { evidenceStatus: "clean" },
    { evidenceStatus: "unknown" },
  ]), "unknown");
  assert.equal(mockAnalyticsInternals.dayEvidenceStatus([{ evidenceStatus: "unknown", dayRuleBreach: true }]), "broken");
  assert.equal(mockAnalyticsInternals.dayEvidenceStatus([{ evidenceStatus: "unknown", dayRuleBreach: true }], false), "unknown");
});

test("largest-remainder outcome mixes always total ten", () => {
  for (const outcomes of [
    { wins: 1, losses: 1, breakEven: 1 },
    { wins: 7, losses: 2, breakEven: 4 },
    { wins: 24, losses: 6, breakEven: 0 },
  ]) {
    const mix = mockAnalyticsInternals.outcomeMixPerTen(outcomes);
    assert.equal(mix.wins + mix.losses + mix.breakEven, 10);
  }
});

test("authenticated account trades drive every aggregate without inventing risk evidence", () => {
  const trades = [
    { id: "1", trade_date: "2026-10-01", created_at: "2026-10-01T09:00:00Z", pnl: 100, session: "London", setup: "Breakout", setupNames: ["Breakout"], setup_follow_map: { Breakout: "yes" }, evidenceStatus: "clean", riskR: null },
    { id: "2", trade_date: "2026-10-01", created_at: "2026-10-01T10:00:00Z", pnl: -50, session: "London", setup: "Breakout", setupNames: ["Breakout"], setup_follow_map: { Breakout: "no" }, evidenceStatus: "broken", riskR: null },
    { id: "3", trade_date: "2026-10-02", created_at: "2026-10-02T10:00:00Z", pnl: 0, session: "New York", setup: "Reversal", setupNames: ["Reversal"], setup_follow_map: {}, evidenceStatus: "unknown", riskR: null },
  ];
  const analytics = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-04", ["Breakout", "Reversal"]);
  assert.equal(analytics.summary.totalTrades, 3);
  assert.equal(analytics.summary.setupReviewed, 2);
  assert.equal(analytics.summary.clean, 1);
  assert.equal(analytics.summary.notFollowed, 1);
  assert.equal(analytics.summary.needsEvidence, 1);
  assert.equal(analytics.summary.riskConsistency, null);
  assert.equal(analytics.summary.netPnl, 50);
  assert.equal(analytics.setups.find((setup) => setup.name === "Breakout").trades, 2);
  assert.equal(analytics.setups.find((setup) => setup.name === "Reversal").trades, 1);
});

test("setup following alone does not create a discipline or execution-quality grade", () => {
  const analytics = buildPeriodAnalyticsFromTrades([
    { id: "1", trade_date: "2026-10-01", created_at: "2026-10-01T09:00:00Z", pnl: 100, session: "London", setup: "Breakout", setupNames: ["Breakout"], setup_follow_map: { Breakout: "yes" }, evidenceStatus: "unknown", riskR: null },
  ], "all", "2026-10-05", ["Breakout"]);
  assert.equal(analytics.summary.totalTrades, 1);
  assert.equal(analytics.summary.setupAdherence, 100);
  assert.equal(analytics.summary.setupReviewed, 1);
  assert.equal(analytics.summary.ruleAdherence, null);
  assert.equal(analytics.summary.discipline, null);
  assert.equal(analytics.summary.clean, 1);
  assert.equal(analytics.summary.needsEvidence, 0);
  assert.equal(analytics.setups[0].historicalWinRate, 100);
  assert.equal(analytics.setups[0].executionScore, null);
  assert.equal(analytics.setups[0].executionGrade, null);
});

test("a rule breach does not override a green setup tag or produce an execution-quality grade", () => {
  const analytics = buildPeriodAnalyticsFromTrades([
    { id: "breach", trade_date: "2026-10-01", created_at: "2026-10-01T09:00:00Z", pnl: -10, session: "London", setup: "Breakout", setupNames: ["Breakout"], setup_follow_map: { Breakout: "yes" }, evidenceStatus: "broken", ruleStatus: "broken", riskR: null },
    { id: "unreviewed", trade_date: "2026-10-02", created_at: "2026-10-02T09:00:00Z", pnl: 20, session: "London", setup: "Breakout", setupNames: ["Breakout"], setup_follow_map: { Breakout: "yes" }, evidenceStatus: "unknown", riskR: null },
  ], "all", "2026-10-05", ["Breakout"]);
  assert.equal(analytics.summary.clean, 2);
  assert.equal(analytics.summary.notFollowed, 0);
  assert.equal(analytics.summary.needsEvidence, 0);
  assert.equal(analytics.summary.ruleAdherence, 0);
  assert.equal(analytics.summary.ruleReviewed, 1);
  assert.equal(analytics.summary.postLossDiscipline, null);
  assert.equal(analytics.setups[0].executionScore, null);
  assert.equal(analytics.frequency.rows.find((row) => row.key === "one").cleanDayRate, null);
});

test("live aggregates use trade dates, actual active months, cents, and all tagged setups", () => {
  const trades = [
    { id: "late-entry", trade_date: "2026-08-03", created_at: "2026-10-03T10:00:00Z", pnl: -100.25, session: "London", setup: "Breakout", setupNames: ["Breakout", "Retest"], setup_follow_map: {}, evidenceStatus: "unknown", riskR: null },
    { id: "early-entry", trade_date: "2026-08-04", created_at: "2026-08-04T10:00:00Z", pnl: 60.1, session: "London", setup: "Breakout", setupNames: ["Breakout"], setup_follow_map: {}, evidenceStatus: "unknown", riskR: null },
    { id: "september", trade_date: "2026-09-01", created_at: "2026-09-01T10:00:00Z", pnl: -20.2, session: "Asian", setup: "Retest", setupNames: ["Retest"], setup_follow_map: {}, evidenceStatus: "unknown", riskR: null },
  ];
  const result = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05", ["Breakout", "Retest"]);
  assert.equal(result.summary.netPnl, -60.35);
  assert.equal(result.summary.maxDrawdown, 100.25);
  assert.equal(result.frequency.activeMonths, 2);
  assert.equal(result.frequency.rows.find((row) => row.key === "one").averageDays, 1.5);
  assert.equal(result.setups.find((setup) => setup.name === "Retest").trades, 2);
  assert.equal(result.days.find((day) => day.day === "Mon").setup, "Breakout");
  assert.equal(result.weekdayDetails.Mon.setupTrades, 1);
  assert.equal(result.sessionFrequency.Unassigned[0].occurrences, 0);
  assert.equal(result.sessionFrequency.Unassigned[0].winRate, null);
  assert.equal(result.sessionFrequency.London[0].occurrences, 2);
});

test("rule adherence scores individual logged checks and exposes unresolved evidence", () => {
  const analytics = buildPeriodAnalyticsFromTrades([
    { id: "a", trade_date: "2026-10-01", pnl: 10, ruleStatus: "broken", evidenceStatus: "broken", loggedRuleChecks: [
      { key: "maximum_lot_contract_size", outcome: "followed", retrospective: true },
      { key: "maximum_trades_per_day", outcome: "broken" },
      { key: "trading_hours", outcome: "unknown" },
    ] },
    { id: "b", trade_date: "2026-10-02", pnl: 20, ruleStatus: "unknown", evidenceStatus: "unknown", loggedRuleChecks: [
      { key: "maximum_lot_contract_size", outcome: "followed" },
      { key: "trading_hours", outcome: "partial" },
    ] },
  ], "all", "2026-10-05");
  assert.equal(analytics.summary.ruleAdherence, 50);
  assert.deepEqual(analytics.summary.ruleCheckCounts, { followed: 2, partial: 1, broken: 1, unknown: 1, checked: 4 });
  assert.equal(analytics.summary.retrospectiveRuleChecks, 1);
  assert.equal(analytics.summary.ruleCheckBreakdown.find((row) => row.key === "maximum_lot_contract_size").followed, 2);
  assert.equal(analytics.summary.discipline, null);
  const unknown = buildPeriodAnalyticsFromTrades([
    { id: "unknown", trade_date: "2026-10-01", pnl: 0, loggedRuleChecks: [{ key: "trading_hours", outcome: "unknown" }] },
  ], "all", "2026-10-05");
  assert.equal(unknown.summary.ruleAdherence, null);
  assert.equal(unknown.summary.ruleCheckCounts.checked, 0);
  const filtered = buildPeriodAnalyticsFromTrades([
    { id: "old", trade_date: "2026-09-01", pnl: 0, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "broken" }] },
    { id: "new", trade_date: "2026-10-01", pnl: 0, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "followed" }] },
  ], "thisMonth", "2026-10-05");
  assert.equal(filtered.summary.ruleAdherence, 100);
  assert.equal(filtered.summary.ruleCheckCounts.checked, 1);
});

test("discipline uses available rule and setup components with a provisional label", () => {
  const trades = [
    { id: "first", trade_date: "2026-10-01", pnl: 10, setup_follow_map: { Breakout: "yes" }, evidenceStatus: "unknown", riskR: null, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "followed" }, { key: "trading_hours", outcome: "unknown" }] },
    { id: "second", trade_date: "2026-10-02", pnl: 10, setup_follow_map: { Breakout: "no" }, evidenceStatus: "unknown", riskR: null, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "broken" }] },
  ];
  const summary = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05").summary;
  assert.equal(summary.discipline, 50);
  assert.equal(summary.disciplineProvisional, true);
  assert.deepEqual(summary.disciplineMissing, ["Risk consistency", "Post-loss discipline"]);
  assert.equal(summary.disciplineComponents.length, 2);
  assert.equal(buildPeriodAnalyticsFromTrades(trades.map((t) => ({ ...t, pnl: t.pnl * 20 })), "all", "2026-10-05").summary.discipline, 50);
  const zero = buildPeriodAnalyticsFromTrades(trades.map((t) => ({ ...t, setup_follow_map: { Breakout: "no" }, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "broken" }] })), "all", "2026-10-05").summary;
  assert.equal(zero.discipline, 0);
  assert.equal(zero.disciplineProvisional, true);
});

test("complete discipline evidence retains the original four-component weights", () => {
  const trades = [
    { id: "first", trade_date: "2026-10-01", pnl: -10, setup_follow_map: { Breakout: "no" }, evidenceStatus: "broken", riskR: 1, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "broken" }] },
    { id: "second", trade_date: "2026-10-02", pnl: 10, setup_follow_map: { Breakout: "yes" }, evidenceStatus: "clean", riskR: 1, loggedRuleChecks: [{ key: "maximum_lot_contract_size", outcome: "followed" }] },
  ].map((trade, index) => ({ ...trade, trade_date: "2026-10-01", opened_at: index === 0 ? "2026-10-01T08:00:00Z" : "2026-10-01T10:00:00Z", riskChecks: ["daily_loss_limit", "maximum_lot_contract_size", "maximum_trades_per_day"].map((key) => ({ key, outcome: "followed", unitKey: trade.id })) }));
  const summary = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05").summary;
  assert.equal(summary.discipline, 73);
  assert.equal(summary.disciplineProvisional, false);
  assert.equal(summary.disciplineComponents.length, 4);
  const changed = buildPeriodAnalyticsFromTrades([
    ...trades.map((t) => ({ ...t, trade_date: t.trade_date.replace("10-", "09-") })),
    ...trades.map((t) => ({ ...t, riskChecks: [] })),
  ], "thisMonth", "2026-10-05").summary;
  assert.equal(changed.disciplineDelta, null);
});

test("setup arc proportions use total trades and rounded labels total one hundred", () => {
  const parts = setupComposition({ totalTrades: 206, clean: 71, partial: 9, notFollowed: 28, needsEvidence: 98 });
  assert.deepEqual(parts.map((part) => part.percent), [34, 4, 14, 48]);
  assert.equal(parts.reduce((sum, part) => sum + part.percent, 0), 100);
  assert.ok(Math.abs(parts.reduce((sum, part) => sum + part.share, 0) - 100) < 1e-9);
  assert.equal(parts[1].start, parts[0].share);
  const thirds = setupComposition({ totalTrades: 3, clean: 1, partial: 1, notFollowed: 1, needsEvidence: 0 });
  assert.deepEqual(thirds.map((part) => part.percent), [34, 33, 33, 0]);
  assert.deepEqual(setupComposition({ totalTrades: 0 }).map((part) => part.percent), [0, 0, 0, 0]);
  assert.deepEqual(setupComposition({ totalTrades: 5, clean: 5 }).map((part) => part.percent), [100, 0, 0, 0]);
});

test("risk consistency averages rule compliance rates and counts each account-day once", () => {
  const rules = [
    { id: "loss", rule_key: "daily_loss_limit", enabled: true, value: "250" },
    { id: "size", rule_key: "maximum_lot_contract_size", enabled: true, value: "1" },
    { id: "count", rule_key: "maximum_trades_per_day", enabled: true, value: "2" },
  ];
  const input = [
    { id: "a", account_id: "a1", trade_date: "2026-10-01", pnl: -100, lot_size: 1 },
    { id: "b", account_id: "a1", trade_date: "2026-10-01", pnl: -150, lot_size: 2 },
    { id: "c", account_id: "a1", trade_date: "2026-10-02", pnl: -251, lot_size: 1 },
  ];
  const summary = buildPeriodAnalyticsFromTrades(attachRuleEvidence(input, rules), "all", "2026-10-05").summary;
  assert.equal(summary.riskConsistency, 72); // (50% days + 66.67% sizes + 100% counts) / 3
  assert.deepEqual(summary.riskConsistencyBreakdown.map((row) => row.reviewed), [2, 3, 2]);
  const missing = buildPeriodAnalyticsFromTrades(attachRuleEvidence(input.map((trade) => ({ ...trade, lot_size: null })), rules), "all", "2026-10-05").summary;
  assert.equal(missing.riskConsistency, 75);
  assert.equal(missing.riskConsistencyComponents, 2);
  const history = [{ ...rules[2], updated_at: "2026-10-02T12:00:00Z", metadata: { effective_history: [
    { effective_from: "2026-10-01", value: "2", enabled: true },
    { effective_from: "2026-10-02", value: "1", enabled: true },
  ] } }];
  const mapped = attachRuleEvidence([...input, { ...input[2], id: "d", pnl: 0 }], history);
  assert.deepEqual(mapped.map((trade) => trade.riskChecks.find((check) => check.key === "maximum_trades_per_day").outcome), ["followed", "followed", "broken", "broken"]);
  assert.equal(buildPeriodAnalyticsFromTrades(attachRuleEvidence(input.map((trade) => ({ ...trade, account_id: trade.id })), rules), "all", "2026-10-05").summary.riskConsistencyBreakdown[0].reviewed, 3);
});

test("post-loss checks every same-day follow-up using setup and lot size only", () => {
  const make = (id, pnl, setupStatus, lot) => ({ id, account_id: "a", trade_date: "2026-10-01", created_at: "2026-10-01T" + String(8 + Number(id)).padStart(2, "0") + ":00:00Z", pnl, setupStatus, evidenceStatus: "broken", riskChecks: [{ key: "maximum_lot_contract_size", outcome: lot, unitKey: id }] });
  const trades = [
    make("1", -100, "followed", "followed"),
    make("2", -20, "followed", "followed"), // Counts as disciplined despite losing and other rule breaches.
    make("3", 5, "partial", "followed"),
    make("4", -2, "unknown", "followed"),
    make("5", 10, "followed", "broken"),
    make("6", -3, "followed", "followed"),
    make("7", 20, "unknown", "followed"),
    make("8", -1, "followed", "followed"), // Stops here; tomorrow is not a follow-up.
    { ...make("9", 50, "followed", "followed"), trade_date: "2026-10-02" },
    { ...make("10", 10, "broken", "broken"), account_id: "b" },
  ];
  const summary = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05").summary;
  assert.equal(summary.postLossDiscipline, 33);
  assert.deepEqual(summary.postLossEvidence, { followed: 1, notFollowed: 2, unknown: 1, stopped: 1, loggedOrderFollowUps: 4, retrospective: 0, reviewed: 3, rate: 33 });
  const timed = trades.map((trade) => ({ ...trade, opened_at: trade.created_at }));
  assert.equal(buildPeriodAnalyticsFromTrades(timed, "all", "2026-10-05").summary.postLossEvidence.loggedOrderFollowUps, 0);
  for (const pnl of [-500, 500]) {
    assert.equal(buildPeriodAnalyticsFromTrades([make("1", -10, "followed", "followed"), make("2", pnl, "followed", "followed")], "all", "2026-10-05").summary.postLossDiscipline, 100);
  }
  const noCrossDay = buildPeriodAnalyticsFromTrades([{ ...make("1", -10, "followed", "followed"), trade_date: "2026-09-30" }, make("2", 100, "followed", "followed")], "thisMonth", "2026-10-05").summary;
  assert.equal(noCrossDay.postLossDiscipline, null);
  assert.equal(noCrossDay.postLossEvidence.reviewed, 0);
});

test("setup adherence includes orange and explicit No Setup trades in its denominator", () => {
  const summary = buildPeriodAnalyticsFromTrades([
    { id: "green", trade_date: "2026-10-01", pnl: 1, setup_follow_map: { A: "yes" } },
    { id: "orange", trade_date: "2026-10-01", pnl: 1, setup_follow_map: { A: "partial" } },
    { id: "none", trade_date: "2026-10-01", pnl: 1, setup: "No Setup" },
    { id: "unknown", trade_date: "2026-10-01", pnl: 1 },
  ], "all", "2026-10-05").summary;
  assert.equal(summary.setupAdherence, 33);
  assert.equal(summary.setupReviewed, 3);
});

test("weekday chart rates keep reviewed setups and all completed outcomes separate", () => {
  const trades = [
    { id: "green", trade_date: "2026-10-01", pnl: 10, setup_follow_map: { A: "yes" } },
    { id: "partial", trade_date: "2026-10-01", pnl: -10, setup_follow_map: { A: "partial" } },
    { id: "no-setup", trade_date: "2026-10-01", pnl: 0, setup: "No Setup" },
    { id: "unreviewed", trade_date: "2026-10-01", pnl: 20 },
    { id: "earlier", trade_date: "2026-09-03", pnl: 10, setup_follow_map: { A: "yes" } },
  ];
  const result = buildPeriodAnalyticsFromTrades(trades, "thisMonth", "2026-10-05");
  assert.equal(result.days.find((day) => day.day === "Thu").selectedSetupAdherence, 33);
  assert.equal(result.weekdayDetails.Thu.tradeWinRate, 50);
  assert.equal(result.days.find((day) => day.day === "Thu").selectedWinRate, 50);
  assert.equal(result.days.find((day) => day.day === "Thu").allWinRate, 60);
  assert.equal(result.days.find((day) => day.day === "Mon").selectedWinRate, null);
  assert.equal(result.days.find((day) => day.day === "Thu").trades, 4);
  assert.equal(result.days.find((day) => day.day === "Mon").selectedSetupAdherence, null);
  assert.equal(result.days.find((day) => day.day === "Mon").trades, 0);
});

test("weekday and session averages use currency cents and distinct day denominators", () => {
  const trades = [
    { id: "a", trade_date: "2026-10-05", pnl: 10.01, session: "NY", evidenceStatus: "clean" },
    { id: "b", trade_date: "2026-10-05", pnl: -0.02, session: "new_york", evidenceStatus: "partial" },
    { id: "c", trade_date: "2026-10-05", pnl: 0, session: "London", evidenceStatus: "broken" },
    { id: "d", trade_date: "2026-10-12", pnl: -0.03, session: "NewYork", evidenceStatus: "clean" },
    { id: "e", trade_date: "2026-10-12", pnl: 20.01, session: "custom-session", evidenceStatus: "unknown" },
  ];
  const result = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-15");
  const monday = result.weekdayDetails.Mon;
  assert.equal(monday.totalPnl, 29.97);
  assert.equal(monday.averageDayPnl, 14.99);
  assert.equal(monday.medianDayPnl, 14.99);
  assert.equal(monday.averageWin, 15.01);
  assert.equal(monday.averageLoss, -0.03);
  assert.equal(monday.tradeWinRate, 40);
  assert.equal(monday.tradingDays, 2);
  assert.deepEqual([monday.wins, monday.losses, monday.breakEven], [2, 2, 1]);
  const ny = monday.sessions.find((session) => session.name === "New York");
  assert.deepEqual([ny.trades, ny.occurrences, ny.totalPnl, ny.averagePnl, ny.winRate], [3, 2, 9.96, 4.98, 33]);
  const london = monday.sessions.find((session) => session.name === "London");
  assert.deepEqual([london.averagePnl, london.winRate], [0, 0]);
  assert.equal(monday.sessions.reduce((sum, session) => sum + session.trades, 0), 5);
  assert.equal(Math.round(monday.sessions.reduce((sum, session) => sum + (session.totalPnl || 0), 0) * 100), 2997);
  assert.equal(monday.sessions.find((session) => session.name === "Unassigned").trades, 1);
  const day = result.days.find((day) => day.day === "Mon");
  assert.equal(day.clean + day.partial + day.breached + day.unknown, day.trades);
});

test("empty weekdays and outcome categories stay unscored while real break-even stays zero", () => {
  const result = buildPeriodAnalyticsFromTrades([{ id: "be", trade_date: "2026-10-05", pnl: 0, session: "Asian" }], "all", "2026-10-15");
  const empty = result.weekdayDetails.Tue;
  for (const key of ["averageDayPnl", "medianDayPnl", "greenDayRate", "tradeWinRate", "averageWin", "averageLoss", "totalPnl", "averageTradesPerDay"]) assert.equal(empty[key], null, key);
  assert.deepEqual(empty.distribution, [null, null, null]);
  assert.ok(empty.sessions.every((session) => session.trades === 0 && session.averagePnl === null && session.winRate === null));
  assert.equal(result.days.find((day) => day.day === "Tue").selectedPnl, null);
  const monday = result.weekdayDetails.Mon;
  assert.deepEqual([monday.averageDayPnl, monday.medianDayPnl, monday.tradeWinRate], [0, 0, 0]);
  assert.equal(monday.averageWin, null);
  assert.equal(monday.averageLoss, null);
});

test("setup averages preserve cents, exclude break-even, and leave missing outcome averages unscored", () => {
  const t = (id, pnl, extra = {}) => ({ id, trade_date: "2026-10-01", setup: "A", setupNames: ["A"], pnl, ...extra });
  const a = buildPeriodAnalyticsFromTrades([t("1", 10.01), t("2", 20.01), t("3", -0.02), t("4", -0.03), t("5", 0)], "all", "2026-10-05").setups[0];
  assert.deepEqual([a.trades, a.wins, a.losses, a.breakEven, a.avgWin, a.avgLoss, a.pnl, a.historicalWinRate], [5, 2, 2, 1, 15.01, -0.03, 29.97, 40]);
  const onlyBE = buildPeriodAnalyticsFromTrades([t("be", 0)], "all", "2026-10-05").setups[0];
  assert.equal(onlyBE.avgWin, null);
  assert.equal(onlyBE.avgLoss, null);
  const noLosses = buildPeriodAnalyticsFromTrades([t("win", 1.25)], "all", "2026-10-05").setups[0];
  assert.equal(noLosses.avgLoss, null);
  assert.equal(noLosses.avgWin, 1.25);
});

test("setup-specific adherence does not assign a multi-tag global failure to unreviewed tags", () => {
  const result = buildPeriodAnalyticsFromTrades([
    { id: "multi", trade_date: "2026-10-01", pnl: 1, setup: "A", setupNames: ["A", "B"], setup_follow_map: { A: "yes" }, setupFollowed: "partial", evidenceStatus: "partial" },
  ], "all", "2026-10-05", ["A", "B"]);
  assert.equal(result.setups.find((s) => s.name === "A").setupAdherence, 100);
  assert.equal(result.setups.find((s) => s.name === "B").setupAdherence, null);
  assert.equal(result.setups.find((s) => s.name === "B").executionScore, null);
  assert.equal(result.setups.reduce((n, s) => n + s.trades, 0), 2);
});

test("setup streaks use complete close times or explicitly label saved log order, with BE interruptions", () => {
  const t = (id, pnl, created, closed) => ({ id, pnl, trade_date: "2026-10-01", created_at: "2026-10-01T" + created + ":00:00Z", closed_at: closed ? "2026-10-01T" + closed + ":00:00Z" : null, setup: "A" });
  const input = [t("1", 1, "10", "10"), t("2", 1, "08", "11"), t("3", -1, "09", "12")];
  let a = buildPeriodAnalyticsFromTrades(input, "all", "2026-10-05").setups[0];
  assert.equal(a.maxWinStreak, 2);
  assert.equal(a.streakOrder, "Recorded close times");
  a = buildPeriodAnalyticsFromTrades(input.map((trade) => ({ ...trade, closed_at: null })), "all", "2026-10-05").setups[0];
  assert.equal(a.maxWinStreak, 1);
  assert.equal(a.streakOrder, "Saved log order");
  a = buildPeriodAnalyticsFromTrades([1, 1, 0, 1, -1, -1].map((pnl, index) => t(String(index), pnl, String(10 + index), null)), "all", "2026-10-05").setups[0];
  assert.deepEqual([a.maxWinStreak, a.maxLossStreak], [2, 2]);
});

test("setup grade and sample boundaries are exact and default ranking prioritizes evidence size", () => {
  for (const [score, grade] of [[59, "D"], [60, "C"], [69, "C"], [70, "B"], [79, "B"], [80, "A"], [89, "A"], [90, "A+"]]) assert.equal(mockAnalyticsInternals.executionGrade(score), grade);
  for (const [count, label] of [[9, "Provisional"], [10, "Developing"], [29, "Developing"], [30, "Established"]]) assert.equal(mockAnalyticsInternals.sampleConfidence(count), label);
  const sorted = [
    { name: "Tiny", trades: 2, sampleConfidence: "Provisional", executionScore: 100 },
    { name: "Established", trades: 30, sampleConfidence: "Established", executionScore: null },
    { name: "Developing", trades: 12, sampleConfidence: "Developing", executionScore: 90 },
  ].sort(compareSetupEvidence);
  assert.deepEqual(sorted.map((s) => s.name), ["Established", "Developing", "Tiny"]);
});

test("setup resolution preserves legacy IDs and deduplicates tag membership", () => {
  const names = new Map([["a", "A"], ["b", "B"]]);
  assert.deepEqual(resolveAnalyticsSetups({ setup_ids: [], setup_id: "a" }, names), ["A"]);
  assert.deepEqual(resolveAnalyticsSetups({ setup_ids: ["a", "a", "b"] }, names), ["A", "B"]);
  assert.deepEqual(resolveAnalyticsSetups({ setup_ids: ["not-owned"], setup: " A, B, A " }, names), ["A", "B"]);
  assert.deepEqual(resolveAnalyticsSetups({}, names), []);
});


test("execution quality measures reviewed consistency separately from historical win rate", () => {
  const trades = ["yes", "yes", "no", "no"].map((status, index) => ({ id: String(index), trade_date: "2026-10-01", pnl: -1, setup: "A", setupFollowed: status, evidenceStatus: index < 3 ? "clean" : "broken" }));
  const setup = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05").setups[0];
  assert.deepEqual([setup.setupAdherence, setup.cleanTradeRate, setup.executionScore, setup.executionGrade, setup.historicalWinRate], [50, 75, 60, "C", 0]);
});


test("frequency uses currency cents and distinguishes break-even sessions from floating-point residuals", () => {
  const trades = [0.1, 0.2, -0.3].map((pnl, i) => ({ id: String(i), account_id: "A", trade_date: "2026-10-01", session: "London", pnl, evidenceStatus: "clean" }));
  const a = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05");
  const day = a.frequency.rows[2], session = a.sessionFrequency.London[2];
  assert.deepEqual([day.green, day.red, day.breakEven, day.averagePnl, day.medianPnl], [0, 0, 100, 0, 0]);
  assert.deepEqual([session.winRate, session.averagePnl, session.cleanRate], [0, 0, 100]);
});

test("frequency keeps different accounts on the same date and session separate", () => {
  const trades = [
    { id: "1", account_id: "A", trade_date: "2026-09-01", session: "NY", pnl: 10.01, evidenceStatus: "clean" },
    { id: "2", account_id: "B", trade_date: "2026-09-01", session: "New York", pnl: -4.02, evidenceStatus: "broken" },
    { id: "3", account_id: "A", trade_date: "2026-10-01", session: "Asian", pnl: 2.01, evidenceStatus: "clean" },
  ];
  const a = buildPeriodAnalyticsFromTrades(trades, "all", "2026-10-05");
  const d = a.frequency.rows[0];
  assert.deepEqual([a.frequency.completedDays, a.frequency.activeMonths, d.sampleDays, d.averageDays, d.averagePnl, d.medianPnl, d.cleanDayRate, d.breachDayRate], [3, 2, 3, 1.5, 2.67, 2.01, 67, 33]);
  assert.equal(a.frequency.rows[1].sampleDays, 0);
  assert.deepEqual([a.sessionFrequency["New York"][0].occurrences, a.sessionFrequency["New York"][0].winRate, a.sessionFrequency["New York"][0].averagePnl], [2, 50, 3]);
  assert.equal(a.sessionFrequency["All sessions"][0].occurrences, 3);
  const current = buildPeriodAnalyticsFromTrades(trades, "thisMonth", "2026-10-05");
  assert.deepEqual([current.frequency.completedDays, current.frequency.rows[0].averagePnl, current.sessionFrequency["All sessions"][0].occurrences], [1, 2.01, 1]);
});

test("frequency leaves empty outcome groups and incomplete clean rates unscored", () => {
  const a = buildPeriodAnalyticsFromTrades([
    { id: "1", trade_date: "2026-10-01", session: "London", pnl: 10, evidenceStatus: "clean" },
    { id: "2", trade_date: "2026-10-02", session: "London", pnl: -1, evidenceStatus: "unknown" },
  ], "all", "2026-10-05");
  assert.equal(a.frequency.rows[0].cleanDayRate, null);
  assert.equal(a.sessionFrequency.London[0].cleanRate, null);
  for (const key of ["green", "red", "breakEven", "averagePnl", "medianPnl", "cleanDayRate", "setupRate", "breachDayRate"]) assert.equal(a.frequency.rows[1][key], null, key);
  const empty = buildPeriodAnalyticsFromTrades([], "all", "2026-10-05");
  assert.equal(empty.frequency.rows[0].averageDays, null);
  assert.equal(empty.frequency.rows[0].share, null);
});


test("outcome breakdown uses selected completed trades, cents, and separate win/loss denominators", () => {
  const trades = [
    { id: "win-a", trade_date: "2026-10-01", pnl: 0.1 },
    { id: "win-b", trade_date: "2026-10-01", pnl: 0.2 },
    { id: "loss", trade_date: "2026-10-02", pnl: -0.1 },
    { id: "be", trade_date: "2026-10-02", pnl: 0 },
    { id: "incomplete", trade_date: "2026-10-02", pnl: null },
    { id: "previous", trade_date: "2026-09-30", pnl: 1000 },
  ];
  const { summary } = buildPeriodAnalyticsFromTrades(trades, "lastMonth", "2026-11-14");
  assert.deepEqual([summary.wins, summary.losses, summary.breakEven], [2, 1, 1]);
  assert.equal(summary.averageWin, 0.15);
  assert.equal(summary.averageLoss, -0.1);
  assert.equal(summary.grossProfit, 0.3);
  assert.equal(summary.grossLoss, 0.1);
  assert.equal(summary.profitFactor, 3);
  assert.equal(summary.wins + summary.losses + summary.breakEven, summary.totalTrades);
});

test("outcome breakdown leaves absent categories and loss-free profit factors unscored", () => {
  const summaryFor = (pnls) => buildPeriodAnalyticsFromTrades(pnls.map((pnl, i) => ({ id: String(i), trade_date: "2026-10-01", pnl })), "all").summary;
  const winners = summaryFor([100, 50, 0]);
  assert.equal(winners.averageWin, 75);
  assert.equal(winners.averageLoss, null);
  assert.equal(winners.profitFactor, null);
  assert.equal(winners.grossProfit, 150);
  const losers = summaryFor([-100, -50, 0]);
  assert.equal(losers.averageWin, null);
  assert.equal(losers.averageLoss, -75);
  assert.equal(losers.profitFactor, 0);
  for (const pnls of [[], [0, 0]]) {
    const summary = summaryFor(pnls);
    assert.equal(summary.averageWin, null);
    assert.equal(summary.averageLoss, null);
    assert.equal(summary.profitFactor, null);
    assert.equal(summary.grossProfit, 0);
    assert.equal(summary.grossLoss, 0);
  }
});


test("monthly day counts show thirteen profitable and nine losing out of twenty-two traded days", () => {
  const data = Array.from({ length: 22 }, (_, index) => ({ id: String(index), trade_date: `2026-10-${String(index + 1).padStart(2, "0")}`, pnl: index < 13 ? 50 : -20 }));
  const { monthlyDays } = buildPeriodAnalyticsFromTrades(data, "lastMonth", "2026-11-15").summary;
  assert.equal(monthlyDays.activeMonths, 1);
  assert.equal(monthlyDays.averageTradedDays, 22);
  assert.equal(monthlyDays.averageProfitableDays, 13);
  assert.equal(monthlyDays.averageLosingDays, 9);
  assert.equal(monthlyDays.winDayRate, 59);
});

test("monthly day counts combine accounts by calendar date, use net cents, and filter the period", () => {
  const data = [
    ["a", "2026-10-01", 100], ["a", "2026-10-01", -40], ["b", "2026-10-01", -80],
    ["a", "2026-10-02", 40], ["b", "2026-10-02", -10],
    ["a", "2026-10-03", 0.1], ["a", "2026-10-03", 0.2], ["b", "2026-10-03", -0.3],
    ["a", "2026-09-30", 1000], ["a", "2026-10-05", null],
  ].map(([account_id, trade_date, pnl], i) => ({ id: String(i), account_id, trade_date, pnl }));
  const { monthlyDays } = buildPeriodAnalyticsFromTrades(data, "lastMonth", "2026-11-15").summary;
  assert.deepEqual([monthlyDays.tradedDays, monthlyDays.profitableDays, monthlyDays.losingDays, monthlyDays.breakEvenDays], [3, 1, 1, 1]);
  assert.equal(monthlyDays.averageTradedDays, 3);
  assert.equal(monthlyDays.winDayRate, 33);
  const account = buildPeriodAnalyticsFromTrades(data.filter(t => t.account_id === "a"), "lastMonth", "2026-11-15").summary.monthlyDays;
  assert.equal(account.profitableDays, 3);
  assert.equal(account.losingDays, 0);
});

test("monthly whole-day estimates reconcile across unequal active months and empty outcomes", () => {
  const data = [
    ["2026-08-01", 100], ["2026-08-02", -50],
    ["2026-10-01", 100], ["2026-10-02", 100], ["2026-10-03", 0],
  ].map(([trade_date, pnl], i) => ({ id: String(i), trade_date, pnl }));
  const monthly = buildPeriodAnalyticsFromTrades(data, "all").summary.monthlyDays;
  assert.equal(monthly.activeMonths, 2);
  assert.equal(monthly.winDayRate, 60); // Use 3/5 actual days, not the rounded 2/3 monthly estimate.
  assert.equal(monthly.averageTradedDays, 3);
  assert.equal(monthly.averageProfitableDays + monthly.averageLosingDays + monthly.averageBreakEvenDays, 3);
  assert.deepEqual([monthly.averageProfitableDays, monthly.averageLosingDays, monthly.averageBreakEvenDays], [2, 1, 0]);
  const empty = buildPeriodAnalyticsFromTrades([], "all").summary.monthlyDays;
  assert.equal(empty.activeMonths, 0);
  assert.equal(empty.averageTradedDays, null);
  assert.equal(empty.winDayRate, null);
  const be = buildPeriodAnalyticsFromTrades([{ id: "be", trade_date: "2026-10-01", pnl: 0 }], "all").summary.monthlyDays;
  assert.deepEqual([be.averageProfitableDays, be.averageLosingDays, be.averageBreakEvenDays], [0, 0, 1]);
  assert.equal(be.winDayRate, 0);
});
