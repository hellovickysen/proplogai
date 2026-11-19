"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  setupComposition,
  compareSetupEvidence,
  buildMockPeriodAnalytics,
  buildPeriodAnalyticsFromTrades,
} from "./mock-analytics-adapter.mjs";
import PerformanceHistory from "@/components/analytics/PerformanceHistory";
import PerformanceTable from "@/components/analytics/PerformanceTable";
import { loggedSetupStatus } from "@/app/api/ai-analytics/local-data/rule-evidence.mjs";
const IntroMotionContext = createContext(false);
const INTRO_SESSION_KEY = "proplogai:ai-analytics:intro-v1";
const PERIOD_SESSION_KEY = "proplogai:ai-analytics:period-v1";
const REPORTING_TIME_ZONE = "Asia/Kolkata";

function getReportingMonthLabels(now = new Date()) {
  const numericParts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORTING_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(numericParts.find((part) => part.type === "year")?.value);
  const month = Number(numericParts.find((part) => part.type === "month")?.value);
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
  });
  return {
    current: monthFormatter.format(new Date(Date.UTC(year, month - 1, 15))),
    previous: monthFormatter.format(new Date(Date.UTC(year, month - 2, 15))),
  };
}

const reportingMonths = getReportingMonthLabels();

const periodProfiles = {
  thisMonth: {
    label: `This month (${reportingMonths.current})`,
    chartLabel: reportingMonths.current,
    completedDays: 12,
    activeMonths: 1,
    setupFactor: 0.26,
    dayFactor: 0.24,
    pnlFactor: 1.08,
    qualityAdjustment: 2,
    discipline: 86,
    disciplineDelta: 4,
    totalTrades: 63,
    totalTradesDelta: 7,
    clean: 52,
    cleanDelta: 8,
    notFollowed: 11,
    notFollowedDelta: -1,
    kpis: [
      { label: "Rule adherence", value: 90, type: "shield", delta: 3 },
      { label: "Setup adherence", value: 85, type: "target", delta: 2 },
      { label: "Risk consistency", value: 79, type: "scale", delta: 1 },
      { label: "Post-loss discipline", value: 74, type: "focus", delta: 4 },
    ],
    outcomes: { pnl: "+$2,740", winRate: "60%", drawdown: "-$980" },
  },
  thisWeek: {
    label: "This week",
    chartLabel: "This wk",
    completedDays: 3,
    activeMonths: 0.15,
    setupFactor: 0.07,
    dayFactor: 0.07,
    pnlFactor: 1.15,
    qualityAdjustment: 3,
    discipline: 88,
    disciplineDelta: 5,
    totalTrades: 16,
    totalTradesDelta: 3,
    clean: 14,
    cleanDelta: 4,
    notFollowed: 2,
    notFollowedDelta: -1,
    kpis: [
      { label: "Rule adherence", value: 92, type: "shield", delta: 5 },
      { label: "Setup adherence", value: 86, type: "target", delta: 3 },
      { label: "Risk consistency", value: 81, type: "scale", delta: 2 },
      { label: "Post-loss discipline", value: 76, type: "focus", delta: 5 },
    ],
    outcomes: { pnl: "+$940", winRate: "63%", drawdown: "-$260" },
  },
  lastWeek: {
    label: "Last week",
    chartLabel: "Last wk",
    completedDays: 5,
    activeMonths: 0.25,
    setupFactor: 0.11,
    dayFactor: 0.11,
    pnlFactor: 0.92,
    qualityAdjustment: -1,
    discipline: 83,
    disciplineDelta: -2,
    totalTrades: 24,
    totalTradesDelta: -5,
    clean: 19,
    cleanDelta: -3,
    notFollowed: 5,
    notFollowedDelta: -2,
    kpis: [
      { label: "Rule adherence", value: 87, type: "shield", delta: -1 },
      { label: "Setup adherence", value: 83, type: "target", delta: 2 },
      { label: "Risk consistency", value: 79, type: "scale", delta: -3 },
      { label: "Post-loss discipline", value: 71, type: "focus", delta: 1 },
    ],
    outcomes: { pnl: "+$1,120", winRate: "58%", drawdown: "-$510" },
  },
  lastMonth: {
    label: `Last month (${reportingMonths.previous})`,
    chartLabel: reportingMonths.previous,
    completedDays: 21,
    activeMonths: 1,
    setupFactor: 0.42,
    dayFactor: 0.36,
    pnlFactor: 0.97,
    qualityAdjustment: -2,
    discipline: 82,
    disciplineDelta: -1,
    totalTrades: 108,
    totalTradesDelta: -6,
    clean: 84,
    cleanDelta: -7,
    notFollowed: 24,
    notFollowedDelta: 1,
    kpis: [
      { label: "Rule adherence", value: 87, type: "shield", delta: -1 },
      { label: "Setup adherence", value: 80, type: "target", delta: -2 },
      { label: "Risk consistency", value: 75, type: "scale", delta: -1 },
      { label: "Post-loss discipline", value: 69, type: "focus", delta: -2 },
    ],
    outcomes: { pnl: "+$3,760", winRate: "55%", drawdown: "-$1,920" },
  },
  all: {
    label: "All time",
    chartLabel: "All",
    completedDays: 243,
    activeMonths: 13.5,
    setupFactor: 1,
    dayFactor: 1,
    pnlFactor: 1,
    qualityAdjustment: 0,
    discipline: 82,
    disciplineDelta: null,
    totalTrades: 724,
    totalTradesDelta: null,
    clean: 572,
    cleanDelta: null,
    notFollowed: 152,
    notFollowedDelta: null,
    kpis: [
      { label: "Rule adherence", value: 86, type: "shield", delta: null },
      { label: "Setup adherence", value: 81, type: "target", delta: null },
      { label: "Risk consistency", value: 77, type: "scale", delta: null },
      { label: "Post-loss discipline", value: 72, type: "focus", delta: null },
    ],
    outcomes: { pnl: "+$18,240", winRate: "58%", drawdown: "-$6,170" },
  },
};

const days = [
  {
    day: "Mon",
    month: 78,
    all: 72,
    trades: 46,
    clean: 36,
    breached: 10,
    setup: "NY AM Momentum",
  },
  {
    day: "Tue",
    month: 82,
    all: 71,
    trades: 28,
    clean: 23,
    breached: 5,
    setup: "London Breakout",
  },
  {
    day: "Wed",
    month: 78,
    all: 69,
    trades: 41,
    clean: 32,
    breached: 9,
    setup: "Trend Continuation",
  },
  {
    day: "Thu",
    month: 74,
    all: 67,
    trades: 36,
    clean: 27,
    breached: 9,
    setup: "Mean Reversion",
  },
  {
    day: "Fri",
    month: 70,
    all: 66,
    trades: 44,
    clean: 31,
    breached: 13,
    setup: "London Breakout",
  },
];

const weekdayDetailBase = {
  Mon: {
    tradingDays: 24,
    averageDayPnl: 100,
    medianDayPnl: 64,
    greenDayRate: 63,
    tradeWinRate: 58,
    setupAdherence: 83,
    averageWin: 186,
    averageLoss: -174,
    totalPnl: 2400,
    setupTrades: 18,
    setupShare: 39,
    averageTradesPerDay: 1.9,
    distribution: [42, 38, 20],
    sessions: [
      { name: "Asian", trades: 18, share: 39, winRate: 50, averagePnl: 70 },
      { name: "London", trades: 15, share: 33, winRate: 40, averagePnl: 24 },
      { name: "New York", trades: 13, share: 28, winRate: 31, averagePnl: -8 },
      { name: "Unassigned", trades: 0, share: 0, winRate: null, averagePnl: null },
    ],
  },
  Tue: {
    tradingDays: 17,
    averageDayPnl: 72,
    medianDayPnl: 48,
    greenDayRate: 65,
    tradeWinRate: 61,
    setupAdherence: 79,
    averageWin: 172,
    averageLoss: -148,
    totalPnl: 1224,
    setupTrades: 11,
    setupShare: 39,
    averageTradesPerDay: 1.6,
    distribution: [53, 35, 12],
    sessions: [
      { name: "Asian", trades: 8, share: 29, winRate: 50, averagePnl: 34 },
      { name: "London", trades: 11, share: 39, winRate: 64, averagePnl: 68 },
      { name: "New York", trades: 8, share: 29, winRate: 50, averagePnl: 21 },
      { name: "Unassigned", trades: 1, share: 3, winRate: 0, averagePnl: -16 },
    ],
  },
  Wed: {
    tradingDays: 22,
    averageDayPnl: 86,
    medianDayPnl: 51,
    greenDayRate: 59,
    tradeWinRate: 56,
    setupAdherence: 76,
    averageWin: 181,
    averageLoss: -169,
    totalPnl: 1892,
    setupTrades: 14,
    setupShare: 34,
    averageTradesPerDay: 1.9,
    distribution: [41, 41, 18],
    sessions: [
      { name: "Asian", trades: 14, share: 34, winRate: 57, averagePnl: 52 },
      { name: "London", trades: 16, share: 39, winRate: 56, averagePnl: 47 },
      { name: "New York", trades: 10, share: 24, winRate: 50, averagePnl: 18 },
      { name: "Unassigned", trades: 1, share: 3, winRate: 0, averagePnl: -22 },
    ],
  },
  Thu: {
    tradingDays: 20,
    averageDayPnl: 41,
    medianDayPnl: 27,
    greenDayRate: 55,
    tradeWinRate: 53,
    setupAdherence: 72,
    averageWin: 166,
    averageLoss: -158,
    totalPnl: 820,
    setupTrades: 12,
    setupShare: 33,
    averageTradesPerDay: 1.8,
    distribution: [45, 35, 20],
    sessions: [
      { name: "Asian", trades: 9, share: 25, winRate: 44, averagePnl: 9 },
      { name: "London", trades: 12, share: 33, winRate: 58, averagePnl: 39 },
      { name: "New York", trades: 14, share: 39, winRate: 50, averagePnl: 22 },
      { name: "Unassigned", trades: 1, share: 3, winRate: 0, averagePnl: -18 },
    ],
  },
  Fri: {
    tradingDays: 23,
    averageDayPnl: -15,
    medianDayPnl: -9,
    greenDayRate: 43,
    tradeWinRate: 45,
    setupAdherence: 68,
    averageWin: 159,
    averageLoss: -183,
    totalPnl: -345,
    setupTrades: 16,
    setupShare: 36,
    averageTradesPerDay: 1.9,
    distribution: [39, 35, 26],
    sessions: [
      { name: "Asian", trades: 8, share: 18, winRate: 38, averagePnl: -19 },
      { name: "London", trades: 16, share: 36, winRate: 50, averagePnl: 12 },
      { name: "New York", trades: 18, share: 41, winRate: 44, averagePnl: -27 },
      { name: "Unassigned", trades: 2, share: 5, winRate: 50, averagePnl: -4 },
    ],
  },
};

function getWeekdayDetailsForPeriod(period, daysData) {
  const profile = periodProfiles[period] || periodProfiles.all;
  return daysData.reduce((result, day) => {
    const base = weekdayDetailBase[day.day];
    const tradingDays = Math.max(1, Math.round(base.tradingDays * profile.dayFactor));
    const averageDayPnl = Math.round(base.averageDayPnl * profile.pnlFactor);
    const setupTrades = Math.min(day.trades, Math.max(1, Math.round(base.setupTrades * profile.dayFactor)));
    result[day.day] = {
      ...base,
      tradingDays,
      averageDayPnl,
      medianDayPnl: Math.round(base.medianDayPnl * profile.pnlFactor),
      totalPnl: averageDayPnl * tradingDays,
      greenDayRate: clampPercent(base.greenDayRate + profile.qualityAdjustment),
      tradeWinRate: clampPercent(base.tradeWinRate + profile.qualityAdjustment),
      setupAdherence: clampPercent(base.setupAdherence + profile.qualityAdjustment),
      averageWin: Math.round(base.averageWin * profile.pnlFactor),
      averageLoss: Math.round(base.averageLoss * profile.pnlFactor),
      averageTradesPerDay: Math.round((day.trades / tradingDays) * 10) / 10,
      setupTrades,
      setupShare: clampPercent((setupTrades / day.trades) * 100),
      sessions: base.sessions.map((session) => ({
        ...session,
        trades: session.trades === 0 ? 0 : Math.max(1, Math.round(session.trades * profile.dayFactor)),
        winRate: session.winRate === null ? null : clampPercent(session.winRate + profile.qualityAdjustment),
        averagePnl: session.averagePnl === null ? null : Math.round(session.averagePnl * profile.pnlFactor),
      })),
    };
    return result;
  }, {});
}

function getDaysForPeriod(period) {
  const profile = periodProfiles[period] || periodProfiles.all;
  return days.map((day) => {
    const trades = Math.max(1, Math.round(day.trades * profile.dayFactor));
    const compliance = clampPercent(day.all + profile.qualityAdjustment);
    const clean = Math.min(trades, Math.round((trades * compliance) / 100));
    return {
      ...day,
      month: compliance,
      trades,
      clean,
      breached: trades - clean,
    };
  });
}

const frequencyRows = [
  {
    key: "one",
    label: "1-trade",
    dayDescription: "1-trade days",
    exampleLabel: "a 1-trade day",
    averageDays: 8.4,
    share: 47,
    sampleDays: 38,
    green: 63,
    red: 34,
    breakEven: 3,
    averagePnl: 46,
    medianPnl: 31,
    cleanDayRate: 86,
    setupRate: 91,
    breachDayRate: 8,
  },
  {
    key: "two",
    label: "2-trades",
    dayDescription: "2-trade days",
    exampleLabel: "a 2-trade day",
    averageDays: 6.2,
    share: 35,
    sampleDays: 28,
    green: 54,
    red: 43,
    breakEven: 3,
    averagePnl: 18,
    medianPnl: 9,
    cleanDayRate: 71,
    setupRate: 78,
    breachDayRate: 22,
  },
  {
    key: "three-plus",
    label: "3+ trades",
    dayDescription: "3+ trade days",
    exampleLabel: "a 3+ trade day",
    averageDays: 3.1,
    share: 18,
    sampleDays: 15,
    green: 40,
    red: 60,
    breakEven: 0,
    averagePnl: -37,
    medianPnl: -22,
    cleanDayRate: 48,
    setupRate: 56,
    breachDayRate: 30,
  },
];

const sessionFrequencyBase = {
  "All sessions": [
    { key: "one", label: "1 trade", occurrences: 42, winRate: 61, averagePnl: 38, cleanRate: 84 },
    { key: "two", label: "2 trades", occurrences: 31, winRate: 55, averagePnl: 21, cleanRate: 70 },
    { key: "three-plus", label: "3+ trades", occurrences: 16, winRate: 43, averagePnl: -31, cleanRate: 47 },
  ],
  Asian: [
    { key: "one", label: "1 trade", occurrences: 18, winRate: 67, averagePnl: 52, cleanRate: 89 },
    { key: "two", label: "2 trades", occurrences: 12, winRate: 58, averagePnl: 34, cleanRate: 75 },
    { key: "three-plus", label: "3+ trades", occurrences: 7, winRate: 43, averagePnl: -18, cleanRate: 43 },
  ],
  London: [
    { key: "one", label: "1 trade", occurrences: 16, winRate: 63, averagePnl: 44, cleanRate: 88 },
    { key: "two", label: "2 trades", occurrences: 14, winRate: 57, averagePnl: 28, cleanRate: 71 },
    { key: "three-plus", label: "3+ trades", occurrences: 8, winRate: 50, averagePnl: 6, cleanRate: 50 },
  ],
  "New York": [
    { key: "one", label: "1 trade", occurrences: 15, winRate: 53, averagePnl: 19, cleanRate: 80 },
    { key: "two", label: "2 trades", occurrences: 11, winRate: 45, averagePnl: -8, cleanRate: 64 },
    { key: "three-plus", label: "3+ trades", occurrences: 9, winRate: 33, averagePnl: -46, cleanRate: 44 },
  ],
};

