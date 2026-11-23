import assert from "node:assert/strict";
import test from "node:test";
import { buildPerformanceHistory } from "./analytics-performance.mjs";
import { buildPerformanceTable } from "./analytics-performance-table.mjs";

const trade = (trade_date, pnl, account_id = "main") => ({ trade_date, pnl, account_id });

test("win days net all selected accounts on a date and keep break-even in denominators", () => {
  const history = buildPerformanceHistory([
    trade("2026-09-01", 100), trade("2026-09-01", -120, "other"),
    trade("2026-09-02", 50), trade("2026-09-02", -50),
    trade("2026-09-03", 30), trade("2026-09-04", null),
  ]);
  const { total, rows } = buildPerformanceTable(history, { year: "2026" });
  assert.equal(total.trades, 5);
  assert.equal(total.wins, 3);
  assert.equal(total.losses, 2);
  assert.equal(total.pnlCents, 1000);
  assert.equal(total.winRate, 60);
  assert.equal(total.tradedDays, 3);
  assert.equal(total.winDays, 1);
  assert.equal(total.losingDays, 1);
  assert.equal(total.flatDays, 1);
  assert.ok(Math.abs(total.winDayRate - 100 / 3) < 1e-10);
  assert.deepEqual(rows[0].winDayRate, total.winDayRate);
});

test("totals use raw denominators and selected year rather than averaging monthly rates", () => {
  const history = buildPerformanceHistory([
    trade("2025-12-31", 900), trade("2026-01-01", 10),
    trade("2026-03-01", -1), trade("2026-03-02", -1), trade("2026-03-03", 0),
  ]);
  const { total, rows } = buildPerformanceTable(history, { year: "2026" });
  assert.equal(total.trades, 4);
  assert.equal(total.winRate, 25);
  assert.equal(total.winDayRate, 25);
  assert.equal(total.pnlCents, 800);
  assert.equal(rows[1].trades, 0);
  assert.equal(rows[1].winRate, null);
  assert.equal(rows[1].winDayRate, null);
  assert.equal(rows[2].breakEven, 1);
  assert.equal(total.pnlCents, rows.reduce((sum, row) => sum + row.pnlCents, 0));
});

test("weekly drilldown reconciles trades, P&L and unique days within the month", () => {
  const history = buildPerformanceHistory([
    trade("2026-09-30", 999), trade("2026-10-01", 10.11),
    trade("2026-10-04", -3.22), trade("2026-10-05", 0),
    trade("2026-10-31", 1.11), trade("2026-11-01", -999),
  ]);
  const monthly = buildPerformanceTable(history, { year: "2026" }).rows.find(row => row.key === "2026-10");
  const { rows, total } = buildPerformanceTable(history, { mode: "Weekly", month: "2026-10" });
  for (const key of ["trades", "pnlCents", "tradedDays", "winDays", "wins", "losses", "breakEven"]) {
    assert.equal(rows.reduce((sum, row) => sum + row[key], 0), monthly[key]);
    assert.equal(total[key], monthly[key]);
  }
  assert.equal(total.winDayRate, 50);
  assert.equal(rows[2].winDayRate, null);
});

test("empty selected months and no data show unknown rates, not invented percentages", () => {
  const history = buildPerformanceHistory([trade("2026-10-02", 0)]);
  const actual = buildPerformanceTable(history, { mode: "Weekly", month: "2026-10" });
  assert.equal(actual.total.winRate, 0);
  assert.equal(actual.total.winDayRate, 0);
  const empty = buildPerformanceTable(history, { mode: "Weekly", month: "2026-01" });
  assert.equal(empty.total.trades, 0);
  assert.equal(empty.total.winRate, null);
  assert.ok(empty.rows.every(row => row.tradedDays === 0 && row.winDayRate === null));
  assert.deepEqual(buildPerformanceTable(buildPerformanceHistory([])).rows, []);
});


test("details calculate trade averages and profit factor from gross outcomes, excluding BE", () => {
  const history = buildPerformanceHistory([
    trade("2026-09-01", 100.11), trade("2026-09-02", 200.22),
    trade("2026-09-03", -50.33), trade("2026-09-04", -25.44), trade("2026-09-05", 0),
    trade("2026-10-01", 999),
  ]);
  const monthly = buildPerformanceTable(history, { year: "2026" }).rows.find(row => row.key === "2026-09");
  const weekly = buildPerformanceTable(history, { mode: "Weekly", month: "2026-09" });
  for (const row of [monthly, weekly.total, weekly.rows[0]]) {
    assert.equal(row.grossProfitCents, 30033);
    assert.equal(row.grossLossCents, 7577);
    assert.equal(row.averageWinCents, 15016.5);
    assert.equal(row.averageLossCents, -3788.5);
    assert.ok(Math.abs(row.profitFactor - 30033 / 7577) < 1e-10);
    assert.equal(row.winDays + row.losingDays + row.flatDays, row.tradedDays);
  }
});

test("details handle all-win, all-loss, break-even and empty samples without Infinity", () => {
  const rows = buildPerformanceTable(buildPerformanceHistory([
    trade("2026-01-01", 10), trade("2026-02-01", -5), trade("2026-03-01", 0),
  ]), { year: "2026" }).rows;
  assert.equal(rows[0].profitFactor, null);
  assert.equal(rows[0].grossProfitCents, 1000);
  assert.equal(rows[0].grossLossCents, 0);
  assert.equal(rows[0].averageLossCents, null);
  assert.equal(rows[1].profitFactor, 0);
  assert.equal(rows[1].averageWinCents, null);
  assert.equal(rows[1].averageLossCents, -500);
  assert.equal(rows[2].profitFactor, null);
  assert.equal(rows[2].averageWinCents, null);
  assert.equal(rows[2].averageLossCents, null);
  const empty = buildPerformanceTable(buildPerformanceHistory([])).total;
  assert.equal(empty.profitFactor, null);
  assert.equal(empty.averageWinCents, null);
  assert.equal(empty.averageLossCents, null);
  assert.equal(empty.winDays + empty.losingDays + empty.flatDays, 0);
});
