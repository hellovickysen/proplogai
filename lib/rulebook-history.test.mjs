import test from "node:test";
import assert from "node:assert/strict";
import { rulebookDate, validRuleDate, ruleVersionFromRow, ruleVersions, appendRuleVersion, latestRuleVersion, ruleForDate, ruleForTradeComparison, ruleSnapshot, ruleSnapshotKey, ruleHistoryEntries, recentRuleHistory } from "./rulebook-history.mjs";
const entry = (date, value, recorded = date + "T04:00:00Z", extra = {}) => ({ effective_from: date, value, unit: "trades", enabled: true, settings: {}, recorded_at: recorded, ...extra });
const row = (history) => ({ id: "limit", rule_key: "maximum_trades_per_day", title: "Trades per day", updated_at: "2026-10-20T09:00:00Z", metadata: { effective_history: history } });

test("reporting dates use IST across UTC midnight and validate real calendar dates", () => {
  assert.equal(rulebookDate("2026-10-14T18:29:59Z"), "2026-10-14");
  assert.equal(rulebookDate("2026-10-14T18:30:00Z"), "2026-10-15");
  assert.equal(rulebookDate("invalid"), null);
  for (const date of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-1-01"]) assert.equal(validRuleDate(date), false);
  assert.equal(validRuleDate("2028-02-29"), true);
  assert.equal(ruleVersionFromRow({ value: "1", updated_at: "2026-10-14T20:00:00Z" }).effective_from, "2026-10-15");
});

test("later changes and future versions preserve the rule used on earlier dates", () => {
  const old = row([entry("2026-10-01", "3")]);
  const history = appendRuleVersion(old, { value: "1", enabled: true }, "2026-10-15", "2026-10-15T06:00:00Z");
  const withFuture = appendRuleVersion(row(history), { value: "2", enabled: true }, "2026-12-01", "2026-10-20T06:00:00Z");
  assert.equal(ruleForDate(row(withFuture), "2026-10-14").value, "3");
  assert.equal(ruleForDate(row(withFuture), "2026-10-15").value, "1");
  assert.equal(latestRuleVersion(withFuture, "2026-11-14").value, "1");
  assert.equal(ruleForDate(row(withFuture), "2026-12-01").value, "2");
  assert.equal(ruleForDate(row(withFuture), "2026-09-30"), null);
  assert.equal(ruleForTradeComparison(row(withFuture), "2026-09-30").retrospective, true);
  assert.equal(old.metadata.effective_history.length, 1);
});

test("same-date revisions sort by timestamp instants, including timezone offsets", () => {
  const history = [entry("2026-10-01", "3", "2026-10-01T10:00:00+05:30"), entry("2026-10-01", "1", "2026-10-01T05:00:00Z")];
  assert.equal(ruleForDate(row(history), "2026-10-02").value, "1");
  assert.equal(ruleForDate(row(history), "2026-10-02").version_recorded_at, history[1].recorded_at);
});

test("disabled intervals and later re-enabling stay attached to their own dates", () => {
  const r = row([entry("2026-10-01", "3"), entry("2026-10-15", "3", undefined, { enabled: false }), entry("2026-10-20", "1")]);
  assert.equal(ruleForDate(r, "2026-10-14").enabled, true);
  assert.equal(ruleForDate(r, "2026-10-15").enabled, false);
  assert.equal(ruleForDate(r, "2026-10-20").enabled, true);
});

test("legacy snapshots retain their provenance when the first real change is appended", () => {
  const legacy = { id: "old", title: "Daily limit", value: "250", updated_at: "2026-10-14T20:00:00Z", metadata: {} };
  const history = appendRuleVersion(legacy, { title: "Daily limit", value: "200", metadata: {} }, "2026-10-20", "2026-10-20T04:00:00Z");
  const records = ruleHistoryEntries([{ ...legacy, metadata: { effective_history: history } }], new Date("2026-11-14T06:00:00Z"));
  assert.equal(ruleVersions(legacy)[0].effective_from, "2026-10-15");
  assert.equal(records[0].legacy, false);
  assert.equal(records[1].legacy, true);
  assert.equal(records[1].title, "Daily limit");
});

test("recent history uses a clamped calendar-month boundary in IST and excludes future recorded timestamps", () => {
  const records = [entry("2026-01-01", "1", "2026-02-27T18:29:59Z"), entry("2026-01-01", "1", "2026-02-27T18:30:00Z"), entry("2026-01-01", "1", "2026-05-31T10:00:01Z")];
  assert.deepEqual(recentRuleHistory(records, "2026-05-31T10:00:00Z"), [records[1]]);
  const scheduled = ruleHistoryEntries([row([entry("2026-12-01", "1", "2026-11-14T04:00:00Z")])], "2026-11-14T06:00:00Z");
  assert.equal(scheduled[0].scheduled, true);
  assert.equal(recentRuleHistory(scheduled, "2026-11-14T06:00:00Z").length, 1);
});

test("snapshot keys track revisions and settings while ignoring object key order", () => {
  const r = ruleForDate(row([entry("2026-10-01", "3", undefined, { settings: { sessions: ["London"], enabled: true } })]), "2026-10-02");
  assert.equal(ruleSnapshot(r).version_recorded_at, "2026-10-01T04:00:00Z");
  assert.equal(ruleSnapshotKey(r), ruleSnapshotKey({ ...r, metadata: { enabled: true, sessions: ["London"] } }));
  assert.notEqual(ruleSnapshotKey(r), ruleSnapshotKey({ ...r, version_recorded_at: "2026-10-01T05:00:00Z" }));
  assert.equal(ruleForDate(r, "2026-10-03"), null);
  assert.throws(() => appendRuleVersion(null, {}, "2026-02-30", "2026-01-01T00:00:00Z"));
  assert.throws(() => appendRuleVersion(null, {}, "2026-01-01", "invalid"));
});