function getSessionFrequencyData(period, session) {
  const profile = periodProfiles[period] || periodProfiles.all;
  return sessionFrequencyBase[session].map((row) => ({
    ...row,
    occurrences: Math.max(1, Math.round(row.occurrences * profile.dayFactor)),
    winRate: clampPercent(row.winRate + profile.qualityAdjustment),
    cleanRate: clampPercent(row.cleanRate + profile.qualityAdjustment),
    averagePnl: Math.round(row.averagePnl * profile.pnlFactor),
  }));
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getFrequencyData(period) {
  const profile = periodProfiles[period] || periodProfiles.all;
  const rateAdjustment = profile.qualityAdjustment;
  return {
    completedDays: profile.completedDays,
    activeMonths: profile.activeMonths,
    rows: frequencyRows.map((row) => {
      const sampleDays = Math.max(
        1,
        Math.round((profile.completedDays * row.share) / 100),
      );
      return {
        ...row,
        sampleDays,
        averageDays: sampleDays / profile.activeMonths,
        green: clampPercent(row.green + rateAdjustment),
        red: clampPercent(row.red - rateAdjustment),
        cleanDayRate: clampPercent(row.cleanDayRate + rateAdjustment),
        setupRate: clampPercent(row.setupRate + rateAdjustment),
        breachDayRate: clampPercent(row.breachDayRate - rateAdjustment),
        averagePnl: Math.round(row.averagePnl * (1 + rateAdjustment / 18)),
        medianPnl: Math.round(row.medianPnl * (1 + rateAdjustment / 22)),
      };
    }),
  };
}

function getExecutionGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function getSampleConfidence(trades) {
  if (trades >= 30) return "Established";
  if (trades >= 10) return "Developing";
  return "Provisional";
}

function getOutcomeMixPerTen({ wins, losses, breakEven }) {
  const counts = [wins, losses, breakEven];
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (!total) return { wins: 0, losses: 0, breakEven: 0 };
  const exact = counts.map((count) => (count / total) * 10);
  const rounded = exact.map(Math.floor);
  const remaining = 10 - rounded.reduce((sum, count) => sum + count, 0);
  const remainderOrder = exact
    .map((value, index) => ({ index, remainder: value - rounded[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) {
    rounded[remainderOrder[index].index] += 1;
  }
  return { wins: rounded[0], losses: rounded[1], breakEven: rounded[2] };
}

function scaleResultCounts(setup, trades) {
  const keys = ["wins", "losses", "breakEven"];
  const exact = keys.map((key) => (setup[key] / setup.trades) * trades);
  const counts = exact.map(Math.floor);
  let remaining = trades - counts.reduce((sum, count) => sum + count, 0);
  const order = exact
    .map((value, index) => ({ index, remainder: value - counts[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) {
    counts[order[index % order.length].index] += 1;
  }
  return { wins: counts[0], losses: counts[1], breakEven: counts[2] };
}

const setupLogs = [
  { name: "London Breakout", trades: 34, wins: 21, losses: 11, breakEven: 2, avgWin: 176, avgLoss: -110, maxWinStreak: 5, maxLossStreak: 2, setupAdherence: 92, cleanTradeRate: 89, avgRisk: "0.78R", pnl: 2480 },
  { name: "NY AM Momentum", trades: 31, wins: 18, losses: 11, breakEven: 2, avgWin: 145, avgLoss: -118, maxWinStreak: 4, maxLossStreak: 3, setupAdherence: 86, cleanTradeRate: 82, avgRisk: "0.84R", pnl: 1310 },
  { name: "Trend Continuation", trades: 32, wins: 18, losses: 11, breakEven: 3, avgWin: 125, avgLoss: -134, maxWinStreak: 4, maxLossStreak: 2, setupAdherence: 78, cleanTradeRate: 74, avgRisk: "0.72R", pnl: 780 },
  { name: "Mean Reversion", trades: 30, wins: 14, losses: 15, breakEven: 1, avgWin: 110, avgLoss: -173, maxWinStreak: 3, maxLossStreak: 4, setupAdherence: 70, cleanTradeRate: 64, avgRisk: "0.65R", pnl: -1060 },
  { name: "Opening Range", trades: 22, wins: 12, losses: 8, breakEven: 2, avgWin: 120, avgLoss: -122, maxWinStreak: 3, maxLossStreak: 2, setupAdherence: 72, cleanTradeRate: 69, avgRisk: "0.70R", pnl: 460 },
  { name: "Pullback Continuation", trades: 19, wins: 10, losses: 8, breakEven: 1, avgWin: 115, avgLoss: -101, maxWinStreak: 3, maxLossStreak: 2, setupAdherence: 68, cleanTradeRate: 63, avgRisk: "0.76R", pnl: 340 },
  { name: "Range Rejection", trades: 17, wins: 8, losses: 8, breakEven: 1, avgWin: 98, avgLoss: -113, maxWinStreak: 2, maxLossStreak: 3, setupAdherence: 64, cleanTradeRate: 58, avgRisk: "0.68R", pnl: -120 },
  { name: "Liquidity Sweep", trades: 16, wins: 8, losses: 7, breakEven: 1, avgWin: 100, avgLoss: -84, maxWinStreak: 3, maxLossStreak: 2, setupAdherence: 61, cleanTradeRate: 56, avgRisk: "0.74R", pnl: 210 },
  { name: "VWAP Reclaim", trades: 15, wins: 7, losses: 7, breakEven: 1, avgWin: 94, avgLoss: -134, maxWinStreak: 2, maxLossStreak: 3, setupAdherence: 58, cleanTradeRate: 51, avgRisk: "0.69R", pnl: -280 },
  { name: "Session Reversal", trades: 13, wins: 6, losses: 6, breakEven: 1, avgWin: 105, avgLoss: -170, maxWinStreak: 2, maxLossStreak: 3, setupAdherence: 55, cleanTradeRate: 49, avgRisk: "0.63R", pnl: -390 },
  { name: "Breakout Retest", trades: 12, wins: 6, losses: 5, breakEven: 1, avgWin: 100, avgLoss: -102, maxWinStreak: 3, maxLossStreak: 2, setupAdherence: 52, cleanTradeRate: 46, avgRisk: "0.71R", pnl: 90 },
  { name: "News Fade", trades: 11, wins: 5, losses: 5, breakEven: 1, avgWin: 90, avgLoss: -184, maxWinStreak: 2, maxLossStreak: 3, setupAdherence: 49, cleanTradeRate: 42, avgRisk: "0.60R", pnl: -470 },
  { name: "Gap Continuation", trades: 7, wins: 4, losses: 2, breakEven: 1, avgWin: 75, avgLoss: -70, maxWinStreak: 3, maxLossStreak: 1, setupAdherence: 73, cleanTradeRate: 71, avgRisk: "0.66R", pnl: 160 },
  { name: "Late Session Scalp", trades: 5, wins: 2, losses: 2, breakEven: 1, avgWin: 80, avgLoss: -195, maxWinStreak: 2, maxLossStreak: 2, setupAdherence: 82, cleanTradeRate: 80, avgRisk: "0.58R", pnl: -230 },
];

function buildSetup(setup) {
  const executionScore = Math.round(
    setup.setupAdherence * 0.6 + setup.cleanTradeRate * 0.4,
  );
  return {
    ...setup,
    executionScore,
    executionGrade: getExecutionGrade(executionScore),
    historicalWinRate: setup.trades ? Math.round((setup.wins / setup.trades) * 100) : 0,
    sampleConfidence: getSampleConfidence(setup.trades),
    outcomeMix: getOutcomeMixPerTen(setup),
  };
}

function getSetupsForPeriod(period, analytics) {
  return analytics?.setups || buildMockPeriodAnalytics(period).setups;
}

const sortByEvidence = compareSetupEvidence;

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1050 }) {
  const valueRef = useRef(null);
  const animate = useContext(IntroMotionContext);

  useEffect(() => {
    const element = valueRef.current;
    if (!element) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const formatter = new Intl.NumberFormat("en-US");
    const renderValue = (number) => {
      element.textContent = `${prefix}${formatter.format(number)}${suffix}`;
    };
    if (!animate || reducedMotion) {
      renderValue(value);
      return undefined;
    }
    let frameId;
    const start = performance.now();
    const advanceNumber = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      renderValue(Math.round(value * eased));
      if (progress < 1) frameId = requestAnimationFrame(advanceNumber);
    };
    frameId = requestAnimationFrame(advanceNumber);
    return () => cancelAnimationFrame(frameId);
  }, [animate, duration, prefix, suffix, value]);

  return (
    <span ref={valueRef} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}{animate ? 0 : value}{suffix}
    </span>
  );
}

function Panel({ children, className = "", ...props }) {
  return (
    <section
      {...props}
      className={`analytics-panel rounded-[12px] border border-white/20 bg-[#0b111b] ${className}`}
    >
      {children}
    </section>
  );
}
function Metric({ label, value, tone = "text-white" }) {
  return (
    <div className="min-w-0 border-l border-white/10 pl-4 first:border-0 first:pl-0">
      <div className="text-[11px] text-white/45">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${tone}`}>
        {value}
      </div>
    </div>
  );
}

function KpiIcon({ type }) {
  const paths = {
    shield: <path d="M12 2 4.5 5v5.6c0 4.8 3.1 8.8 7.5 10.4 4.4-1.6 7.5-5.6 7.5-10.4V5L12 2Zm-3.2 9 2.1 2.1 4.6-4.7" />,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 1v4m0 14v4M1 12h4m14 0h4" /></>,
    scale: <><path d="M12 3v18M5 6h14M7 6l-4 8h8L7 6Zm10 0-4 8h8l-4-8ZM8 21h8" /></>,
    focus: <><path d="M7 18c-2.4-1.6-4-4.3-4-7.4C3 5.3 7 2 12 2s9 3.4 9 8.6c0 2.4-.9 4.5-2.4 6.1V21h-5" /><path d="M9 8.5c.8-1.3 2.1-2 3.6-2 1.8 0 3.2.9 3.9 2.4" /></>,
  };
  return <svg viewBox="0 0 24 24" className="h-9 w-9 stroke-[#7194ff]" fill="none" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>;
}

function Sparkline() {
  return <svg viewBox="0 0 120 18" className="mt-2 h-4 w-full max-w-[120px]" fill="none"><path className="analytics-line-draw" pathLength="1" d="M1 14 12 13l9-5 10 2 9-1 9-5 10 1 8 6 9-1 8-6 9 1 8 5 9-3 9 1" stroke="#7187ff" strokeWidth="1.4" /></svg>;
}

function PeriodDelta({ delta, percent = false, sentiment = "auto", compact = false }) {
  if (delta === null || delta === undefined || delta === 0) return null;
  const isUp = delta >= 0;
  const amount = Math.abs(delta);
  const isPositive =
    sentiment === "positive" || (sentiment === "auto" && isUp);
  const isNegative =
    sentiment === "negative" || (sentiment === "auto" && !isUp);
  return (
    <div
      className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "mt-2 px-2 py-1 text-[10px]"} inline-flex items-center gap-1 rounded-full border font-mono leading-none ${
        isPositive
          ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"
          : isNegative
            ? "border-amber-400/20 bg-amber-400/[0.07] text-amber-300"
            : "border-white/15 bg-white/[0.04] text-violet-200"
      }`}
      aria-label={`${isUp ? "Increased" : "Decreased"} by ${amount}${percent ? " percent" : ""} from the preceding period`}
    >
      <span aria-hidden="true">{isUp ? "↑" : "↓"}</span>
      <b>{amount}{percent ? "%" : ""}</b>
    </div>
  );
}

function OutcomeIcon({ type }) {
  const paths = {
    pnl: <><path d="M3 20V5m0 15h18"/><path d="m6 16 5-6 4 4 6-9"/><path d="M16 5h5v5"/></>,
    wins: <><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 7H3v2a4 4 0 0 0 5 4m9-6h4v2a4 4 0 0 1-5 4M12 15v4m-4 2h8"/></>,
    drawdown: <><path d="M3 4v16h18"/><path d="m6 7 5 5 4-4 6 7"/><path d="M16 15h5v-5"/></>,
  };
  return <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 fill-none sm:h-7 sm:w-7 ${type === "drawdown" ? "stroke-rose-400" : "stroke-[#8394bd]"}`} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function HistoricalMetric({ icon, label, value, tone = "text-white" }) {
  return <div className="flex min-w-0 items-center justify-center gap-1 border-l border-white/15 px-1 py-2 first:border-0 sm:gap-2 sm:px-2"><OutcomeIcon type={icon}/><div className="min-w-0 whitespace-nowrap"><div className="text-[9px] text-white/55 sm:text-[11px]">{label}</div><div className={`mt-0.5 font-mono text-xs font-semibold leading-none sm:text-base min-[1500px]:text-xl ${tone}`}>{value}</div></div></div>;
}
function PillTabs({ value, onChange, items, textSize = "text-xs" }) {
  return (
    <div className="analytics-scrollbar-hidden inline-flex max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 ${textSize} transition ${value === item ? "bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white" : "text-white/50 hover:text-white"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function PeriodSelect({ value, onChange, className = "" }) {
  return (
    <select
      aria-label="Analytics period"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`max-w-full rounded-lg border border-white/25 bg-[#0b111b] px-3 py-2 text-xs text-white/80 sm:px-4 sm:py-2.5 sm:text-sm ${className}`}
    >
      <option value="all">▣ All time</option>
      <option value="thisMonth">▣ {periodProfiles.thisMonth.label}</option>
      <option value="thisWeek">▣ This week</option>
      <option value="lastWeek">▣ Last week</option>
      <option value="lastMonth">▣ {periodProfiles.lastMonth.label}</option>
    </select>
  );
}

function Ring({ value, delta, provisional = false }) {
  return (
    <div className="analytics-gauge analytics-ring-enter relative grid h-[222px] w-[222px] shrink-0 place-items-center rounded-full">
      <svg viewBox="0 0 222 222" className={`absolute inset-0 h-full w-full ${kpiValueTone(value)}`} aria-hidden="true">
        <defs>
          <linearGradient id="disciplineRingGradient" gradientUnits="userSpaceOnUse" x1="35" y1="190" x2="190" y2="20">
            <stop stopColor="currentColor" stopOpacity=".65" />
            <stop offset="1" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <circle
          cx="111"
          cy="111"
          r="103"
          fill="none"
          stroke="#25303d"
          strokeWidth="15"
          strokeLinecap="round"
          pathLength="360"
          strokeDasharray="254 106"
          strokeDashoffset="-120"
        />
        <circle
          cx="111"
          cy="111"
          r="103"
          fill="none"
          stroke="url(#disciplineRingGradient)"
          strokeWidth="15"
          strokeLinecap="round"
          pathLength="360"
          strokeDasharray={Number.isFinite(value) ? `${254 * Math.max(0, Math.min(100, value)) / 100} 360` : "0 360"}
          strokeDashoffset="-120"
        />
      </svg>
      <div className="relative grid h-[86%] w-[86%] place-items-center rounded-full bg-[#0b111b] text-center">
        <div>
          <div className={`font-mono text-[68px] font-bold leading-none tracking-[-.06em] ${kpiValueTone(value)}`}>
            {Number.isFinite(value) ? <AnimatedNumber value={value} /> : <span aria-label="Insufficient rule evidence">—</span>}
          </div>
          <div className="mt-1 text-xs tracking-wide text-white/55">
            DISCIPLINE / 100
          </div>
          {provisional && <div className="mt-2 text-[10px] font-medium text-violet-300">Provisional score</div>}
          <PeriodDelta delta={delta} />
        </div>
      </div>
    </div>
  );
}
function ComplianceDome({ data }) {
  const segments = setupComposition(data);
  return (
    <div className="analytics-gauge relative mx-auto h-[195px] w-full min-w-0 max-w-[430px] shrink-0 overflow-hidden sm:h-auto sm:min-h-[215px] sm:aspect-[300/160] sm:justify-self-center sm:shrink">
      <svg
        viewBox="0 0 300 160"
        className="absolute inset-x-0 top-0 h-[78%] w-full"
        aria-label={`${data.totalTrades} total trades: ${data.clean} setups fully followed, ${data.partial || 0} partially followed, ${data.notFollowed} not followed, and ${data.needsEvidence} need setup review`}
      >
        <path
          className="analytics-arc-draw"
          pathLength="1"
          d="M30 130 A120 120 0 0 1 270 130"
          fill="none"
          stroke="#23303d"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          className="analytics-arc-draw analytics-arc-delay-1"
          pathLength="1"
          d="M30 130 A120 120 0 0 1 246 57"
          fill="none"
          stroke="url(#dome)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          className="analytics-arc-draw analytics-arc-delay-2"
          pathLength="1"
          d="M257 70 A120 120 0 0 1 270 130"
          fill="none"
          stroke="#f45b72"
          strokeOpacity=".75"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path d="M40 130 A110 110 0 0 1 260 130" fill="none" stroke="#91a0ba" strokeOpacity=".38" strokeWidth="1" strokeDasharray="3 4" />

        <g stroke="#4f78bd" strokeOpacity=".55" strokeWidth="1">
          <path d="M82 72v8m-4-4h8" />
          <path d="M150 42v9m-4.5-4.5h9" />
          <path d="M218 71v8m-4-4h8" />
          <path d="M62 91v37" strokeDasharray="3 4" strokeOpacity=".35" />
          <path d="M238 91v37" strokeDasharray="3 4" strokeOpacity=".35" />
        </g>
        <defs>
          <linearGradient id="dome">
            <stop stopColor="#7c5cff" />
            <stop offset="1" stopColor="#40c8e9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-x-0 top-[36%] -translate-y-1/2 text-center sm:top-[40%]">
        <div className="font-mono text-[30px] font-bold leading-none sm:text-[38px]"><AnimatedNumber value={data.totalTrades} /></div>
        <div className="mt-1 text-sm text-white/60 sm:mt-2 sm:text-base">Total trades</div>
        <div className="mt-1 flex justify-center">
          <PeriodDelta delta={data.totalTradesDelta} sentiment="neutral" compact />
        </div>
      </div>
      <div className="absolute inset-x-0 top-[55%] flex justify-center sm:top-[58%]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/15 bg-slate-300/[0.05] px-2 py-1 text-[9px] leading-none text-slate-300/75">
          {data.partial > 0 && <><span className="text-amber-300">Partial <b className="font-mono"><AnimatedNumber value={data.partial} /></b></span><span aria-hidden="true">·</span></>}
          Needs setup review <b className="font-mono text-slate-200"><AnimatedNumber value={data.needsEvidence} /></b>
          <PeriodDelta delta={data.needsEvidenceDelta} sentiment="neutral" compact />
        </span>
      </div>
      <div className="absolute inset-x-[7%] top-[63.4%] grid grid-cols-2 items-start gap-4 sm:inset-x-[7%]">
        <div className="min-w-0 text-left">
          <div className="flex h-9 items-center gap-1.5 sm:h-10">
            <PeriodDelta delta={data.cleanDelta} compact />
            <b className="font-mono text-[27px] leading-none text-[#7ee45f] sm:text-[31px]"><AnimatedNumber value={data.clean} /></b>

          </div>
          <span className="mb-1 block font-mono text-[10px] leading-none text-[#7ee45f]/75">({segments[0].percent}%)</span>
          <span className="block text-xs leading-tight text-white/60 sm:text-sm">Setup followed</span>
        </div>
        <div className="min-w-0 text-right">
          <div className="flex h-9 items-center justify-end gap-1.5 sm:h-10">
            <b className="font-mono text-[27px] leading-none text-rose-400 sm:text-[31px]"><AnimatedNumber value={data.notFollowed} /></b>

            <PeriodDelta
              delta={data.notFollowedDelta}
              sentiment={data.notFollowedDelta < 0 ? "positive" : "negative"}
              compact
            />
          </div>
          <span className="mb-1 block font-mono text-[10px] leading-none text-rose-400/75">({segments[2].percent}%)</span>
          <span className="block text-xs leading-tight text-white/60 sm:text-sm">Not followed</span>
        </div>
      </div>
    </div>
  );
}

function FrequencyRateSegments({ value, label = "Clean-day rate" }) {
  if (!Number.isFinite(value)) return <span className="font-sans tabular-nums text-xs text-white/45" aria-label="Rule evidence unavailable">—</span>;
  const activeSegments = Math.round(value / 5);
  const tone =
    value >= 80
      ? { text: "text-emerald-400", bar: "bg-[#7cd65a]" }
      : value >= 60
        ? { text: "text-amber-300", bar: "bg-amber-400" }
        : { text: "text-orange-300", bar: "bg-orange-400" };

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${label} ${value}%`}
    >
      <b className={`w-7 shrink-0 font-sans tabular-nums text-xs ${tone.text}`}>
        {value}%
      </b>
      <span
        className="analytics-segments flex h-3 items-center gap-[2px]"
        aria-hidden="true"
      >
        {Array.from({ length: 20 }, (_, index) => (
          <i
            key={index}
            className={`h-3 w-[3px] ${index < activeSegments ? tone.bar : "bg-white/15"}`}
          />
        ))}
      </span>
    </div>
  );
}

function Frequency({ period, analytics, activeFrequency, setActiveFrequency }) {
  const [frequencyMode, setFrequencyMode] = useState("Per day");
  const [session, setSession] = useState("All sessions");
  const periodAnalytics = analytics || buildMockPeriodAnalytics(period);
  const frequencyData = periodAnalytics.frequency;
  const sessionRows = periodAnalytics.sessionFrequency[session];
  const strongestSessionRow = sessionRows
    .filter((row) => row.occurrences >= 10)
    .sort((a, b) => b.winRate - a.winRate)[0];

  return (
    <Panel className="min-w-0 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-[18px] font-semibold">
            Trade frequency &amp; rule adherence
            <span
              title="Groups completed trading days by the total number of closed trades taken that day."
              className="grid h-5 w-5 place-items-center rounded-full border border-white/60 text-[11px] text-white/70"
            >
              i
            </span>
          </h2>
          <p className="mt-1 text-xs text-white/45">
            Historical patterns by total trades taken in a completed day
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillTabs
            value={frequencyMode}
            onChange={setFrequencyMode}
            items={["Per day", "Per session"]}
          />
          <span className="w-fit shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] text-white/50">
            {frequencyData.completedDays} completed days · {frequencyData.activeMonths} active months
          </span>
        </div>
      </div>

      {frequencyMode === "Per day" ? (
      <>
      <div tabIndex={0} role="region" aria-label="Trade frequency by day" className="analytics-table-scrollbar mt-4 overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[110px_105px_minmax(190px,1fr)_125px_155px_110px] items-center gap-3 border-y border-white/15 py-2 text-[11px] text-white/50">
            <span className="pl-3">Trade/day</span>
            <span>Avg / active month</span>
            <span>Historical day outcome</span>
            <span>Daily P&amp;L</span>
            <span>Rule &amp; setup</span>
            <span className="border-l border-white/10 pl-4">
              Days with breach
              <small className="mt-0.5 block text-[9px] leading-3 text-white/35">
                At least one rule breach
              </small>
            </span>
          </div>
          {frequencyData.rows.map((row) => (
            <button
              key={row.key}
              type="button"
              aria-pressed={activeFrequency === row.key}
              onClick={() => setActiveFrequency(row.key)}
              className={`analytics-row grid w-full grid-cols-[110px_105px_minmax(190px,1fr)_125px_155px_110px] items-center gap-3 border-b border-white/15 py-3 text-left text-sm ${activeFrequency === row.key ? "bg-violet-400/[0.07] shadow-[inset_3px_0_0_#7c68ff]" : ""}`}
            >
              <div className="pl-3">
                <b className="font-medium text-white/90">{row.label}</b>
                <span className="mt-1 block text-[10px] text-white/35">
                  {row.sampleDays} logged days
                </span>
              </div>
              <div>
                <b className="font-sans tabular-nums text-base text-white/90">
                  {Number.isFinite(row.averageDays) ? `${Math.round(row.averageDays)} days` : "—"}
                </b>
                <span className="mt-1 block text-[10px] text-white/40">
                  {formatPercent(row.share)} of trading days
                </span>
              </div>
              <div
                role="img"
                aria-label={row.sampleDays ? `${formatPercent(row.green)} green days, ${formatPercent(row.red)} red days, ${formatPercent(row.breakEven)} break-even days` : "No completed days in this frequency group"}
              >
                <div className="analytics-segments flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <span
                    className="bg-emerald-400"
                    style={{ width: `${row.green ?? 0}%` }}
                  />
                  <span
                    className="bg-rose-400"
                    style={{ width: `${row.red ?? 0}%` }}
                  />
                  {row.breakEven > 0 && (
                    <span
                      className="bg-slate-400"
                      style={{ width: `${row.breakEven ?? 0}%` }}
                    />
                  )}
                </div>
                <div className="mt-1.5 flex gap-3 font-sans tabular-nums text-[10px]" aria-hidden="true">
                  <span className="text-emerald-400">{formatPercent(row.green)} Green</span>
                  <span className="text-rose-400">{formatPercent(row.red)} Red</span>
                  <span className="text-white/45">{formatPercent(row.breakEven)} BE</span>
                </div>
              </div>
              <div className="font-sans tabular-nums">
                <b
                  className={
                    weekdayMoneyTone(row.averagePnl)
                  }
                >
                  Avg {formatCurrency(row.averagePnl)}
                </b>
                <span className="mt-1 block text-[10px] text-white/40">
                  Median {formatCurrency(row.medianPnl)}
                </span>
              </div>
              <div className="text-[11px]">
                <span className="block text-[10px] text-white/45">
                  Clean-day rate
                </span>
                <div className="mt-1">
                  <FrequencyRateSegments value={row.cleanDayRate} />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-white/45">Setup followed</span>
                  <span aria-hidden="true" className="text-[10px] text-white/25">—</span>
                  <b className="font-sans tabular-nums text-violet-200">{Number.isFinite(row.setupRate) ? `${row.setupRate}%` : "—"}</b>
                </div>
              </div>
              <div className="border-l border-white/10 pl-4">
                <b className="font-sans tabular-nums text-rose-400">{formatPercent(row.breachDayRate)}</b>
                <span className="mt-1 block text-[9px] leading-3 text-white/35">
                  of logged days
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      </>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-white/10 py-3">
            <span className="mr-1 text-[11px] text-white/45">Session</span>
            {["All sessions", "Asian", "London", "New York", "Unassigned"].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={session === item}
                onClick={() => setSession(item)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] transition ${session === item ? "border-violet-400/40 bg-violet-400/15 text-violet-200" : "border-white/10 text-white/45 hover:text-white/75"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div tabIndex={0} role="region" aria-label="Trade frequency by session" className="analytics-table-scrollbar mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-[10px] text-white/40">
                <tr>
                  {["Trades in session", "Green-session rate", "Avg session P&L", "Clean-session rate", "Occurrences", "Evidence"].map((heading) => (
                    <th key={heading} className="border-b border-white/15 px-3 py-2.5 font-normal">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((row) => {
                  const isStrongest = strongestSessionRow?.key === row.key;
                  const rankable = row.occurrences >= 10;
                  return (
                    <tr key={row.key} className={isStrongest ? "bg-cyan-400/[0.045]" : ""}>
                      <td className="border-b border-white/10 px-3 py-3">
                        <b className="text-white/90">{row.label}</b>
                        {isStrongest && <span className="ml-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-2 py-0.5 text-[9px] text-cyan-200">Highest observed</span>}
                      </td>
                      <td className="border-b border-white/10 px-3 py-3 font-sans tabular-nums text-white/85">{formatPercent(row.winRate)}</td>
                      <td className={`border-b border-white/10 px-3 py-3 font-sans tabular-nums ${weekdayMoneyTone(row.averagePnl)}`}>{formatCurrency(row.averagePnl)}</td>
                      <td className="border-b border-white/10 px-3 py-3"><FrequencyRateSegments value={row.cleanRate} label="Clean-session rate" /></td>
                      <td className="border-b border-white/10 px-3 py-3 font-sans tabular-nums text-white/75">{row.occurrences}</td>
                      <td className="border-b border-white/10 px-3 py-3">
                        <span className={`rounded-full border px-2 py-1 text-[9px] ${rankable ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300" : "border-amber-400/20 bg-amber-400/[0.07] text-amber-300"}`}>
                          {rankable ? "Rankable" : "Provisional"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs leading-5 text-white/50">
            {strongestSessionRow ? (
              <><b className="text-white/85">Highest observed evidence-supported green-session rate:</b> {strongestSessionRow.label} in {session.toLowerCase()} · {strongestSessionRow.winRate}% across {strongestSessionRow.occurrences} completed sessions.</>
            ) : (
              <><b className="text-amber-200">Not enough data to rank reliably.</b> Each frequency group needs at least 10 completed sessions.</>
            )}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-white/35">
            A session is counted per account, date, and saved session when it contains a completed trade. Green-session rate measures profitable sessions, not individual trade win rate. Missing rule evidence remains unscored. Results describe historical logs and are not trading recommendations.
          </p>
        </>
      )}
    </Panel>
  );
}
function weekdayMoneyTone(value) {
  if (!Number.isFinite(value) || value === 0) return "text-white/55";
  return value > 0 ? "text-emerald-400" : "text-rose-400";
}
function weekdayPnlDirection(value) {
  return Number.isFinite(value) && value !== 0 ? value > 0 : null;
}
function formatAverageTrades(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "—";
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : "—";
}

function buildOverviewData(period, analytics) {
  const summary = analytics.summary;
  const profile = periodProfiles[period] || periodProfiles.all;
  return {
    ...profile,
    discipline: summary.discipline,
    disciplineDelta: summary.disciplineDelta,
    totalTrades: summary.totalTrades,
    totalTradesDelta: summary.totalTradesDelta,
    clean: summary.clean,
    cleanDelta: summary.cleanDelta,
    partial: summary.partial,
    partialDelta: summary.partialDelta,
    notFollowed: summary.notFollowed,
    notFollowedDelta: summary.notFollowedDelta,
    needsEvidence: summary.needsEvidence,
    needsEvidenceDelta: summary.needsEvidenceDelta,
    kpis: [
      { label: "Rule adherence", value: summary.ruleAdherence, type: "shield", delta: summary.ruleAdherenceDelta },
      { label: "Setup adherence", value: summary.setupAdherence, type: "target", delta: summary.setupAdherenceDelta },
      { label: "Risk consistency", value: summary.riskConsistency, type: "scale", delta: summary.riskConsistencyDelta },
      { label: "Post-loss discipline", value: summary.postLossDiscipline, type: "focus", delta: summary.postLossDisciplineDelta },
    ],
    outcomes: {
      pnl: formatCurrency(summary.netPnl),
      winRate: `${summary.winRate}%`,
      drawdown: formatCurrency(-summary.maxDrawdown),
    },
  };
}

function OutcomeRecord({ setup }) {
  return (
    <span className="inline-flex items-center gap-2 font-sans tabular-nums text-[15px] font-medium leading-5 whitespace-nowrap" aria-label={`${setup.wins} wins, ${setup.losses} losses, ${setup.breakEven} break-even`}>
      <span className="text-emerald-400">{setup.wins}W</span>
      <span aria-hidden="true" className="text-white/25">·</span>
      <span className="text-rose-400">{setup.losses}L</span>
      <span aria-hidden="true" className="text-white/25">·</span>
      <span className="text-white/50">{setup.breakEven}BE</span>
    </span>
  );
}

function OutcomeMix({ setup, compact = false }) {
  const groups = [
    ["wins", "W", setup.outcomeMix.wins, "bg-emerald-400"],
    ["losses", "L", setup.outcomeMix.losses, "bg-rose-400"],
    ["break-even", "BE", setup.outcomeMix.breakEven, "bg-slate-400"],
  ];
  return (
    <div
      className="min-w-[132px]"
      role="img"
      aria-label={`Historical outcome mix per 10 trades: ${setup.outcomeMix.wins} wins, ${setup.outcomeMix.losses} losses, ${setup.outcomeMix.breakEven} break-even`}
    >
      <div className={`flex ${compact ? "gap-[2px]" : "gap-[3px]"}`} aria-hidden="true">
        {groups.flatMap(([key, , count, color]) =>
          Array.from({ length: count }, (_, index) => (
            <span
              key={`${key}-${index}`}
              className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"} rounded-[2px] ${color}`}
            />
          )),
        )}
      </div>
      <div className="mt-1.5 flex gap-2 font-sans tabular-nums text-xs font-medium leading-4 whitespace-nowrap">
        {groups.map(([key, label, count], index) => (
          <span
            key={key}
            className={index === 0 ? "text-emerald-400" : index === 1 ? "text-rose-400" : "text-white/50"}
          >
            {count}{label}
          </span>
        ))}
      </div>
    </div>
  );
}

function QualityBadge({ setup }) {
  if (setup.executionScore === null) return <span className="inline-flex rounded-full border border-slate-300/20 bg-slate-300/[0.05] px-2.5 py-1 text-[10px] text-slate-300" title="Full rule evidence is needed to calculate execution quality">Needs rule evidence</span>;
  const tone = {
    "A+": "border-cyan-300/35 bg-cyan-300/10 text-cyan-200",
    A: "border-violet-300/35 bg-violet-300/10 text-violet-200",
    B: "border-blue-300/35 bg-blue-300/10 text-blue-200",
    C: "border-amber-300/35 bg-amber-300/10 text-amber-200",
    D: "border-rose-300/35 bg-rose-300/10 text-rose-200",
  }[setup.executionGrade];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${tone}`}
      aria-label={`Execution quality ${setup.executionScore} percent, grade ${setup.executionGrade}`}
    >
      <b>{setup.executionGrade}</b>
      <span className="opacity-75">{setup.executionScore}%</span>
    </span>
  );
}

function SampleBadge({ confidence }) {
  const tone = {
    Established: "border-cyan-300/45 bg-cyan-400/10 text-cyan-300",
    Developing: "border-violet-300/45 bg-violet-400/10 text-violet-300",
    Provisional: "border-amber-300/45 bg-amber-400/10 text-amber-300",
  }[confidence];
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] whitespace-nowrap ${tone}`}>
      {confidence}
    </span>
  );
}

