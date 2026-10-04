import assert from "node:assert/strict";
import test from "node:test";
import { buildMockPeriodAnalytics, mockAnalyticsInternals } from "./mock-analytics-adapter.mjs";

test("missing P&L is incomplete while numeric zero is break-even", () => {
  assert.equal(mockAnalyticsInternals.isCompletedTrade({ trade_date: "2026-10-01", pnl: null }), false);
  assert.equal(mockAnalyticsInternals.isCompletedTrade({ trade_date: "2026-10-01", pnl: 0 }), true);
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
      analytics.summary.clean + analytics.summary.notFollowed + analytics.summary.needsEvidence,
      analytics.summary.totalTrades,
    );
    assert.equal(analytics.summary.totalTrades, analytics.trades.length);
    assert.equal(analytics.days.reduce((sum, day) => sum + day.trades, 0), analytics.trades.length);
    assert.equal(analytics.frequency.rows.reduce((sum, row) => sum + row.sampleDays, 0), analytics.frequency.completedDays);
    analytics.frequency.rows.forEach((row) => {
      assert.ok(Math.abs(row.green + row.red + row.breakEven - 100) <= 1 || row.sampleDays === 0);
    });
    analytics.days.forEach((day) => {
      assert.equal(day.clean + day.breached + day.unknown, day.trades);
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
