import assert from "node:assert/strict";
import test from "node:test";
import { attachRuleEvidence, withDisplayedRulebookDefaults } from "./rule-evidence.mjs";
import { appendRuleVersion, ruleForDate, ruleForTradeComparison, ruleSnapshot } from "../../../../lib/rulebook-history.mjs";

const rule = (rule_key, extra = {}) => ({ id: rule_key, rule_key, enabled: true, account_id: null, ...extra });
const trade = (extra = {}) => ({ id: "t1", account_id: "a1", pnl: 0, session: "London", setup_follow_map: {}, ...extra });

test("missing evidence never becomes clean, and explicit breaches remain visible", () => {
  const rules = [rule("risk_per_trade", { value: "100" }), rule("trade_my_setup")];
  assert.equal(attachRuleEvidence([trade({ setup_followed: "yes" })], rules)[0].evidenceStatus, "unknown");
  assert.equal(attachRuleEvidence([trade({ setup_followed: "no" })], rules)[0].evidenceStatus, "broken");
});

test("saved evaluations complete all applicable rule checks", () => {
  const rules = [rule("never_move_stop_loss"), rule("trade_my_setup")];
  const saved = [
    { trade_id: "t1", rule_key: "never_move_stop_loss", outcome: "followed", rule_snapshot: { id: "never_move_stop_loss" }, evidence: { source: "manual" } },
    { trade_id: "t1", rule_key: "setup_adherence", outcome: "followed" },
  ];
  const reviewedTrade = trade({ setup_follow_map: { breakout: "yes" } });
  assert.equal(attachRuleEvidence([reviewedTrade], rules, saved)[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([reviewedTrade], rules, saved.slice(1))[0].evidenceStatus, "unknown");
  assert.equal(attachRuleEvidence([reviewedTrade], rules, [{ ...saved[0], rule_snapshot: { id: "old-rule" } }, saved[1]])[0].evidenceStatus, "unknown");
});

test("realized P&L cannot validate a planned-risk evaluation", () => {
  const rules = [rule("risk_per_trade", { value: "100" })];
  const legacy = [{ trade_id: "t1", rule_key: "risk_per_trade", outcome: "followed", rule_snapshot: { id: "risk_per_trade" }, evidence: { pnl: 50, loss: 0 } }];
  assert.equal(attachRuleEvidence([trade({ pnl: 50 })], rules, legacy)[0].evidenceStatus, "unknown");
  const reviewed = [{ ...legacy[0], evidence: { source: "manual", note: "Checked position plan" } }];
  assert.equal(attachRuleEvidence([trade({ pnl: 50 })], rules, reviewed)[0].evidenceStatus, "clean");
});

test("an emotion tag alone does not prove a FOMO entry violated the rule", () => {
  const rules = [rule("no_fomo_entries")];
  assert.equal(attachRuleEvidence([trade({ emotions: ["FOMO"] })], rules)[0].evidenceStatus, "unknown");
});

test("account overrides apply only to the matching account", () => {
  const rules = [rule("maximum_lot_contract_size", { value: "2" }), rule("maximum_lot_contract_size", { id: "override", account_id: "a1", value: "1" })];
  assert.equal(attachRuleEvidence([trade({ lot_size: 1.5 })], rules)[0].evidenceStatus, "broken");
  assert.equal(attachRuleEvidence([trade({ account_id: "a2", lot_size: 1.5 })], rules)[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([trade({ lot_size: null })], rules)[0].evidenceStatus, "unknown");
  assert.equal(attachRuleEvidence([trade({ lot_size: 3 })], [...rules, rule("maximum_lot_contract_size", { id: "disabled-override", account_id: "a1", enabled: false })])[0].evidenceStatus, "unknown");
});

test("P&L is not rule evidence; session and setup reviews are", () => {
  const rules = [rule("trading_hours", { metadata: { sessions: ["London"] } }), rule("trade_my_setup")];
  assert.equal(attachRuleEvidence([trade({ pnl: 500, setup_follow_map: { breakout: "yes" } })], rules)[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([trade({ pnl: 500, session: "Asian", setup_follow_map: { breakout: "yes" } })], rules)[0].evidenceStatus, "partial");
  assert.equal(attachRuleEvidence([trade({ pnl: 500 })], rules)[0].evidenceStatus, "unknown");
});

test("No Setup is a saved setup-rule breach, while green follow tags prove adherence", () => {
  const rules = [rule("trade_my_setup")];
  assert.equal(attachRuleEvidence([trade({ setup: "No Setup" })], rules)[0].evidenceStatus, "broken");
  assert.equal(attachRuleEvidence([trade({ no_setup_reason: "Impulsive entry" })], rules)[0].evidenceStatus, "broken");
  assert.equal(attachRuleEvidence([trade({ setup: "London Sweep", setup_follow_map: { sweep: "yes" } })], rules)[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([trade({ setup: "London Sweep", setup_follow_map: { sweep: "partial" } })], rules)[0].evidenceStatus, "partial");
  assert.equal(attachRuleEvidence([trade({ setup: "No Setup" })], [])[0].evidenceStatus, "broken");
});

test("displayed defaults compare all trades without becoming historical personal rules", () => {
  const defaults = withDisplayedRulebookDefaults([]);
  const oversized = attachRuleEvidence([trade({ trade_date: "2026-10-02", pnl: -1287, lot_size: 4 })], defaults)[0];
  assert.equal(oversized.ruleStatus, "broken");
  assert.equal(oversized.ruleComparisonRetrospective, true);
  const within = attachRuleEvidence([trade({ trade_date: "2026-08-04", pnl: -109.8, lot_size: 1 })], defaults)[0];
  assert.equal(within.ruleStatus, "followed");
  assert.equal(within.ruleComparisonRetrospective, true);
  assert.equal(defaults.every((item) => item.displayDefault && !item.effective_from), true);

  const saved = withDisplayedRulebookDefaults([rule("maximum_lot_contract_size", { value: "5" })]);
  assert.equal(saved.filter((item) => item.rule_key === "maximum_lot_contract_size").length, 1);
  assert.equal(attachRuleEvidence([trade({ trade_date: "2026-10-02", pnl: 0, lot_size: 4 })], saved)[0].ruleStatus, "followed");

  const accountOverride = withDisplayedRulebookDefaults([rule("maximum_lot_contract_size", { id: "override", account_id: "a1", value: "2" })]);
  assert.equal(attachRuleEvidence([trade({ trade_date: "2026-10-02", pnl: 0, lot_size: 1.5 })], accountOverride)[0].ruleStatus, "followed");
  assert.equal(attachRuleEvidence([trade({ id: "a2", account_id: "a2", trade_date: "2026-10-02", pnl: 0, lot_size: 1.5 })], accountOverride)[0].ruleStatus, "broken");
});

test("saved contract maximum applies to each trade, including the screenshot examples", () => {
  const rules = [rule("maximum_lot_contract_size", { value: "1" })];
  assert.equal(attachRuleEvidence([trade({ lot_size: 1 })], rules)[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([trade({ lot_size: 4 })], rules)[0].evidenceStatus, "broken");
  assert.equal(attachRuleEvidence([trade({ lot_size: null })], rules)[0].evidenceStatus, "unknown");
});

test("daily loss uses completed net P&L per account and date, not each trade alone", () => {
  const rules = [rule("daily_loss_limit", { value: "250" })];
  const trades = [
    trade({ id: "loss", trade_date: "2026-08-04", pnl: -109.8 }),
    trade({ id: "second-loss", trade_date: "2026-08-04", pnl: -150 }),
    trade({ id: "exact-limit", trade_date: "2026-08-05", pnl: -250 }),
    trade({ id: "large-loss", trade_date: "2026-10-02", pnl: -1287 }),
    trade({ id: "other-account", account_id: "a2", trade_date: "2026-10-02", pnl: 100 }),
    trade({ id: "unclosed", trade_date: "2026-10-02", pnl: null }),
  ];
  const result = attachRuleEvidence(trades, rules);
  assert.deepEqual(result.map((row) => row.evidenceStatus), ["broken", "broken", "clean", "broken", "clean", "unknown"]);
  assert.deepEqual(result.slice(0, 2).map((row) => row.dayRuleBreach), [true, true]);
  assert.equal(result[3].dayRuleBreach, true);
  assert.equal(result[4].dayRuleBreach, false);
});

test("daily loss groups legacy trades by creation date and follows changed saved limits", () => {
  const legacy = trade({ created_at: "2026-10-02T18:00:00Z", pnl: -300 });
  assert.equal(attachRuleEvidence([legacy], [rule("daily_loss_limit", { value: "250" })])[0].evidenceStatus, "broken");
  assert.equal(attachRuleEvidence([legacy], [rule("daily_loss_limit", { value: "350" })])[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([trade({ pnl: -300 })], [rule("daily_loss_limit", { value: "250" })])[0].evidenceStatus, "unknown");
});

test("a recovered multi-trade day does not automatically prove the stop-trading rule", () => {
  const rules = [rule("daily_loss_limit", { value: "250" })];
  const trades = [
    trade({ id: "early-loss", trade_date: "2026-10-03", pnl: -300 }),
    trade({ id: "later-win", trade_date: "2026-10-03", pnl: 100 }),
  ];
  assert.deepEqual(attachRuleEvidence(trades, rules).map((row) => row.evidenceStatus), ["unknown", "unknown"]);
});

test("daily loss compares exact currency cents at the saved boundary", () => {
  const rules = [rule("daily_loss_limit", { value: "250" })];
  assert.equal(attachRuleEvidence([trade({ trade_date: "2026-10-04", pnl: -250 })], rules)[0].evidenceStatus, "clean");
  assert.equal(attachRuleEvidence([trade({ trade_date: "2026-10-04", pnl: -250.01 })], rules)[0].evidenceStatus, "broken");
});

test("a per-account daily limit identifies breached days without claiming which trade crossed it", () => {
  const rules = [rule("maximum_trades_per_day", { value: "2" })];
  const trades = [
    trade({ id: "one", trade_date: "2026-10-01" }),
    trade({ id: "two", trade_date: "2026-10-01" }),
    trade({ id: "three", trade_date: "2026-10-01" }),
    trade({ id: "other-account", account_id: "a2", trade_date: "2026-10-01" }),
    trade({ id: "no-pnl", trade_date: "2026-10-01", pnl: null }),
  ];
  const result = attachRuleEvidence(trades, rules);
  assert.deepEqual(result.slice(0, 3).map((row) => row.dayRuleBreach), [true, true, true]);
  assert.deepEqual(result.slice(0, 3).map((row) => row.evidenceStatus), ["broken", "broken", "broken"]);
  assert.equal(result[3].dayRuleBreach, false);
  assert.equal(result[3].evidenceStatus, "clean");
});

test("a changed daily trade limit applies by trading date without rewriting earlier days", () => {
  const history = [
    { effective_from: "2026-10-01", recorded_at: "2026-10-16T10:00:00Z", value: "3", unit: "trades", enabled: true, settings: {} },
    { effective_from: "2026-10-15", recorded_at: "2026-10-16T10:01:00Z", value: "1", unit: "trades", enabled: true, settings: {} },
  ];
  const rules = [rule("maximum_trades_per_day", { value: "1", updated_at: "2026-10-16T10:01:00Z", metadata: { effective_history: history } })];
  const trades = [
    trade({ id: "before-1", trade_date: "2026-09-30" }),
    trade({ id: "old-1", trade_date: "2026-10-14" }),
    trade({ id: "old-2", trade_date: "2026-10-14" }),
    trade({ id: "new-1", trade_date: "2026-10-15" }),
    trade({ id: "new-2", trade_date: "2026-10-15" }),
  ];
  const result = attachRuleEvidence(trades, rules);
  assert.deepEqual(result.map((row) => row.dayRuleBreach), [false, false, false, true, true]);
  assert.deepEqual(result.map((row) => row.evidenceStatus), ["clean", "clean", "clean", "broken", "broken"]);
  assert.equal(result[0].ruleComparisonRetrospective, true);
  assert.equal(result[1].ruleComparisonRetrospective, false);
});

test("legacy rules begin at their last saved date, and backdated entries can fill gaps", () => {
  const legacy = rule("maximum_lot_contract_size", { value: "1", updated_at: "2026-10-15T09:00:00Z", metadata: {} });
  assert.equal(ruleForDate(legacy, "2026-10-14"), null);
  assert.equal(ruleForDate(legacy, "2026-10-15").value, "1");
  const history = appendRuleVersion(legacy, { value: "3", unit: "lots", enabled: true, metadata: {} }, "2026-10-01", "2026-10-16T09:00:00Z");
  const saved = { ...legacy, metadata: { effective_history: history } };
  assert.equal(ruleForDate(saved, "2026-10-10").value, "3");
  assert.equal(ruleForDate(saved, "2026-10-15").value, "1");
  assert.equal(ruleForTradeComparison(saved, "2026-09-30").value, "3");
  assert.equal(ruleForTradeComparison(saved, "2026-09-30").retrospective, true);
});

test("an account override starts only on its date; earlier trades use a saved global rule", () => {
  const global = rule("maximum_lot_contract_size", { value: "3", updated_at: "2026-10-01T08:00:00Z" });
  const override = rule("maximum_lot_contract_size", { id: "account-override", account_id: "a1", value: "1", updated_at: "2026-10-15T08:00:00Z" });
  const before = trade({ id: "before", trade_date: "2026-10-14", lot_size: 2 });
  const after = trade({ id: "after", trade_date: "2026-10-15", lot_size: 2 });
  const other = trade({ id: "other", account_id: "a2", trade_date: "2026-10-15", lot_size: 2 });
  assert.deepEqual(attachRuleEvidence([before, after, other], [global, override]).map((row) => row.evidenceStatus), ["clean", "broken", "clean"]);
});

test("partly followed setup is orange, all followed is clean, and no setup is not followed", () => {
  const rules = [rule("trade_my_setup")];
  const rows = [
    trade({ id: "partial", setup_follow_map: { first: "yes", second: "no" } }),
    trade({ id: "clean", setup_follow_map: { first: "yes", second: "yes" } }),
    trade({ id: "broken", setup: "No Setup" }),
  ];
  assert.deepEqual(attachRuleEvidence(rows, rules).map((row) => row.evidenceStatus), ["partial", "clean", "broken"]);
});

test("setup status stays separate from behavioural Rulebook evidence", () => {
  const rules = [rule("never_move_stop_loss")];
  const rows = [
    trade({ id: "all-green", setup: "Breakout, Good SL", setup_follow_map: { breakout: "yes", sl: "yes" } }),
    trade({ id: "one-orange", setup: "Breakout, Good SL", setup_follow_map: { breakout: "yes", sl: "partial" } }),
    trade({ id: "no-setup", setup: "No Setup" }),
  ];
  const result = attachRuleEvidence(rows, rules);
  assert.deepEqual(result.map((row) => row.setupStatus), ["followed", "partial", "broken"]);
  assert.deepEqual(result.map((row) => row.ruleStatus), ["unknown", "unknown", "unknown"]);
  assert.equal(result[0].evidenceStatus, "unknown");
});

test("pinned Good SL and Bad SL tags follow the trade-detail badge colors", () => {
  const result = attachRuleEvidence([
    trade({ id: "good", setup: "Good SL" }),
    trade({ id: "bad", setup: "Bad SL" }),
    trade({ id: "not-reviewed", setup: "Breakout" }),
  ], []);
  assert.deepEqual(result.map((row) => row.setupStatus), ["followed", "broken", "unknown"]);
});

test("saved lot, daily-loss, and session rules map without changing green setup status", () => {
  const rules = [
    rule("maximum_lot_contract_size", { value: "1" }),
    rule("daily_loss_limit", { value: "250" }),
    rule("trading_hours", { metadata: { sessions: ["London"] } }),
  ];
  const rows = [
    trade({ id: "within-limits", trade_date: "2026-10-01", pnl: -100, lot_size: 1, session: "London", setup_follow_map: { breakout: "yes" } }),
    trade({ id: "oversized", trade_date: "2026-10-02", pnl: -10, lot_size: 2, session: "London", setup_follow_map: { breakout: "yes" } }),
    trade({ id: "daily-limit", trade_date: "2026-10-03", pnl: -251, lot_size: 1, session: "London", setup_follow_map: { breakout: "yes" } }),
    trade({ id: "outside-session", trade_date: "2026-10-04", pnl: 100, lot_size: 1, session: "Asian", setup_follow_map: { breakout: "yes" } }),
  ];
  const result = attachRuleEvidence(rows, rules);
  assert.deepEqual(result.map((row) => row.setupStatus), ["followed", "followed", "followed", "followed"]);
  assert.deepEqual(result.map((row) => row.ruleStatus), ["followed", "broken", "broken", "broken"]);
});


test("lot and daily-loss history use the dated limit on both sides of a change", () => {
  const version = (date, value) => ({ effective_from: date, recorded_at: date + "T06:00:00Z", value, enabled: true, settings: {} });
  const lot = rule("maximum_lot_contract_size", { updated_at: "2026-10-15T06:00:00Z", metadata: { effective_history: [version("2026-10-01", "2"), version("2026-10-15", "1")] } });
  const loss = rule("daily_loss_limit", { updated_at: "2026-10-15T06:00:00Z", metadata: { effective_history: [version("2026-10-01", "500"), version("2026-10-15", "250")] } });
  const trades = [trade({ id: "before", trade_date: "2026-10-14", lot_size: 1.5, pnl: -300 }), trade({ id: "after", trade_date: "2026-10-15", lot_size: 1.5, pnl: -300 })];
  assert.deepEqual(attachRuleEvidence(trades, [lot, loss]).map(t => t.ruleStatus), ["followed", "broken"]);
});

test("a manual review for an older same-date rule revision is not reused", () => {
  const first = { effective_from: "2026-10-01", recorded_at: "2026-10-01T06:00:00Z", value: "", unit: null, enabled: true, settings: { instruction: "old" } };
  const original = rule("never_move_stop_loss", { updated_at: first.recorded_at, metadata: { effective_history: [first] } });
  const t = trade({ trade_date: "2026-10-02" });
  const saved = [{ trade_id: t.id, rule_key: original.rule_key, outcome: "followed", evidence: { source: "manual" }, rule_snapshot: ruleSnapshot(ruleForDate(original, t.trade_date)) }];
  assert.equal(attachRuleEvidence([t], [original], saved)[0].evidenceStatus, "clean");
  const later = { ...original, metadata: { effective_history: [first, { ...first, effective_from: "2026-10-15", recorded_at: "2026-10-15T07:00:00Z", settings: { instruction: "new" } }] } };
  assert.equal(attachRuleEvidence([t], [later], saved)[0].evidenceStatus, "clean", "a later effective change preserves the earlier review");
  const revised = { ...original, metadata: { effective_history: [first, { ...first, recorded_at: "2026-10-01T07:00:00Z", settings: { instruction: "new" } }] } };
  assert.equal(attachRuleEvidence([t], [revised], saved)[0].evidenceStatus, "unknown");
});

test("session overrides and disabled account rules respect historical effective dates", () => {
  const versions = [{ effective_from: "2026-10-01", recorded_at: "2026-10-01T06:00:00Z", enabled: true, settings: { sessions: ["London"] } }, { effective_from: "2026-10-15", recorded_at: "2026-10-15T06:00:00Z", enabled: true, settings: { sessions: ["New York"] } }];
  const sessions = rule("trading_hours", { updated_at: "2026-10-15T06:00:00Z", metadata: { effective_history: versions } });
  assert.deepEqual(attachRuleEvidence([trade({ trade_date: "2026-10-14", session: "London" }), trade({ trade_date: "2026-10-15", session: "London" }), trade({ trade_date: "2026-10-15", session: "New York" })], [sessions]).map(t => t.ruleStatus), ["followed", "broken", "followed"]);
  const override = rule("maximum_lot_contract_size", { id: "disabled", account_id: "a1", updated_at: "2026-10-15T06:00:00Z", metadata: { effective_history: [{ ...versions[1], enabled: false, value: "1" }] } });
  const global = rule("maximum_lot_contract_size", { value: "2", updated_at: "2026-10-01T06:00:00Z" });
  assert.deepEqual(attachRuleEvidence([trade({ trade_date: "2026-10-14", lot_size: 3 }), trade({ trade_date: "2026-10-15", lot_size: 3 })], [global, override]).map(t => t.ruleStatus), ["broken", "unknown"]);
});
