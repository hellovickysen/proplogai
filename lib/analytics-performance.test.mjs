import assert from "node:assert/strict";
import test from "node:test";
import { buildPerformanceHistory, performanceCalendarMonths, performanceWeeks, performanceDomain, performanceSvg, PERFORMANCE_CHART_HEIGHT } from "./analytics-performance.mjs";

const trade = (trade_date, pnl, id = trade_date) => ({ id, trade_date, pnl, closed_at: null });
test("history uses completed logged dates and cents, with explicit empty months", () => {
  const history = buildPerformanceHistory([trade("2026-06-01", 0.1), trade("2026-06-02", 0.2), trade("2026-06-03", -0.3), trade("2026-08-01", -10.25), trade("2026-08-02", null), trade("2026-02-30", 100), trade("bad", 100), trade("2026-08-03", "")]);
  assert.equal(history.trades.length, 4);
  assert.deepEqual(history.months.map(({ key, pnlCents, trades }) => [key, pnlCents, trades]), [["2026-06", 0, 3], ["2026-07", 0, 0], ["2026-08", -1025, 1]]);
});

test("weekly results stay inside the chosen month and reconcile exactly with monthly totals", () => {
  const input = Array.from({ length: 31 }, (_, i) => trade(`2026-10-${String(i + 1).padStart(2, "0")}`, i % 2 ? -5.11 : 10.25));
  input.push(trade("2026-09-30", 999), trade("2026-11-01", -999));
  const history = buildPerformanceHistory(input), weeks = performanceWeeks(history, "2026-10");
  assert.deepEqual(weeks.map(({ from, to }) => [from, to]), [["2026-10-01", "2026-10-04"], ["2026-10-05", "2026-10-11"], ["2026-10-12", "2026-10-18"], ["2026-10-19", "2026-10-25"], ["2026-10-26", "2026-10-31"]]);
  assert.equal(weeks.reduce((sum, row) => sum + row.trades, 0), 31);
  assert.equal(weeks.reduce((sum, row) => sum + row.pnlCents, 0), history.months.find(row => row.key === "2026-10").pnlCents);
});

test("calendar weeks cover six-week months and leap days without duplication", () => {
  for (const [month, length, expected] of [["2026-03", 31, 6], ["2024-02", 29, 5], ["2026-02", 28, 5]]) {
    const history = buildPerformanceHistory(Array.from({ length }, (_, i) => trade(`${month}-${String(i + 1).padStart(2, "0")}`, 1)));
    const rows = performanceWeeks(history, month);
    assert.equal(rows.length, expected);
    assert.equal(rows.reduce((sum, row) => sum + row.trades, 0), length);
    assert.equal(rows.reduce((sum, row) => sum + row.pnlCents, 0), length * 100);
  }
  assert.deepEqual(performanceWeeks(buildPerformanceHistory([]), "2026-13"), []);
});

test("multiple years remain distinct and no-trade weeks are not break-even outcomes", () => {
  const history = buildPerformanceHistory([trade("2025-10-02", 5), trade("2026-10-02", 0)]);
  assert.deepEqual(history.years, ["2025", "2026"]);
  const rows = performanceWeeks(history, "2026-10");
  assert.equal(rows[0].trades, 1);
  assert.equal(rows[0].pnlCents, 0);
  assert.equal(rows[1].trades, 0);
  const svg = performanceSvg({ rows, title: "Weekly", scope: "All", period: "All" });
  assert.ok(svg.includes("$0.00"));
  assert.ok(svg.includes("No trades"));
});

test("chart domains include zero and every signed value with finite coordinates", () => {
  for (const cents of [[], [0], [100, 500], [-100, -500], [-100, 1000], [1, -1]]) {
    const rows = cents.map(pnlCents => ({ pnlCents, trades: 1 })), domain = performanceDomain(rows);
    assert.ok(domain.low <= Math.min(0, ...cents));
    assert.ok(domain.high >= Math.max(0, ...cents));
    assert.ok(domain.high > domain.low);
    assert.ok(Number.isFinite(domain.step));
  }
});

test("shared chart markup escapes account context and contains no external resources", () => {
  const svg = performanceSvg({ rows: [{ key: "2026-10", label: "Oct", detail: "2026", pnlCents: 12345, trades: 2 }], title: "Monthly P&L", scope: '</text><script>alert("secret")</script>', period: "All time", light: true, interactive: true });
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes("+$123.45"));
  assert.ok(!svg.includes("<image"));
  assert.ok(!svg.includes("foreignObject"));
  assert.ok(!svg.includes("NaN"));
  assert.ok(svg.includes('data-month="2026-10"'));
  assert.ok(svg.includes('class="performance-hit"'));
});


test("styled artwork keeps its export dimensions and independent gradient references", () => {
  const rows = [
    { key: "2026-09", label: "Sep", detail: "2026", pnlCents: 20000, trades: 2 },
    { key: "2026-10", label: "Oct", detail: "2026", pnlCents: -10000, trades: 1 },
  ];
  for (const idPrefix of ["performance-dashboard", "performance-share"]) {
    const svg = performanceSvg({ rows, title: "Monthly", scope: "All", period: "All", idPrefix });
    assert.ok(svg.includes(`viewBox="0 0 1200 ${PERFORMANCE_CHART_HEIGHT}"`));
    assert.ok(svg.includes(`url(#${idPrefix}-positive)`));
    assert.ok(svg.includes(`id="${idPrefix}-positive"`));
    assert.ok(svg.includes("Profitable months"));
    assert.ok(svg.includes("Highest month · Sep"));
    assert.ok(svg.includes("+$100.00"));
    assert.ok(svg.includes("+$200.00"));
  }
});


test("calendar month selector includes every month and retains only actual logged totals", () => {
  const history = buildPerformanceHistory([trade("2026-06-01", 25), trade("2026-10-02", -10), trade("2025-01-01", 999)]);
  const months = performanceCalendarMonths(history, "2026");
  assert.equal(months.length, 12);
  assert.deepEqual(months.map(row => row.key), Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`));
  assert.equal(months[0].trades, 0);
  assert.equal(months[11].trades, 0);
  assert.equal(months.reduce((sum, row) => sum + row.trades, 0), 2);
  assert.equal(months.reduce((sum, row) => sum + row.pnlCents, 0), 1500);
  assert.ok(performanceWeeks(history, "2026-01").every(row => row.trades === 0 && row.pnlCents === 0));
  assert.deepEqual(performanceCalendarMonths(history, undefined), []);
  assert.deepEqual(performanceCalendarMonths(history, "bad"), []);
});