function SetupTable({ onViewAll, period, analytics }) {
  const periodSetups = useMemo(() => getSetupsForPeriod(period, analytics), [period, analytics]);
  const visibleSetups = [...periodSetups].sort(sortByEvidence).slice(0, 4);
  const [selectedSetupName, setSelectedSetupName] = useState(visibleSetups[0]?.name || "");
  const selectedSetup = visibleSetups.find((setup) => setup.name === selectedSetupName) || visibleSetups[0];
  const confidenceSummary = [
    {
      label: "Established",
      threshold: "30+ trades",
      meaning: "Most historical data",
      tone: "border-cyan-400/30 bg-cyan-400/[0.06]",
      accent: "bg-cyan-400",
      text: "text-cyan-300",
    },
    {
      label: "Developing",
      threshold: "10–29 trades",
      meaning: "Evidence still growing",
      tone: "border-violet-400/30 bg-violet-400/[0.06]",
      accent: "bg-violet-400",
      text: "text-violet-300",
    },
    {
      label: "Provisional",
      threshold: "Under 10 trades",
      meaning: "Small sample — review cautiously",
      tone: "border-amber-400/30 bg-amber-400/[0.06]",
      accent: "bg-amber-400",
      text: "text-amber-300",
    },
  ].map((item) => ({
    ...item,
    count: periodSetups.filter((setup) => setup.sampleConfidence === item.label).length,
  }));
  return (
    <Panel className="flex h-full min-h-[318px] min-w-0 flex-col overflow-hidden p-4">
      <h2 className="text-[18px] font-semibold">Setup quality &amp; adherence</h2>
      <div className="analytics-scrollbar-hidden mt-3 overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[1.15fr_.35fr_.95fr_.85fr_.62fr_.7fr_.72fr] items-center gap-3 border-b border-white/20 pb-2 text-[11px] text-white/60">
            <span>Setup</span>
            <span>Trades</span>
            <span>Record</span>
            <span>Historical mix / 10</span>
            <span>Historical win rate</span>
            <span>Execution quality</span>
            <span>Historical P&amp;L</span>
          </div>
          {visibleSetups.map((setup) => (
            <button
              key={setup.name}
              type="button"
              aria-pressed={selectedSetup?.name === setup.name}
              onClick={() => setSelectedSetupName(setup.name)}
              className={`analytics-row grid w-full grid-cols-[1.15fr_.35fr_.95fr_.85fr_.62fr_.7fr_.72fr] items-center gap-3 border-b border-white/15 py-3 text-left text-sm ${selectedSetup?.name === setup.name ? "bg-violet-400/[0.07] shadow-[inset_3px_0_0_#7c68ff]" : ""}`}
            >
              <b className="pl-3 font-medium text-violet-300">{setup.name}</b>
              <span>{setup.trades}</span>
              <OutcomeRecord setup={setup} />
              <OutcomeMix setup={setup} compact />
              <span className="font-sans tabular-nums text-white/85" aria-label={`${setup.historicalWinRate} percent historical win rate`}>
                {setup.historicalWinRate}%
              </span>
              <QualityBadge setup={setup} />
              <span
                className={`font-sans tabular-nums ${setup.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}
              >
                {formatCurrency(setup.pnl)}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-white/40">
        Higher grades reflect more consistent rule execution in past logs — not expected profitability.
      </p>
      {selectedSetup ? <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white/90">
            {selectedSetup.name}: what the percentages mean
          </h3>
          <p className="mt-1 text-xs leading-5 text-white/50">
            Historical win rate: {selectedSetup.wins} wins from {selectedSetup.trades} completed trades = {selectedSetup.historicalWinRate}%. {selectedSetup.executionScore === null ? "Execution quality needs both setup adherence and conclusive rule evaluations; it cannot yet be graded from these logs." : `Execution quality: ${selectedSetup.executionScore}% (${selectedSetup.executionGrade}), calculated from 60% setup adherence and 40% clean-trade rate.`} Historical outcomes do not predict future results.
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-[10px] text-violet-200">
          Selected · {selectedSetup.trades} trades
        </span>
      </div> : <p className="mt-4 text-xs text-white/50">No completed trades with a named setup in this period.</p>}
      <div className="mt-auto pt-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white/90">Setup sample confidence</h3>
              <p className="mt-1 text-[10px] text-white/45">
                How much logged trade history supports each setup · showing {visibleSetups.length} of {periodSetups.length}
              </p>
            </div>
            <button
              onClick={onViewAll}
              className="w-fit rounded-lg border border-violet-400/70 px-3 py-2 text-xs font-medium text-[#9aa6ff] transition hover:bg-violet-500/10 hover:text-white"
            >
              View all setups →
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 min-[460px]:grid-cols-3">
            {confidenceSummary.map((item) => (
              <div
                key={item.label}
                className={`relative overflow-hidden rounded-lg border p-3 ${item.tone}`}
                aria-label={`${item.count} ${item.label.toLowerCase()} setups, ${item.threshold}`}
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${item.accent}`} aria-hidden="true" />
                <div className="flex items-start justify-between gap-3 pl-1">
                  <div>
                    <div className={`text-xs font-semibold ${item.text}`}>{item.label}</div>
                    <div className="mt-1 text-[10px] text-white/45">{item.threshold}</div>
                  </div>
                  <b className="flex items-baseline gap-1 whitespace-nowrap text-white">
                    <span className="font-sans tabular-nums text-2xl leading-none">{item.count}</span>
                    <span className="text-[10px] font-medium text-white/55">setups</span>
                  </b>
                </div>
                <p className="mt-2 pl-1 text-[10px] leading-4 text-white/50">{item.meaning}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 border-t border-white/10 pt-3 text-[10px] leading-4 text-white/40">
            More logged trades make historical comparisons more dependable. Confidence does not measure profitability or predict future results.
          </p>
        </div>
      </div>
    </Panel>
  );
}
function MiniDayChart({ onExplore, analytics }) {
  const points = analytics.days.map((day) => ({
    ...day,
    setupRate: day.selectedSetupAdherence,
    winRate: day.trades > 0 ? analytics.weekdayDetails[day.day]?.tradeWinRate ?? null : null,
  }));
  const series = [
    { key: "setupRate", label: "Setup followed", color: "#a78bfa" },
    { key: "winRate", label: "Win rate", color: "#38bdf8" },
  ];
  return (
    <Panel className="flex min-h-[330px] min-w-0 flex-1 flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-5">Setup adherence &amp; win rate by weekday</h2>
        <button onClick={onExplore} className="shrink-0 rounded-lg border border-violet-400 px-2.5 py-1.5 text-xs text-violet-300 hover:bg-violet-500/10">EDGE →</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/65">
        {series.map((item) => <span key={item.key} className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}</span>)}
      </div>
      <div className="mt-3 flex min-w-0 flex-1 flex-col overflow-x-auto">
        <div className="flex min-w-[360px] flex-1 flex-col" role="img" aria-label="Setup-followed percentage and trade win-rate percentage for each weekday in the selected period">
          <div className="relative ml-9 min-h-[180px] flex-1">
            {[0, 25, 50, 75, 100].map((value) => <div key={value} className="absolute inset-x-0 border-t border-dashed border-white/10" style={{ bottom: `${value / 1.2}%` }}>
              <span className="absolute -left-9 -top-2 w-7 text-right text-[10px] leading-4 text-slate-400">{value}%</span>
            </div>)}
            <div className="absolute inset-0 grid grid-cols-5">
              {points.map((day) => <div key={day.day} className="flex h-full items-end justify-center gap-3 px-1" aria-label={`${day.day}: setup followed ${formatPercent(day.setupRate)}, win rate ${formatPercent(day.winRate)}; ${day.trades} completed trades`}>
                {series.map((item) => {
                  const value = day[item.key];
                  return <div key={item.key} className="relative w-[22%] max-w-9 rounded-t analytics-bar-rise" style={{ height: Number.isFinite(value) ? `${Math.max(0.5, value / 1.2)}%` : "1px", backgroundColor: Number.isFinite(value) ? item.color : "transparent" }}>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-xs font-semibold tabular-nums" style={{ color: item.color }}>{formatPercent(value)}</span>
                  </div>;
                })}
              </div>)}
            </div>
          </div>
          <div className="ml-9 mt-2 grid grid-cols-5 text-center">
            {points.map((day) => <div key={day.day}><p className="text-xs text-slate-300">{day.day}</p><p className="mt-1 font-sans text-[10px] tabular-nums text-slate-400">{day.trades} trades</p></div>)}
          </div>
        </div>
      </div>
      <span className="mt-1 text-[10px] text-cyan-300 sm:hidden">Swipe to see all weekdays →</span>
      <p className="mt-3 text-[10px] leading-4 text-white/45">Setup followed = fully followed ÷ reviewed setups. Win rate = wins ÷ completed trades, including break-even. Missing data appears as —.</p>
    </Panel>
  );
}

function BreachConcentration({ data }) {
  const repeatedBreaches = data.notFollowed > 0 ? Math.max(1, Math.round(data.notFollowed * 0.35)) : 0;
  return (
    <Panel className="h-[174px] min-w-0 overflow-hidden p-4">
      <h2 className="text-[18px] font-semibold">Breach concentration</h2>
      <div className="mt-3 flex items-center justify-center gap-5">
        <div className="relative h-[104px] w-[104px] shrink-0" aria-label="Overtrading represents 35 percent of logged rule breaches">
          <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="#24303d" strokeWidth="4" />
            <circle className="analytics-donut-draw" pathLength="100" cx="21" cy="21" r="15.9" fill="none" stroke="#7c68ff" strokeWidth="4" strokeLinecap="round" strokeDasharray="35 65" />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <b className="font-mono text-2xl leading-none">35%</b>
            <span className="mt-1 text-[9px] text-white/45">of breaches</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-white/45">Most repeated</p>
          <p className="mt-1 text-base font-semibold text-violet-300">Overtrading</p>
          <p className="mt-2 text-xs leading-5 text-white/55">{repeatedBreaches} of {data.notFollowed} logged breaches</p>
          <p className="text-[10px] text-white/35">Past logs only</p>
        </div>
      </div>
    </Panel>
  );
}
function kpiValueTone(value) {
  if (!Number.isFinite(value)) return "text-white/45";
  if (value >= 70) return "text-emerald-400";
  if (value >= 50) return "text-orange-400";
  if (value >= 30) return "text-sky-300";
  return "text-rose-400";
}


function OutcomeBreakdown({ summary }) {
  const record = [
    { label: "Wins", count: summary.wins, tone: "text-emerald-400" },
    { label: "Losses", count: summary.losses, tone: "text-rose-400" },
    { label: "Break-even", count: summary.breakEven, tone: "text-slate-300" },
  ];
  return (
    <Panel className="flex h-full min-w-0 flex-col p-4 sm:p-5">
      <h2 className="text-[18px] font-semibold">Trade outcome breakdown</h2>
      <p className="mt-1 text-[11px] text-white/45">{summary.totalTrades} completed trades · selected period</p>
      <div className="mt-4 grid grid-cols-3 gap-2 border-b border-white/10 pb-4">
        {record.map(({ label, count, tone }) => <div key={label} className="min-w-0">
          <p className="text-[11px] text-white/55">{label}</p>
          <b className={`mt-1 block font-sans text-2xl font-semibold tabular-nums ${tone}`}>{count}</b>
        </div>)}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div><dt className="text-[11px] text-white/55">Average win</dt><dd className={`mt-1 font-sans text-lg font-semibold tabular-nums ${weekdayMoneyTone(summary.averageWin)}`}>{formatCurrency(summary.averageWin)}</dd></div>
        <div><dt className="text-[11px] text-white/55">Average loss</dt><dd className={`mt-1 font-sans text-lg font-semibold tabular-nums ${weekdayMoneyTone(summary.averageLoss)}`}>{formatCurrency(summary.averageLoss)}</dd></div>
        <div className="border-t border-white/10 pt-3"><dt className="min-h-[32px] text-[11px] text-white/55 sm:min-h-0">Avg profitable days / month</dt><dd className="mt-1 font-sans text-xl font-semibold tabular-nums text-emerald-400">{summary.monthlyDays.averageProfitableDays ?? "—"}{" "}<span className="ml-1.5 text-xs font-normal text-white/45">out of {summary.monthlyDays.averageTradedDays ?? "—"}</span></dd></div>
        <div className="border-t border-white/10 pt-3"><dt className="min-h-[32px] text-[11px] text-white/55 sm:min-h-0">Avg losing days / month</dt><dd className="mt-1 font-sans text-xl font-semibold tabular-nums text-rose-400">{summary.monthlyDays.averageLosingDays ?? "—"}{" "}<span className="ml-1.5 text-xs font-normal text-white/45">out of {summary.monthlyDays.averageTradedDays ?? "—"}</span></dd></div>
        <p className="col-span-2 -mt-2 text-[10px] leading-4 text-white/40">Based on {summary.monthlyDays.activeMonths} active {summary.monthlyDays.activeMonths === 1 ? "month" : "months"} · {summary.monthlyDays.tradedDays} traded days. Whole-day averages are rounded together.{summary.monthlyDays.breakEvenDays > 0 ? ` Break-even: ${summary.monthlyDays.averageBreakEvenDays} days/month.` : ""} One date counts once; partial months use only logged days in the selected period.</p>
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><div><dt className="text-[11px] text-white/55">Win days %</dt><p className="mt-1 text-[10px] text-white/40">{summary.monthlyDays.profitableDays} profitable / {summary.monthlyDays.tradedDays} traded days · BE included</p></div><dd className={`font-sans text-2xl font-semibold tabular-nums ${Number.isFinite(summary.monthlyDays.winDayRate) ? "text-emerald-400" : "text-white/45"}`}>{formatPercent(summary.monthlyDays.winDayRate)}</dd></div>
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><div><dt className="text-[11px] text-white/55">Profit factor</dt><p className="mt-1 text-[10px] text-white/35">Gross profit ÷ gross loss</p></div><dd className="font-sans text-2xl font-semibold tabular-nums text-white/90">{Number.isFinite(summary.profitFactor) ? summary.profitFactor.toFixed(2) : summary.grossProfit > 0 ? <span className="text-sm font-medium">No losses</span> : "—"}</dd></div>
      </dl>
      <p className="mt-auto pt-4 text-[10px] leading-4 text-white/40">Historical outcomes only. These values do not affect your Discipline score or predict future results.</p>
    </Panel>
  );
}

function Overview({ setTab, onViewSetups, data, period, analytics, accountScope }) {
  const [activeHelp, setActiveHelp] = useState(null);
  const [activeFrequency, setActiveFrequency] = useState("one");
  const selectedFrequency = analytics.frequency.rows.find((row) => row.key === activeFrequency) || analytics.frequency.rows[0];
  const helpText = {
    shield: "Rule adherence = followed checks ÷ completed checks × 100. Missing evidence is excluded. Each rule is checked for each completed trade, so day-level checks repeat for trades on the same day. Retrospective comparisons are labelled.",
    target: "Setup adherence = fully followed setups ÷ trades with a known setup status × 100. All green means fully followed. Orange is partial, and No Setup is not followed. Partial and not-followed trades stay in the total; missing reviews are excluded.",
    scale: "Risk consistency is the average compliance rate for daily loss, lot / contract size, and trades per day. Daily loss and trade count are checked once per account/day; lot size once per trade. Missing values are excluded. Saved rule changes apply from their effective dates; older comparisons are labelled retrospective.",
    focus: "After every losing trade, check the very next trade on that account in the same day—including the 2nd, 3rd and later trades. It counts as disciplined when the setup was fully followed and lot size stayed within the applicable Rulebook limit. Its profit or loss does not change the result. Percentage = disciplined follow-ups ÷ follow-ups with enough evidence × 100. Stopping after a loss is shown separately and excluded. Uses execution times when available, otherwise saved log order.",
  };

  if (analytics.trades.length === 0) return <Panel className="p-6"><h2 className="text-xl font-semibold">No completed trades in {periodProfiles[period].label.toLowerCase()}</h2><p className="mt-2 text-sm text-white/55">Choose another period to review your logged trades and analytics.</p></Panel>;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 min-[1120px]:grid-cols-[1.08fr_.95fr]">
        <Panel className="grid min-h-[300px] grid-cols-1 items-start gap-6 px-5 py-5 min-[900px]:grid-cols-2">
          <div className="flex h-full w-full flex-col items-center border-b border-white/15 pb-6 text-center min-[900px]:justify-self-center min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:pb-0">
            <Ring value={data.discipline} delta={data.disciplineDelta} provisional={analytics.summary.disciplineProvisional} />
            <p className="mt-4 text-sm text-white/65">
              Based on rule adherence — not P&amp;L.
            </p>
          </div>
          <ComplianceDome data={data} />
          <p className="col-span-full -mt-3 text-center text-[10px] leading-4 text-white/40 sm:text-left">
            Setup counts come from the saved green, orange, and No Setup tags—not P&amp;L. {analytics.summary.needsEvidence} trades still need a setup review. Rule adherence measures completed rule checks; behavioural rules still need their own evidence.
          </p>
        </Panel>
        <div className="grid grid-rows-[1fr_auto] gap-3">
          <Panel className="grid min-h-[190px] grid-cols-2 gap-x-0 gap-y-5 px-3 py-5 sm:grid-cols-4">
            {data.kpis.map(({ label, value, type, delta }) => (
              <div key={label} className="analytics-kpi relative flex flex-col items-center border-l border-white/20 px-3 first:border-0">
                <button type="button" aria-label={"How " + label + " is calculated"} aria-expanded={activeHelp === type} aria-controls="analytics-kpi-help" onKeyDown={(event) => { if (event.key === "Escape") setActiveHelp(null); }} onClick={() => setActiveHelp(activeHelp === type ? null : type)} className="absolute right-1 top-0 inline-flex h-6 w-6 items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/30 text-[9px] leading-none text-white/50 hover:border-cyan-300 hover:text-cyan-200">?</span></button>
                <KpiIcon type={type}/>
                <div className="mt-2 min-h-[40px] text-center text-sm text-white/75">{label}</div>
                <div className={`mt-1 font-mono text-[30px] font-semibold leading-none ${kpiValueTone(value)}`}>
                  {Number.isFinite(value) ? <AnimatedNumber value={value} suffix="%" /> : <span aria-label="Not enough evidence">—</span>}
                </div>
                <PeriodDelta delta={delta} percent />
                {type === "shield" && analytics.summary.ruleCheckCounts && <p className="mt-2 text-center text-[10px] leading-4 text-white/50">{analytics.summary.ruleCheckCounts.followed} / {analytics.summary.ruleCheckCounts.checked} checks followed{analytics.summary.retrospectiveRuleChecks > 0 && <span className="mt-1 block text-violet-300">Includes retrospective checks</span>}</p>}
                {type === "scale" && <p className="mt-2 text-center text-[10px] leading-4 text-white/50">{analytics.summary.riskConsistencyComponents} of 3 limits evaluable</p>}
                {type === "focus" && <p className="mt-2 text-center text-[10px] leading-4 text-white/50">{analytics.summary.postLossEvidence.reviewed > 0 ? analytics.summary.postLossEvidence.followed + " / " + analytics.summary.postLossEvidence.reviewed + " follow-ups fully followed" : "No evaluable follow-ups"}</p>}
                {type === "focus" && analytics.summary.postLossEvidence.loggedOrderFollowUps > 0 && <span className="mt-1 text-center text-[10px] text-violet-300">Includes saved log order</span>}
                {analytics.source === "mock" && <Sparkline/>}
              </div>
            ))}
          </Panel>

          <Panel className="min-w-0 min-h-[117px] px-3 py-3 sm:px-6">
            <p className="mb-2 border-b border-white/15 pb-2 text-center text-sm text-white/70">
              Historical outcomes · not used in Discipline score
            </p>
            <div className="overflow-x-auto"><div className="grid min-w-[300px] grid-cols-[1.2fr_.8fr_1.1fr]">
              <HistoricalMetric icon="pnl" label="Net P&L" value={data.outcomes.pnl} tone={analytics.summary.netPnl < 0 ? "text-rose-400" : analytics.summary.netPnl > 0 ? "text-emerald-400" : "text-white/70"} />
              <HistoricalMetric icon="wins" label="Win rate" value={data.outcomes.winRate} />
              <HistoricalMetric icon="drawdown" label="Max drawdown" value={data.outcomes.drawdown} tone="text-rose-400" />
            </div></div>
          </Panel>
        </div>
      </div>
      {activeHelp && <aside id="analytics-kpi-help" role="note" className="analytics-panel rounded-xl border border-cyan-400/25 bg-[#0b111b] p-4 text-sm leading-6 text-white/70" onKeyDown={(event) => { if (event.key === "Escape") setActiveHelp(null); }}>
        <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-cyan-200">{data.kpis.find((item) => item.type === activeHelp)?.label}</p><p className="mt-2">{helpText[activeHelp]}</p><p className="mt-3 text-xs text-white/55">Colour ranges: <span className="text-rose-400">29% and below</span> · <span className="text-sky-300">30–49%</span> · <span className="text-orange-400">50–69%</span> · <span className="text-emerald-400">70% and above</span>.</p></div><button type="button" aria-label="Close metric explanation" onClick={() => setActiveHelp(null)} className="shrink-0 rounded px-2 py-1 text-white/60 hover:bg-white/10">×</button></div>
      </aside>}
      <PerformanceHistory trades={analytics.trades} scope={accountScope} periodLabel={periodProfiles[period].label} />
      <div className="grid items-stretch gap-3 min-[980px]:grid-cols-[1.15fr_1fr] min-[1600px]:grid-cols-[.94fr_1.02fr]">
        <div className="contents min-[1600px]:flex min-[1600px]:min-w-0 min-[1600px]:flex-col min-[1600px]:gap-3">
          <div className="order-1 min-w-0 min-[980px]:col-span-2"><Frequency period={period} analytics={analytics} activeFrequency={activeFrequency} setActiveFrequency={setActiveFrequency} /></div>
          <div className="order-3 flex min-w-0 flex-col min-[1600px]:flex-1"><MiniDayChart onExplore={() => setTab("EDGE")} analytics={analytics} /></div>
        </div>
        <div className="contents min-[1600px]:flex min-[1600px]:min-w-0 min-[1600px]:flex-col min-[1600px]:gap-3">
          <div className="order-2 min-w-0 min-[980px]:col-span-2"><SetupTable onViewAll={onViewSetups} period={period} analytics={analytics} /></div>
          <div className="order-4 min-w-0"><OutcomeBreakdown summary={analytics.summary} /></div>
          {analytics.source === "mock" && <div className="order-5 min-w-0"><BreachConcentration data={data} /></div>}
        </div>
      </div>
      <section aria-labelledby="analytics-faq-title" className="analytics-panel rounded-xl border border-white/15 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 id="analytics-faq-title" className="text-[18px] font-semibold">Analytics FAQs</h2>
        <div className="mt-2 divide-y divide-white/10">
      <details className="group text-xs text-white/65">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white/80 transition hover:text-cyan-200 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 [&::-webkit-details-marker]:hidden"><span>What counts as a clean day?</span><span aria-hidden="true" className="shrink-0 text-lg leading-none text-cyan-200"><span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span></span></summary>
        <p className="mt-1 leading-5">A clean day means you followed every applicable rule and executed with discipline. For example, if you followed your setup, stayed within your lot-size and daily limits, and broke no other rules, the day is clean even if it ended in a loss. Missing rule evidence cannot prove a clean day.</p>
        <p className="mt-3 leading-5">{selectedFrequency.sampleDays === 0 ? "No completed days in the selected frequency group for this period." : selectedFrequency.cleanDayRate === null ? `These ${selectedFrequency.sampleDays} completed ${selectedFrequency.dayDescription} have historical outcomes, but incomplete rule evaluations. Setup following alone cannot establish a clean day.` : `In these logs, ${selectedFrequency.cleanDayRate}% of ${selectedFrequency.sampleDays} completed ${selectedFrequency.dayDescription} were clean.`}</p>
        <p className="mt-2 text-[10px] text-violet-200">Selected frequency: {selectedFrequency.label} · {selectedFrequency.sampleDays} days</p>
        <p className="mt-3 pb-4 leading-5">A day is Green, Red, or BE from its final net P&amp;L. In All accounts, each account/day is counted separately. These historical rates describe completed logs and do not predict future outcomes.</p>
      </details>
      {analytics.summary.ruleCheckCounts && <details className="group text-xs text-white/65">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white/80 transition hover:text-cyan-200 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 [&::-webkit-details-marker]:hidden"><span>How is rule adherence calculated?</span><span aria-hidden="true" className="shrink-0 text-lg leading-none text-cyan-200"><span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span></span></summary>
        <p className="mt-3 leading-5">{analytics.summary.ruleCheckCounts.followed} followed ÷ {analytics.summary.ruleCheckCounts.checked} completed checks = {analytics.summary.ruleAdherence ?? "—"}%. Each rule is checked for each completed trade. Day limits apply to every trade on that account and day.</p>
        <div className="mt-3 space-y-2">{analytics.summary.ruleCheckBreakdown.map((row) => <div key={row.key} className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-white/10 pb-2"><span>{{ daily_loss_limit: "Daily loss limit", maximum_lot_contract_size: "Lot / contract size", maximum_trades_per_day: "Trades per day", no_overtrading: "No overtrading", trading_hours: "Allowed sessions" }[row.key] || row.key}</span><span className="font-mono">{row.followed} followed · {row.broken} breached{row.partial > 0 ? " · " + row.partial + " partial" : ""} · {row.unknown} need evidence</span></div>)}</div>
        <p className="mt-3 pb-4 leading-5">{analytics.summary.ruleCheckCounts.unknown} checks need evidence and are excluded from this percentage. A passing check alone does not make a whole trade clean. {analytics.summary.retrospectiveRuleChecks > 0 ? "Some checks compare older trades against the earliest saved rule or a displayed Rulebook default. These are retrospective comparisons, not proof that the limit applied at the time." : "Saved rule changes apply from their effective dates."}</p>
      </details>}
      <details className="group text-xs text-white/65">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-medium text-white/80 transition hover:text-cyan-200 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 [&::-webkit-details-marker]:hidden"><span>How are risk consistency and post-loss discipline calculated?</span><span aria-hidden="true" className="shrink-0 text-lg leading-none text-cyan-200"><span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span></span></summary>
        <div className="mt-3 grid gap-5 pb-4 md:grid-cols-2">
          <div><h3 className="font-semibold text-white/85">Risk consistency</h3>
            <p className="mt-2 leading-5">The average compliance rate across daily loss, lot / contract size, and trades per day. Day limits count once per account and trading day; lot size counts once per trade. Missing limits or values stay unscored.</p>
            <div className="mt-3 space-y-2">{analytics.summary.riskConsistencyBreakdown.map((row) => <div key={row.key} className="flex flex-wrap justify-between gap-2 border-b border-white/10 pb-2"><span>{row.label}</span><span className="font-mono">{row.rate === null ? "—" : Math.round(row.rate) + "%"} · {row.followed}/{row.reviewed} within limit · {row.unknown} unscored</span></div>)}</div>
            <p className="mt-3 leading-5">Daily loss uses final net day P&amp;L; it does not establish whether trading stopped after an earlier intraday loss. {analytics.summary.riskConsistencyBreakdown.some((row) => row.retrospective > 0) ? "Includes retrospective comparisons with displayed defaults or the earliest known saved limits. Dated rule changes apply from their effective dates." : "Saved limits apply from their effective dates."}</p>
          </div>
          <div><h3 className="font-semibold text-white/85">Post-loss discipline</h3>
            <p className="mt-2 leading-5">After each loss, check the next trade in the same account and day: was the setup fully followed and was lot size within its Rulebook limit? Repeat for the 2nd, 3rd and every later trade following a loss. The next trade’s profit or loss does not affect this check.</p>
            <p className="mt-3 font-mono">{analytics.summary.postLossEvidence.followed} fully followed / {analytics.summary.postLossEvidence.reviewed} evaluable follow-ups{analytics.summary.postLossDiscipline === null ? "" : " = " + analytics.summary.postLossDiscipline + "%"}</p>
            <p className="mt-3 leading-5">{analytics.summary.postLossEvidence.unknown} follow-ups need setup or lot-size evidence. Stopped after a loss: {analytics.summary.postLossEvidence.stopped}. Both are excluded from the percentage. {analytics.summary.postLossEvidence.loggedOrderFollowUps > 0 ? analytics.summary.postLossEvidence.loggedOrderFollowUps + " follow-ups use saved log order because execution times were not logged." : "Follow-ups use logged execution order."} No checks cross into another day. {analytics.summary.postLossEvidence.retrospective > 0 ? "Includes retrospective lot-limit comparisons." : ""}</p>
          </div>
        </div>
      </details>
        </div>
      </section>
    </div>
  );
}

function formatDayBarValue(value, metric) {
  if (!Number.isFinite(value)) return "—";
  if (metric === "Historical P&L") {
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}$${Math.abs(value).toLocaleString()}`;
  }
  return metric === "Compliance" || metric === "Breaches" || metric === "Setup followed" || metric === "Win rate" ? `${value}%` : value;
}

function DayBars({ metric, active, setActive, period, daysData }) {
  const profile = periodProfiles[period] || periodProfiles.all;
  const showComparison = period !== "all";
  const values = daysData.map((d) => ({
    ...d,
    month:
      metric === "Compliance"
        ? d.month
        : metric === "Breaches"
          ? Number.isFinite(d.month) ? 100 - d.month : null
          : metric === "Win rate" ? d.selectedWinRate : metric === "Setup followed" ? d.selectedSetupAdherence : d.selectedPnl,
    all:
      metric === "Compliance"
        ? d.all
        : metric === "Breaches"
          ? Number.isFinite(d.all) ? 100 - d.all : null
          : metric === "Win rate" ? d.allWinRate : metric === "Setup followed" ? d.allSetupAdherence : d.allPnl,
  }));
  const max =
    metric === "Historical P&L" ? Math.max(1, ...values.flatMap((value) => [Math.abs(value.month || 0), Math.abs(value.all || 0)])) : 100;
  return (
    <div className="mt-6 flex h-72 items-end gap-3 border-b border-white/10 px-2 sm:gap-6">
      {values.map((d, index) => {
        const series = [
          {
            key: "period",
            label: profile.chartLabel,
            value: d.month,
            barTone:
              metric === "Historical P&L"
                ? d.month > 0
                  ? "bg-emerald-400"
                  : d.month < 0 ? "bg-rose-400" : "bg-slate-500"
                : "bg-violet-500",
          },
          ...(showComparison
            ? [
                {
                  key: "all",
                  label: "All",
                  value: d.all,
                  barTone:
                    metric === "Historical P&L"
                      ? d.all > 0
                        ? "bg-emerald-400/45"
                        : d.all < 0 ? "bg-rose-400/45" : "bg-slate-500/45"
                      : "bg-cyan-500/80",
                },
              ]
            : []),
        ];
        return (
          <button
            key={d.day}
            onClick={() => setActive(d.day)}
            aria-label={`${d.day}: ${series.map((item) => `${item.label} ${formatDayBarValue(item.value, metric)}`).join(", ")}; ${d.trades} trades`}
            className={`relative flex h-full flex-1 items-end justify-center gap-1 rounded-t-xl px-1 pt-10 transition ${active === d.day ? "bg-violet-500/[0.08] ring-1 ring-inset ring-violet-400/70" : "hover:bg-white/[0.025]"}`}
          >
            {series.map((item, seriesIndex) => (
              <span
                key={item.key}
                className={`flex h-full flex-col items-center justify-end ${showComparison ? "w-[45%]" : "w-[58%] max-w-16"}`}
              >
                <span
                  className={`mb-1 whitespace-nowrap font-mono text-[9px] font-semibold sm:text-[10px] ${!Number.isFinite(item.value) ? "text-white/40" : metric === "Historical P&L" ? weekdayMoneyTone(item.value) : item.key === "period" ? "text-violet-300" : "text-cyan-300"}`}
                >
                  {showComparison && <span className="block text-[8px] font-normal text-white/35 sm:text-[9px]">{item.label}</span>}
                  {formatDayBarValue(item.value, metric)}
                </span>
                {Number.isFinite(item.value) && <span
                  className={`analytics-bar-rise w-full rounded-t ${item.barTone}`}
                  style={{
                    height: `${Math.max(4, (Math.abs(item.value) / max) * 68)}%`,
                    animationDelay: `${index * 70 + seriesIndex * 80}ms`,
                  }}
                />}
              </span>
            ))}
            <span className="absolute inset-x-0 top-full mt-2 text-center">
              <b
                className={active === d.day ? "text-violet-300" : "text-white/70"}
              >
                {d.day}
              </b>
              <span className="mt-1 block font-mono text-[10px] font-semibold text-white/75 sm:text-xs">{d.trades} trades</span>
              {metric !== "Win rate" && <span className="mt-0.5 block text-[9px] text-cyan-300 sm:text-[10px]">WR {formatPercent(d.selectedWinRate)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
function EvidenceBadge({ trades }) {
  const rankable = trades >= 10;
  return (
    <span className={`rounded-full border px-2 py-1 text-[9px] ${rankable ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300" : "border-amber-400/20 bg-amber-400/[0.07] text-amber-300"}`}>
      {rankable ? "Rankable" : "Provisional"}
    </span>
  );
}

function WeekdayComparisonTable({ daysData, details }) {
  const rows = [
    { group: "Sample", label: "Completed trades", value: (day) => day.trades },
    { label: "Trading days", value: (day) => details[day.day].tradingDays },
    { group: "Daily outcomes", label: "Avg day P&L", value: (day) => formatCurrency(details[day.day].averageDayPnl), tone: (day) => weekdayPnlDirection(details[day.day].averageDayPnl) },
    { label: "Median day P&L", value: (day) => formatCurrency(details[day.day].medianDayPnl), tone: (day) => weekdayPnlDirection(details[day.day].medianDayPnl) },
    { label: "Green-day rate", value: (day) => formatPercent(details[day.day].greenDayRate) },
    { label: "Historical trade win rate", value: (day) => formatPercent(details[day.day].tradeWinRate) },
    { label: "Avg win / Avg loss", value: (day) => `${formatCurrency(details[day.day].averageWin)} / ${formatCurrency(details[day.day].averageLoss)}` },
    { label: "Total P&L", value: (day) => formatCurrency(details[day.day].totalPnl), tone: (day) => weekdayPnlDirection(details[day.day].totalPnl) },
    { group: "Discipline", label: "Clean trades", value: (day) => `${day.clean} / ${day.trades}` },
    { label: "Clean-trade rate", value: (day) => formatPercent(day.month) },
    { label: "Setup adherence", value: (day) => formatPercent(details[day.day].setupAdherence) },
    { label: "Rule breaches", value: (day) => day.breached },
    { group: "Trade frequency", label: "Avg trades / day", value: (day) => formatAverageTrades(details[day.day].averageTradesPerDay) },
    { label: "1-trade days", value: (day) => formatPercent(details[day.day].distribution[0]) },
    { label: "2-trade days", value: (day) => formatPercent(details[day.day].distribution[1]) },
    { label: "3+ trade days", value: (day) => formatPercent(details[day.day].distribution[2]) },
    { group: "Setup & session context", label: "Most logged setup", value: (day) => details[day.day].setupTrades > 0 ? `${day.setup} · ${formatPercent(details[day.day].setupShare)}` : "—" },
    { label: "Highest observed session WR", value: (day) => {
      const ranked = [...details[day.day].sessions].filter((session) => session.name !== "Unassigned" && session.trades >= 10).sort((a, b) => b.winRate - a.winRate)[0];
      return ranked ? `${ranked.name} · ${ranked.winRate}% · ${formatCurrency(ranked.averagePnl)} avg` : "Not enough data";
    } },
  ];
  return (
    <Panel className="mt-3 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">All days comparison</h2>
          <p className="mt-1 text-xs text-white/45">Compare the same definitions across every weekday without changing the active day.</p>
        </div>
        <span className="text-[10px] text-white/40">Swipe horizontally on smaller screens →</span>
      </div>
      <div className="analytics-table-scrollbar mt-4 overflow-x-auto">
        <table className="w-full min-w-[1050px] border-separate border-spacing-0 text-left text-[13px] sm:text-sm">
          <thead className="text-[11px] text-white/45 sm:text-xs">
            <tr>
              <th className="sticky left-0 z-20 min-w-[200px] border-b border-white/15 bg-[#0b111b] px-3 py-3 font-normal">Metric</th>
              {daysData.map((day) => <th key={day.day} className="min-w-[165px] border-b border-white/15 px-3 py-3 font-semibold text-white/75">{{Mon:"Monday",Tue:"Tuesday",Wed:"Wednesday",Thu:"Thursday",Fri:"Friday"}[day.day]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th className={`sticky left-0 z-10 border-b border-white/[0.08] bg-[#0b111b] px-3 py-3 font-normal ${row.group ? "text-violet-200" : "text-white/50"}`}>
                  {row.group && <small className="mb-1 block text-[9px] uppercase tracking-[0.14em] text-violet-300/55 sm:text-[10px]">{row.group}</small>}
                  {row.label}
                </th>
                {daysData.map((day) => {
                  const positive = row.tone?.(day);
                  return <td key={day.day} className={`border-b border-white/[0.08] px-3 py-3 font-mono ${positive === true ? "text-emerald-400" : positive === false ? "text-rose-400" : "text-white/75"}`}>{row.value(day)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 grid gap-2 text-[10px] leading-4 text-white/40 sm:grid-cols-2">
        <p>Session ranking requires at least 10 completed trades. Smaller samples are shown as provisional and are not ranked.</p>
        <p>These are historical comparisons, not recommendations about which day or session to trade.</p>
      </div>
    </Panel>
  );
}

function DayEdge({ period, analytics }) {
  const [metric, setMetric] = useState("Win rate");
  const [active, setActive] = useState("Mon");
  const [view, setView] = useState("Weekday detail");
  const periodAnalytics = analytics || buildMockPeriodAnalytics(period);
  const daysData = periodAnalytics.days;
  const details = periodAnalytics.weekdayDetails;
  const selected = daysData.find((day) => day.day === active);
  const detail = details[active];
  const fullDay = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" }[active];
  const rankedSessions = [...detail.sessions].filter((session) => session.name !== "Unassigned" && session.trades >= 10).sort((a, b) => b.winRate - a.winRate);
  const strongestSession = rankedSessions[0];
  if (periodAnalytics.trades.length === 0) return <Panel className="p-6"><h1 className="text-xl font-semibold">No completed trades in {periodProfiles[period].label.toLowerCase()}</h1><p className="mt-2 text-sm text-white/55">Choose another period to compare weekdays and sessions.</p></Panel>;

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Day-of-week behaviour</h1>
          <p className="mt-2 text-sm text-white/50">See when your execution is most consistent — without turning past outcomes into trading advice.</p>
        </div>
        <span className="w-fit shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">{periodProfiles[period].label}</span>
      </div>
      <div className="mt-5 flex flex-col items-start gap-3 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
        <PillTabs value={view} onChange={setView} items={["Weekday detail", "All days comparison"]} textSize="text-[13px] sm:text-sm" />
        {view === "Weekday detail" && <div className="max-w-full lg:hidden"><PillTabs value={metric} onChange={setMetric} items={analytics?.source === "account" ? ["Win rate", "Setup followed", "Historical P&L"] : ["Win rate", "Compliance", "Breaches", "Historical P&L"]} /></div>}
      </div>

      {view === "All days comparison" ? (
        <WeekdayComparisonTable daysData={daysData} details={details} />
      ) : (
        <>
          <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_.75fr]">
            <Panel className="overflow-hidden p-5">
              <div className="mb-3 hidden justify-end lg:flex"><PillTabs value={metric} onChange={setMetric} items={analytics?.source === "account" ? ["Win rate", "Setup followed", "Historical P&L"] : ["Win rate", "Compliance", "Breaches", "Historical P&L"]} /></div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-white/65">{metric === "Compliance" ? "Clean-trade rate (%)" : metric === "Breaches" ? "Breach rate (%) · lower is better" : metric === "Setup followed" ? "Setup adherence (%)" : metric === "Win rate" ? "Historical trade win rate (%)" : metric}</span>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/65" aria-label="Chart legend">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1"><i className={`h-2 w-2 rounded-full ${metric === "Historical P&L" ? "bg-white/80" : "bg-violet-500"}`} aria-hidden="true" />{periodProfiles[period].label}</span>
                  {period !== "all" && <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1"><i className={`h-2 w-2 rounded-full ${metric === "Historical P&L" ? "bg-white/35" : "bg-cyan-500"}`} aria-hidden="true" />All time</span>}
                </div>
              </div>
              <DayBars metric={metric} active={active} setActive={setActive} period={period} daysData={daysData} />
              <div className="h-20" />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-white/45">
                <span>{period === "all" ? "Each bar shows the All-time value." : `Left bar: ${periodProfiles[period].chartLabel} · Right bar: All time. Trade counts use the selected period.`}</span>
                <span>{metric === "Win rate" ? "Win rate = wins ÷ completed trades; break-even stays in the total. Trade counts appear below each weekday." : metric === "Historical P&L" ? "Green = profit · Red = loss · faded = All time." : metric === "Breaches" ? "Lower breach rate means fewer rule violations." : "Select a weekday to see its details. WR = historical trade win rate."}</span>
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-2xl font-semibold">{fullDay} snapshot</h2>
              <p className="mt-1 text-xs text-white/45">{selected.trades} completed trades · {detail.tradingDays} trading days</p>
              {selected.trades > 0 && <p className="mt-2 text-xs text-white/60"><span className="text-emerald-400">{detail.wins} wins</span> · <span className="text-rose-400">{detail.losses} losses</span> · {detail.breakEven} break-even</p>}
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-white/10 py-4">
                <Metric label="Avg P&L / trading day" value={formatCurrency(detail.averageDayPnl)} tone={weekdayMoneyTone(detail.averageDayPnl)} />
                <Metric label="Median day P&L" value={formatCurrency(detail.medianDayPnl)} tone={weekdayMoneyTone(detail.medianDayPnl)} />
                <Metric label="Green-day rate" value={formatPercent(detail.greenDayRate)} />
                <Metric label="Trade win rate" value={formatPercent(detail.tradeWinRate)} />
                <Metric label="Clean-trade rate" value={formatPercent(selected.month)} />
                <Metric label="Setup adherence" value={formatPercent(detail.setupAdherence)} />
              </div>
              <p className="mt-4 text-xs text-white/45">Trades per day distribution</p>
              {[["1 trade", detail.distribution[0]], ["2 trades", detail.distribution[1]], ["3+ trades", detail.distribution[2]]].map(([label, value]) => (
                <div key={label} className="mt-3 grid grid-cols-[70px_1fr_35px] items-center gap-3 text-xs">
                  <span className="text-white/55">{label}</span><span className="h-1.5 overflow-hidden rounded bg-white/10"><i className="block h-full bg-violet-500" style={{ width: `${value ?? 0}%` }} /></span><span>{formatPercent(value)}</span>
                </div>
              ))}
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/55">Most logged setup: <b className="text-violet-300">{detail.setupTrades > 0 ? selected.setup : "—"}</b>{detail.setupTrades > 0 && <> · {detail.setupTrades} trades ({formatPercent(detail.setupShare)})</>}</p>
            </Panel>
          </div>

          <Panel className="mt-3 overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-semibold">{fullDay} by session</h2><p className="mt-1 text-[11px] text-white/40">Each session has its own denominator. Session win rates are not parts of a stacked total.</p></div>
              {strongestSession ? <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-2 text-[10px] text-cyan-200">Highest observed win rate · {strongestSession.name} {strongestSession.winRate}%</span> : <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-[10px] text-amber-200">Not enough data to rank reliably</span>}
            </div>
            <div className="analytics-table-scrollbar mt-4 overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead className="text-[10px] text-white/40"><tr>{["Session", "Completed trades", "Session days", "Share of weekday", "Historical win rate", "Avg P&L / session day", "Evidence"].map((heading) => <th key={heading} className="border-b border-white/15 px-3 py-2.5 font-normal">{heading}</th>)}</tr></thead>
                <tbody>{detail.sessions.map((session) => <tr key={session.name}>
                  <td className="border-b border-white/10 px-3 py-3 font-medium text-white/85">{session.name}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/75">{session.trades}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/75">{session.occurrences}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/75">{session.trades ? `${session.share}%` : "—"}</td>
                  <td className="border-b border-white/10 px-3 py-3"><div className="flex items-center gap-3"><b className="w-9 font-mono text-white/85">{session.winRate === null ? "—" : `${session.winRate}%`}</b>{session.winRate !== null && <span className="h-1.5 w-28 overflow-hidden rounded bg-white/10"><i className="block h-full bg-cyan-400" style={{ width: `${session.winRate}%` }} /></span>}</div>{session.trades > 0 && <span className="mt-1 block text-[10px] text-white/45">{session.wins} wins / {session.trades} trades</span>}</td>
                  <td className={`border-b border-white/10 px-3 py-3 font-mono ${weekdayMoneyTone(session.averagePnl)}`}>{formatCurrency(session.averagePnl)}</td>
                  <td className="border-b border-white/10 px-3 py-3">{session.trades ? session.name === "Unassigned" ? <span className="text-slate-300">Session not logged</span> : <EvidenceBadge trades={session.trades} /> : <span className="text-white/30">No logged trades</span>}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-white/35">Average day P&amp;L uses all {detail.tradingDays} logged {fullDay}s. Average P&amp;L per session day = that session’s total P&amp;L ÷ its session days. A date can appear in more than one session row. Session trade counts add up to the weekday total. Ranking requires a named session with at least 10 completed trades.</p>
          </Panel>

          <Panel className="mt-3 p-5">
            <h2 className="font-semibold">Historical outcome context</h2>
            <p className="mt-1 text-[11px] text-white/40">Describes past logs only. It does not affect your Discipline score and is not a recommendation to trade or avoid {fullDay}.</p>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6 [&>div>div:first-child]:min-h-[48px] [&>div>div:last-child]:whitespace-nowrap">
              <Metric label="Rule evidence: clean / partial / broken / unknown" value={<span className="whitespace-nowrap text-xs sm:text-base">{selected.clean} / {selected.partial} / {selected.breached} / {selected.unknown}</span>} />
              <Metric label="Trade win rate" value={formatPercent(detail.tradeWinRate)} />
              <Metric label="Total P&L" value={formatCurrency(detail.totalPnl)} tone={weekdayMoneyTone(detail.totalPnl)} />
              <Metric label="Avg win" value={formatCurrency(detail.averageWin)} tone={weekdayMoneyTone(detail.averageWin)} />
              <Metric label="Avg loss" value={formatCurrency(detail.averageLoss)} tone={weekdayMoneyTone(detail.averageLoss)} />
              <Metric label="Avg trades / day" value={formatAverageTrades(detail.averageTradesPerDay)} />
            </div>
          </Panel>


        </>
      )}
      <p className="mt-4 text-center text-[11px] text-white/40">Insights describe behaviour in your journal. They do not provide trading signals or predict results.</p>
    </div>
  );
}
function SetupEdge({ period, analytics }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All grades");
  const [sortBy, setSortBy] = useState("Evidence-ranked");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const periodSetups = useMemo(() => getSetupsForPeriod(period, analytics), [period, analytics]);
  const filteredSetups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...periodSetups]
      .filter((setup) => {
        const matchesQuery = setup.name.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          status === "All grades" ||
          (status === "A / A+ quality" && setup.executionScore !== null && setup.executionScore >= 80) ||
          (status === "B / C quality" && setup.executionScore !== null && setup.executionScore >= 60 && setup.executionScore < 80) ||
          (status === "D quality" && setup.executionScore !== null && setup.executionScore < 60) ||
          (status === "Needs rule evidence" && setup.executionScore === null) ||
          (status === "Provisional sample" && setup.sampleConfidence === "Provisional");
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "Highest quality") return (b.executionScore ?? -1) - (a.executionScore ?? -1);
        if (sortBy === "Most trades") return b.trades - a.trades;
        if (sortBy === "Historical P&L") return b.pnl - a.pnl;
        if (sortBy === "Name A–Z") return a.name.localeCompare(b.name);
        return sortByEvidence(a, b);
      });
  }, [periodSetups, query, sortBy, status]);
  const pageCount = Math.max(1, Math.ceil(filteredSetups.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const visibleSetups = filteredSetups.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );
  if (analytics.trades.length === 0) return <Panel className="p-6"><h1 className="text-xl font-semibold">No completed trades in {periodProfiles[period].label.toLowerCase()}</h1><p className="mt-2 text-sm text-white/55">Choose another period to review your setups.</p></Panel>;

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Setup analysis
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-white/50">
            Compare execution consistency across logged setups. Historical
            outcomes remain separate context and do not determine quality.
          </p>
        </div>
        <span className="w-fit shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
          {periodSetups.length} logged setups · {periodProfiles[period].label}
        </span>
      </div>

      <Panel className="mt-5 overflow-hidden p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_auto_auto] lg:items-center">
          <label className="relative block sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search setups</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search setups"
              className="w-full rounded-xl border border-white/15 bg-[#0b121d] px-4 py-2.5 text-sm outline-none transition placeholder:text-white/30 focus:border-violet-400"
            />
          </label>
          <select
            aria-label="Filter setups by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/15 bg-[#0b121d] px-4 py-2.5 text-sm text-white/75"
          >
            {["All grades", "A / A+ quality", "B / C quality", "D quality", "Needs rule evidence", "Provisional sample"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
          <select
            aria-label="Sort setups"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/15 bg-[#0b121d] px-4 py-2.5 text-sm text-white/75"
          >
            {["Evidence-ranked", "Highest quality", "Most trades", "Historical P&L", "Name A–Z"].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[10px] leading-5 text-white/45 lg:flex-row lg:items-center lg:justify-between">
          <span>
            Execution grade: <b className="text-cyan-200">A+ 90–100</b> · <b className="text-violet-200">A 80–89</b> · <b className="text-blue-200">B 70–79</b> · <b className="text-amber-200">C 60–69</b> · <b className="text-rose-200">D below 60</b>
          </span>
          <span>Historical win rate = wins ÷ completed trades · BE remains in total</span>
          <span>Sample: Established 30+ · Developing 10–29 · Provisional below 10</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-white/45 min-[1800px]:hidden">
          <span>Setup and Trades stay visible</span>
          <span className="whitespace-nowrap text-cyan-200/80">Swipe to see more →</span>
        </div>

        <p className="mt-3 text-[11px] leading-5 text-white/45">Execution quality = 60% setup adherence + 40% clean-trade rate. A trade with several setup tags appears once in each relevant row; row totals can exceed total trades. Streaks use recorded close times when complete, otherwise saved log order.</p>
        <div tabIndex={0} role="region" aria-label="Setup analysis table" className="analytics-table-scrollbar mt-3 overflow-x-auto xl:mt-5">
          <table className="w-full min-w-[1540px] border-separate border-spacing-0 text-left text-sm">
            <thead className="text-[11px] text-white/45">
              <tr>
                {["Setup", "Trades", "Results", "Avg W / Avg L", "Max streaks", "Historical mix / 10", "Historical win rate", "Execution quality", "Historical P&L", "Sample"].map(
                  (heading, index) => (
                    <th
                      key={heading}
                      className={`border-b border-white/15 pb-3 pr-5 font-normal ${
                        index === 0
                          ? "sticky left-0 z-30 w-[140px] min-w-[140px] sm:w-[210px] sm:min-w-[210px] bg-[#0b111b]"
                          : index === 1
                            ? "sticky left-[140px] sm:left-[210px] z-30 w-[64px] min-w-[64px] sm:w-[90px] sm:min-w-[90px] bg-[#0b111b] shadow-[12px_0_18px_-16px_rgba(0,0,0,.95)]"
                            : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visibleSetups.map((setup) => (
                <tr key={setup.name} className="analytics-row">
                  <td className="sticky left-0 z-20 w-[140px] min-w-[140px] sm:w-[210px] sm:min-w-[210px] border-b border-white/10 bg-[#0b111b] py-3.5 pr-5 font-medium text-violet-300">
                    {setup.name}
                  </td>
                  <td className="sticky left-[140px] sm:left-[210px] z-20 w-[64px] min-w-[64px] sm:w-[90px] sm:min-w-[90px] border-b border-white/10 bg-[#0b111b] py-3.5 pr-5 shadow-[12px_0_18px_-16px_rgba(0,0,0,.95)]">
                    {setup.trades}
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5"><OutcomeRecord setup={setup} /></td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <span className="inline-flex gap-2 font-sans tabular-nums text-sm font-medium whitespace-nowrap" aria-label={`Average win ${formatCurrency(setup.avgWin)}, average loss ${formatCurrency(setup.avgLoss)}`}>
                      <span className={weekdayMoneyTone(setup.avgWin)}>{formatCurrency(setup.avgWin)}</span>
                      <span className={weekdayMoneyTone(setup.avgLoss)}>{formatCurrency(setup.avgLoss)}</span>
                    </span>
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <span className="font-sans tabular-nums text-sm font-medium whitespace-nowrap" aria-label={`Maximum win streak ${setup.maxWinStreak}, maximum loss streak ${setup.maxLossStreak}; ${setup.streakOrder}`} title={setup.streakOrder}>
                      <span className="text-emerald-400">W{setup.maxWinStreak}</span>
                      <span className="px-1 text-white/25">/</span>
                      <span className="text-rose-400">L{setup.maxLossStreak}</span>
                    </span>
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <OutcomeMix setup={setup} />
                  </td>
                  <td
                    className="border-b border-white/10 py-3.5 pr-5 font-sans tabular-nums text-white/85"
                    aria-label={`${setup.historicalWinRate} percent historical win rate`}
                  >
                    {setup.historicalWinRate}%
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <QualityBadge setup={setup} />
                  </td>
                  <td
                    className={`border-b border-white/10 py-3.5 pr-5 font-sans tabular-nums ${weekdayMoneyTone(setup.pnl)}`}
                  >
                    {formatCurrency(setup.pnl)}
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-2">
                    <SampleBadge confidence={setup.sampleConfidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleSetups.length === 0 && (
            <div className="grid min-h-40 place-items-center text-sm text-white/45">
              No setups match this search and filter.
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-[11px] leading-5 text-white/45">
            Higher grades reflect more consistent rule execution in past logs.
            Historical outcomes do not predict future results or recommend which setup to trade.
          </p>
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <button
              disabled={activePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-white/15 px-3 py-2 text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <span className="px-2 text-white/50">
              Page {activePage} of {pageCount}
            </span>
            <button
              disabled={activePage === pageCount}
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              className="rounded-lg border border-white/15 px-3 py-2 text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Edge({ view, onChangeView, period, analytics, accountScope }) {
  return (
    <div>
      <div className="mb-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1">
        {[['days', 'Day analysis'], ['setups', 'Setup analysis'], ['performance', 'Performance']].map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => onChangeView(value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 ${view === value ? "bg-violet-500/20 text-violet-200" : "text-white/50 hover:text-white/80"}`}
            >
              {label}
            </button>
          ),
        )}
      </div>
      {view === "performance" ? <PerformanceTable trades={analytics.trades} scope={accountScope} periodLabel={periodProfiles[period].label} /> : view === "setups" ? <SetupEdge period={period} analytics={analytics} /> : <DayEdge period={period} analytics={analytics} />}
    </div>
  );
}

function Coach({ analytics, period }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [sessionOutcomes, setSessionOutcomes] = useState([]);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const rankedRows = [...analytics.frequency.rows]
    .filter((row) => row.sampleDays > 0)
    .sort((a, b) => a.cleanDayRate - b.cleanDayRate || b.sampleDays - a.sampleDays);
  const focusRow = rankedRows[focusIndex % Math.max(rankedRows.length, 1)] || analytics.frequency.rows[2];
  const comparisonRow = [...rankedRows].sort((a, b) => b.cleanDayRate - a.cleanDayRate)[0] || focusRow;
  const sampleState = focusRow.sampleDays >= 30 ? "Established" : focusRow.sampleDays >= 10 ? "Developing" : "Provisional";
  const sampleTone = sampleState === "Established" ? "text-cyan-200" : sampleState === "Developing" ? "text-violet-200" : "text-amber-200";
  const focusCopy = {
    one: {
      title: "Strengthen the pre-trade rule check.",
      summary: "Your 1-trade days currently have the lowest clean-day rate in this period. Review the plan before the first execution so the only trade of the day starts with complete rule evidence.",
      steps: ["Write the valid setup and invalidation before entry.", "Confirm planned risk and the daily loss rule.", "Complete the rule checklist immediately after the trade closes."],
    },
    two: {
      title: "Add a deliberate pause before trade two.",
      summary: "Your 2-trade days currently have the lowest clean-day rate in this period. Use a short reset before the second trade to confirm that the setup, risk, and daily rules still support it.",
      steps: ["Review the first trade without using its P&L as the reason for another trade.", "Reconfirm setup validity and remaining planned risk.", "Record the rule-based reason before taking trade two."],
    },
    "three-plus": {
      title: "Use a rule reset before a third trade.",
      summary: "Your 3+ trade days currently have the lowest clean-day rate in this period. Add a deliberate reset after trade two so further trades require fresh setup and risk confirmation.",
      steps: ["Pause after the second completed trade.", "Reconfirm the setup, remaining risk, and daily trade limit.", "Write the rule-based reason before any additional trade."],
    },
  }[focusRow.key];
  const sessionGoal = 5;
  const completedSessions = sessionOutcomes.length;
  const progress = Math.round((completedSteps.length / focusCopy.steps.length) * 100);
  const currentSessionComplete = completedSteps.length === focusCopy.steps.length;
  const conclusiveSessions = sessionOutcomes.filter((outcome) => outcome !== "needs-evidence");
  const cleanSessions = conclusiveSessions.filter((outcome) => outcome === "clean").length;
  const notFollowedSessions = conclusiveSessions.filter((outcome) => outcome === "not-followed").length;
  const needsEvidenceSessions = sessionOutcomes.filter((outcome) => outcome === "needs-evidence").length;
  const practiceCleanRate = conclusiveSessions.length ? Math.round((cleanSessions / conclusiveSessions.length) * 100) : null;
  const practiceComplete = completedSessions >= sessionGoal;
  const reviewState = !practiceComplete ? null : conclusiveSessions.length < 3
    ? { label: "More evidence needed", detail: "Fewer than three sessions have conclusive rule evidence. Complete the missing reviews before judging improvement.", tone: "border-slate-300/25 bg-slate-400/[0.06] text-slate-200" }
    : practiceCleanRate > focusRow.cleanDayRate
      ? { label: "Clean execution improved", detail: `The practice clean rate is ${practiceCleanRate - focusRow.cleanDayRate} percentage points above the historical baseline.`, tone: "border-emerald-300/25 bg-emerald-400/[0.06] text-emerald-200" }
      : practiceCleanRate === focusRow.cleanDayRate
        ? { label: "Clean execution is unchanged", detail: "The practice clean rate matches the historical baseline. Another cycle can help confirm the pattern.", tone: "border-cyan-300/25 bg-cyan-400/[0.06] text-cyan-200" }
        : { label: "Repeat this practice", detail: `The practice clean rate is ${focusRow.cleanDayRate - practiceCleanRate} percentage points below the historical baseline. Review the not-followed sessions before another cycle.`, tone: "border-amber-300/25 bg-amber-400/[0.06] text-amber-200" };
  const outcomeOptions = [
    { key: "clean", label: "Clean", help: "All relevant rules followed", tone: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" },
    { key: "not-followed", label: "Not followed", help: "At least one rule was not followed", tone: "border-rose-300/30 bg-rose-400/10 text-rose-200" },
    { key: "needs-evidence", label: "Needs evidence", help: "The review is still incomplete", tone: "border-slate-300/25 bg-slate-400/10 text-slate-200" },
  ];
  const toggleStep = (index) => setCompletedSteps((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  const logPracticeSession = () => {
    if (!currentSessionComplete || !selectedOutcome || completedSessions >= sessionGoal) return;
    setSessionOutcomes((current) => [...current, selectedOutcome].slice(0, sessionGoal));
    setCompletedSteps([]);
    setSelectedOutcome(null);
  };
  const resetPractice = () => {
    setCompletedSteps([]);
    setSessionOutcomes([]);
    setSelectedOutcome(null);
  };
  const chooseNextFocus = () => {
    resetPractice();
    if (rankedRows.length > 1) setFocusIndex((current) => (current + 1) % rankedRows.length);
  };
  useEffect(() => {
    setFocusIndex(0);
  }, [period]);
  useEffect(() => {
    setCompletedSteps([]);
    setSessionOutcomes([]);
    setSelectedOutcome(null);
  }, [period, focusRow.key]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Coach Me</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/50">Turn one verified discipline pattern into one measurable practice.</p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">Based on {periodProfiles[period].label}</span>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1.25fr_.75fr]">
        <Panel className="overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-xl text-violet-300">✦</span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[.14em] text-violet-300/75">Next Focus</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{focusCopy.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">{focusCopy.summary}</p>
              </div>
            </div>
            <span className={`w-fit shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] ${sampleTone}`}>{sampleState} evidence</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/10 p-4"><span className="text-[10px] text-white/40">Focus pattern</span><p className="mt-1 font-semibold text-white/85">{focusRow.label} days</p><p className="mt-1 text-[10px] text-white/40">{focusRow.sampleDays} completed days</p></div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-4"><span className="text-[10px] text-white/40">Clean-day rate</span><p className="mt-1 font-mono text-2xl font-semibold text-amber-200">{focusRow.cleanDayRate}%</p><p className="mt-1 text-[10px] text-white/40">Known evidence only</p></div>
            <div className="rounded-xl border border-white/10 bg-black/10 p-4"><span className="text-[10px] text-white/40">Comparison</span><p className="mt-1 font-mono text-2xl font-semibold text-cyan-200">{comparisonRow.cleanDayRate}%</p><p className="mt-1 text-[10px] text-white/40">{comparisonRow.label} days</p></div>
          </div>

          {practiceComplete ? (
            <div className="mt-5">
              <div className={`rounded-2xl border p-4 sm:p-5 ${reviewState.tone}`}>
                <p className="text-[10px] font-medium uppercase tracking-[.14em] opacity-70">Five-session review</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div><h3 className="text-lg font-semibold text-white/90">{reviewState.label}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-white/55">{reviewState.detail}</p></div>
                  <span className="w-fit shrink-0 rounded-full border border-current/20 bg-black/10 px-3 py-1.5 font-mono text-xs">{practiceCleanRate === null ? "—" : `${practiceCleanRate}%`} practice</span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/10 p-3"><span className="text-[10px] text-white/40">Historical baseline</span><p className="mt-1 font-mono text-xl font-semibold text-cyan-200">{focusRow.cleanDayRate}%</p></div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3"><span className="text-[10px] text-white/40">Conclusive evidence</span><p className="mt-1 font-mono text-xl font-semibold text-white/80">{conclusiveSessions.length}/{sessionGoal}</p></div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3"><span className="text-[10px] text-white/40">Session outcomes</span><p className="mt-1 text-xs"><span className="font-mono text-emerald-200">{cleanSessions} Clean</span><span className="text-white/25"> · </span><span className="font-mono text-rose-200">{notFollowedSessions} Not followed</span><span className="text-white/25"> · </span><span className="font-mono text-slate-200">{needsEvidenceSessions} Need evidence</span></p></div>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={resetPractice} className="rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/65 transition hover:border-white/25 hover:text-white/85">Repeat this practice</button>
                <button type="button" onClick={chooseNextFocus} disabled={rankedRows.length < 2} className="rounded-lg border border-violet-300/30 bg-violet-400/10 px-4 py-2.5 text-xs font-medium text-violet-100 transition hover:border-violet-200/50 hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.02] disabled:text-white/30">Review next focus</button>
              </div>
              <p className="mt-2 text-[10px] text-white/35">This review measures rule execution only. It does not use P&amp;L or recommend which setup to trade.</p>
            </div>
          ) : (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Current practice session</h3><span className="font-mono text-xs text-white/45">{completedSteps.length}/{focusCopy.steps.length} checks</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
            <div className="mt-3 space-y-2">
              {focusCopy.steps.map((step, index) => {
                const complete = completedSteps.includes(index);
                return <button key={step} type="button" aria-pressed={complete} onClick={() => toggleStep(index)} className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-xs transition ${complete ? "border-emerald-400/25 bg-emerald-400/[0.06] text-white/70" : "border-white/10 bg-black/10 text-white/60 hover:border-violet-300/25"}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[10px] ${complete ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200" : "border-white/20 text-transparent"}`}>✓</span><span className={complete ? "line-through decoration-white/25" : ""}>{step}</span></button>;
              })}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-medium text-white/75">Session result</p><p className="text-[10px] text-white/35">Choose after completing all three checks.</p></div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {outcomeOptions.map((outcome) => {
                  const selected = selectedOutcome === outcome.key;
                  return <button key={outcome.key} type="button" disabled={!currentSessionComplete || completedSessions >= sessionGoal} aria-pressed={selected} onClick={() => setSelectedOutcome(outcome.key)} className={`rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.02] disabled:text-white/25 ${selected ? outcome.tone : "border-white/10 bg-white/[0.025] text-white/60 hover:border-white/20"}`}><span className="block text-[11px] font-semibold">{outcome.label}</span><span className="mt-0.5 block text-[9px] opacity-65">{outcome.help}</span></button>;
                })}
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5" aria-label={`${completedSessions} of ${sessionGoal} practice sessions logged`}>
                  {Array.from({ length: sessionGoal }, (_, index) => {
                    const outcome = sessionOutcomes[index];
                    const outcomeLabel = outcome === "clean" ? "C" : outcome === "not-followed" ? "N" : outcome === "needs-evidence" ? "?" : index + 1;
                    const outcomeTone = outcome === "clean" ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100" : outcome === "not-followed" ? "border-rose-300/35 bg-rose-400/15 text-rose-100" : outcome === "needs-evidence" ? "border-slate-300/30 bg-slate-400/15 text-slate-100" : "border-white/10 bg-white/[0.02] text-white/35";
                    const accessibleOutcome = outcome === "clean" ? "Clean" : outcome === "not-followed" ? "Not followed" : outcome === "needs-evidence" ? "Needs evidence" : "Not logged";
                    return <span key={index} title={`Session ${index + 1}: ${accessibleOutcome}`} aria-label={`Session ${index + 1}: ${accessibleOutcome}`} className={`grid h-7 w-7 place-items-center rounded-lg border font-mono text-[10px] transition ${outcomeTone}`}>{outcomeLabel}</span>;
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-white/40">{completedSessions}/{sessionGoal} sessions logged</p>
                {completedSessions ? <p className="mt-1 text-[9px] text-white/35"><span className="text-emerald-200">C Clean</span> · <span className="text-rose-200">N Not followed</span> · <span className="text-slate-200">? Needs evidence</span></p> : null}
              </div>
              <button type="button" disabled={!currentSessionComplete || !selectedOutcome || completedSessions >= sessionGoal} onClick={logPracticeSession} className="rounded-lg border border-violet-300/30 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-100 transition hover:border-violet-200/50 hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.02] disabled:text-white/30">
                {completedSessions >= sessionGoal ? "Practice complete" : "Log practice session"}
              </button>
            </div>
            {completedSessions < sessionGoal ? <p className="mt-2 text-[10px] text-white/35">{!currentSessionComplete ? "Complete all three checks to log this session." : !selectedOutcome ? "Choose the session result to continue." : "Ready to log this practice session."}</p> : null}
          </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel className="p-5">
            <h2 className="text-[18px] font-semibold">How success is measured</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3"><div><p className="text-xs font-medium text-white/80">Complete the practice</p><p className="mt-1 text-[10px] text-white/40">Use all three checks across five sessions.</p></div><b className="whitespace-nowrap font-mono text-violet-200">{completedSessions}/{sessionGoal} sessions</b></div>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3"><div><p className="text-xs font-medium text-white/80">Improve clean execution</p><p className="mt-1 text-[10px] text-white/40">{practiceCleanRate === null ? "Measure only conclusive rule evidence." : `${conclusiveSessions.length} conclusive ${conclusiveSessions.length === 1 ? "session" : "sessions"} · ${focusRow.cleanDayRate}% baseline`}</p></div><b className="whitespace-nowrap font-mono text-cyan-200">{practiceCleanRate === null ? `${focusRow.cleanDayRate}% baseline` : `${practiceCleanRate}% practice`}</b></div>
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-white/80">Close evidence gaps</p><p className="mt-1 text-[10px] text-white/40">Finish incomplete rule evaluations.</p></div><b className="font-mono text-slate-300">{analytics.summary.needsEvidence} need review</b></div>
            </div>
          </Panel>
          <Panel className="p-5 text-xs leading-5 text-white/45">
            <b className="text-white/75">Why this focus:</b> {focusRow.label} days have the lowest observed clean-day rate in the selected period. This is a review priority, not a recommendation to trade more or less.
          </Panel>
          <Panel className="border-blue-300/10 bg-blue-400/[0.025] p-5 text-xs leading-5 text-white/45">
            Coaching uses rule adherence, setup adherence, risk consistency, and post-loss behaviour. Historical P&amp;L does not change the focus or Discipline score.
          </Panel>
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-white/35">Practice progress in this mockup is temporary and is not saved.</p>
    </div>
  );
}

export default function AIAnalyticsMockup() {
  const [mounted, setMounted] = useState(false),
    [tab, setTab] = useState("Overview"),
    [edgeView, setEdgeView] = useState("days"),
    [period, setPeriod] = useState("all"),
    [introActive, setIntroActive] = useState(false),
    [accountAnalytics, setAccountAnalytics] = useState({ status: "loading", trades: [], setupNames: [], accountScope: "all accounts", error: null });
  useEffect(() => {
    let hasPlayed = false;
    try {
      hasPlayed = window.sessionStorage.getItem(INTRO_SESSION_KEY) === "played";
      const savedPeriod = window.sessionStorage.getItem(PERIOD_SESSION_KEY);
      if (savedPeriod && periodProfiles[savedPeriod]) setPeriod(savedPeriod);
    } catch {
      // The mockup still works when browser storage is unavailable.
    }
    setIntroActive(!hasPlayed);
    setMounted(true);
    if (hasPlayed) return undefined;
    const markPlayedId = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(INTRO_SESSION_KEY, "played");
      } catch {
        // Keep the intro non-blocking when browser storage is unavailable.
      }
    }, 0);
    const timerId = window.setTimeout(() => setIntroActive(false), 1350);
    return () => {
      window.clearTimeout(markPlayedId);
      window.clearTimeout(timerId);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai-analytics/local-data", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load account analytics.");
        return payload;
      })
      .then((payload) => {
        if (!cancelled) {
          setAccountAnalytics({
            status: "ready",
            trades: payload.trades || [],
            setupNames: payload.setupNames || [],
            accountScope: payload.accountScope || "all accounts",
            error: null,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) setAccountAnalytics({ status: "error", trades: [], setupNames: [], accountScope: "all accounts", error: error.message });
      });
    return () => { cancelled = true; };
  }, []);
  const handlePeriodChange = (nextPeriod) => {
    setIntroActive(false);
    setPeriod(nextPeriod);
    try {
      window.sessionStorage.setItem(PERIOD_SESSION_KEY, nextPeriod);
    } catch {
      // Keep the shared period control usable when browser storage is unavailable.
    }
  };
  const periodAnalytics = useMemo(
    () => accountAnalytics.status === "ready"
      ? buildPeriodAnalyticsFromTrades(accountAnalytics.trades, period, undefined, accountAnalytics.setupNames)
      : buildMockPeriodAnalytics(period),
    [accountAnalytics, period],
  );
  const overviewData = useMemo(
    () => buildOverviewData(period, periodAnalytics),
    [period, periodAnalytics],
  );
  if (!mounted || accountAnalytics.status === "loading")
    return (
      <div
        className="min-h-full bg-[#07101a]"
        aria-label="Loading AI Analytics mockup"
      />
    );
  if (accountAnalytics.status === "error") return (
    <div className="min-h-full bg-[#07101a] p-6 text-[#f4f6fb]">
      <div className="mx-auto max-w-xl rounded-xl border border-amber-300/25 bg-amber-300/[0.05] p-5">
        <h1 className="text-xl font-semibold">Account analytics could not load</h1>
        <p className="mt-2 text-sm text-white/60">{accountAnalytics.error}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5">Retry</button>
      </div>
    </div>
  );
  return (
    <IntroMotionContext.Provider value={introActive}>
    <div className={`ai-analytics-motion min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-[#07101a] text-[#f4f6fb] ${introActive ? "ai-analytics-intro" : ""}`}>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#07101a]/95 backdrop-blur">
        <div className="flex h-[60px] items-center justify-between gap-4 px-4 sm:px-7">
          <nav
            className="flex"
            aria-label="AI Analytics sections"
          >
            <div className="flex gap-3 sm:gap-7">
              {["Overview", "EDGE"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setIntroActive(false);
                    setTab(item);
                    if (item === "EDGE") setEdgeView("days");
                  }}
                  className={`relative whitespace-nowrap px-2 py-5 text-sm transition sm:px-3 sm:text-base ${tab === item ? "text-white" : "text-white/60 hover:text-white/80"}`}
                >
                  {item}
                  {tab === item && <i className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-gradient-to-r from-violet-500 to-cyan-400" />}
                </button>
              ))}
            </div>
          </nav>
          <PeriodSelect value={period} onChange={handlePeriodChange} className="hidden sm:block" />
        </div>
      </header>
      <main className="w-full min-w-0 max-w-full px-4 pb-0 pt-6 sm:px-6">
        {tab === "Overview" && (
          <>
            <div className="mb-4 flex flex-col items-start gap-3 sm:block">
              <div className="min-w-0">
                <h1 className="text-[38px] font-bold leading-tight tracking-tight">
                  AI Analytics
                </h1>
                <p className="mt-1 text-base text-white/60">
                  Your trading discipline, clearly explained.
                </p>
                <p className="mt-2 text-[11px] text-cyan-300/75">Account logs · {accountAnalytics.trades.length} completed trades for {accountAnalytics.accountScope}</p>
              </div>
              <PeriodSelect value={period} onChange={handlePeriodChange} className="self-end sm:hidden" />
            </div>
            <Overview
              data={overviewData}
              analytics={periodAnalytics}
              accountScope={accountAnalytics.accountScope}
              period={period}
              setTab={(item) => {
                setIntroActive(false);
                setTab(item);
                if (item === "EDGE") setEdgeView("days");
              }}
              onViewSetups={() => {
                setIntroActive(false);
                setEdgeView("setups");
                setTab("EDGE");
              }}
            />
          </>
        )}
        {tab === "EDGE" && (
          <>
            <div className="mb-4 flex justify-end sm:hidden">
              <PeriodSelect value={period} onChange={handlePeriodChange} />
            </div>
            <Edge
              view={edgeView}
              accountScope={accountAnalytics.accountScope}
              period={period}
              analytics={periodAnalytics}
              onChangeView={(view) => {
                setIntroActive(false);
                setEdgeView(view);
              }}
            />
          </>
        )}
      </main>
      <style jsx global>{`
        .ai-analytics-motion .analytics-panel {
          transition: border-color 240ms ease, box-shadow 240ms ease, transform 240ms ease;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-panel {
          animation: analytics-panel-in 520ms cubic-bezier(.2,.8,.2,1) both;
        }
        .ai-analytics-motion .analytics-gauge {
          transition: transform 300ms cubic-bezier(.2,.8,.2,1), filter 300ms ease;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-ring-enter {
          animation: analytics-ring-in 780ms cubic-bezier(.2,.8,.2,1) both;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-arc-draw,
        .ai-analytics-motion.ai-analytics-intro .analytics-line-draw {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: analytics-line-draw 900ms cubic-bezier(.3,.7,.2,1) forwards;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-arc-delay-1 { animation-delay: 110ms; }
        .ai-analytics-motion.ai-analytics-intro .analytics-arc-delay-2 { animation-delay: 310ms; }
        .ai-analytics-motion.ai-analytics-intro .analytics-line-delay { animation-delay: 180ms; }
        .ai-analytics-motion.ai-analytics-intro .analytics-chart-point {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          animation: analytics-point-in 380ms cubic-bezier(.2,.9,.3,1.35) forwards;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-donut-draw {
          stroke-dashoffset: 100;
          animation: analytics-donut-in 900ms cubic-bezier(.2,.8,.2,1) 160ms forwards;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-bar-rise {
          transform: scaleY(0);
          transform-origin: bottom;
          animation: analytics-bar-rise 680ms cubic-bezier(.2,.85,.25,1) forwards;
        }
        .ai-analytics-motion.ai-analytics-intro .analytics-segments {
          transform: scaleX(0);
          transform-origin: left;
          animation: analytics-segments-in 720ms cubic-bezier(.2,.8,.2,1) 180ms forwards;
        }
        .ai-analytics-motion .analytics-scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .ai-analytics-motion .analytics-scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .ai-analytics-motion .analytics-table-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(96, 165, 250, .55) rgba(255, 255, 255, .06);
          scrollbar-gutter: stable;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
        }
        .ai-analytics-motion .analytics-table-scrollbar::-webkit-scrollbar {
          height: 7px;
        }
        .ai-analytics-motion .analytics-table-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, .06);
          border-radius: 999px;
        }
        .ai-analytics-motion .analytics-table-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(124, 92, 255, .72), rgba(45, 212, 255, .72));
          border-radius: 999px;
        }
        .ai-analytics-motion .analytics-kpi,
        .ai-analytics-motion .analytics-row {
          transition: background-color 220ms ease, color 220ms ease, transform 220ms ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .ai-analytics-motion .analytics-panel:hover {
            border-color: rgba(129, 112, 255, .48);
            box-shadow: 0 16px 42px rgba(2, 8, 18, .32), 0 0 0 1px rgba(113, 135, 255, .08);
            transform: translateY(-2px);
          }
          .ai-analytics-motion .analytics-gauge:hover {
            filter: brightness(1.08) drop-shadow(0 0 16px rgba(93, 124, 255, .16));
            transform: scale(1.018);
          }
          .ai-analytics-motion .analytics-kpi:hover {
            background: rgba(113, 135, 255, .055);
            transform: translateY(-2px);
          }
          .ai-analytics-motion .analytics-row:hover {
            background: rgba(255, 255, 255, .025);
            transform: translateX(2px);
          }
          .ai-analytics-motion button:not(:disabled):hover {
            transform: translateY(-1px);
          }
          .ai-analytics-motion .analytics-chart-point:hover {
            filter: brightness(1.25);
          }
        }
        @keyframes analytics-panel-in {
          from { opacity: 0; filter: blur(3px); }
          to { opacity: 1; filter: blur(0); }
        }
        @keyframes analytics-ring-in {
          from { opacity: 0; filter: brightness(.7) blur(5px); }
          to { opacity: 1; filter: brightness(1) blur(0); }
        }
        @keyframes analytics-line-draw { to { stroke-dashoffset: 0; } }
        @keyframes analytics-point-in {
          from { opacity: 0; transform: scale(.4); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes analytics-donut-in { to { stroke-dashoffset: 0; } }
        @keyframes analytics-bar-rise { to { transform: scaleY(1); } }
        @keyframes analytics-segments-in { to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) {
          .ai-analytics-motion *,
          .ai-analytics-motion *::before,
          .ai-analytics-motion *::after {
            animation-duration: .01ms !important;
            animation-delay: 0ms !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </div>
    </IntroMotionContext.Provider>
  );
}
