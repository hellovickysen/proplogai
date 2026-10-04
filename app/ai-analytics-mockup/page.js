"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildMockPeriodAnalytics } from "./mock-analytics-adapter.mjs";

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

function getSetupsForPeriod(period) {
  return buildMockPeriodAnalytics(period).setups;
}

const sampleRank = { Established: 3, Developing: 2, Provisional: 1 };

function sortByEvidence(a, b) {
  return (
    sampleRank[b.sampleConfidence] - sampleRank[a.sampleConfidence] ||
    b.executionScore - a.executionScore ||
    b.trades - a.trades
  );
}
const logRows = [
  ["May 13, 2025", "1", "London Breakout", "Clean", "0.75R", "+0.9R"],
  ["May 13, 2025", "2", "London Breakout", "Clean", "1.00R", "-0.6R"],
  ["May 13, 2025", "3", "NY Open Reversal", "Clean", "0.75R", "+1.2R"],
  ["May 6, 2025", "1", "London Breakout", "Daily loss limit", "1.00R", "-1.0R"],
];

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
  return <svg viewBox="0 0 24 24" className={`h-9 w-9 shrink-0 fill-none ${type === "drawdown" ? "stroke-rose-400" : "stroke-[#8394bd]"}`} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function HistoricalMetric({ icon, label, value, tone = "text-white" }) {
  return <div className="flex min-w-0 items-center justify-center gap-3 border-l border-white/15 px-4 first:border-0"><OutcomeIcon type={icon}/><div className="min-w-0"><div className="text-[11px] text-white/55">{label}</div><div className={`mt-0.5 font-mono text-xl font-semibold leading-none ${tone}`}>{value}</div></div></div>;
}
function PillTabs({ value, onChange, items, textSize = "text-xs" }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
          className={`rounded-lg px-4 py-2 ${textSize} transition ${value === item ? "bg-gradient-to-r from-violet-600 to-blue-500 font-semibold text-white" : "text-white/50 hover:text-white"}`}
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
      className={`rounded-lg border border-white/25 bg-[#0b111b] px-3 py-2 text-xs text-white/80 sm:px-4 sm:py-2.5 sm:text-sm ${className}`}
    >
      <option value="all">▣ All time</option>
      <option value="thisMonth">▣ {periodProfiles.thisMonth.label}</option>
      <option value="thisWeek">▣ This week</option>
      <option value="lastWeek">▣ Last week</option>
      <option value="lastMonth">▣ {periodProfiles.lastMonth.label}</option>
    </select>
  );
}

function Ring({ value, delta }) {
  return (
    <div className="analytics-gauge analytics-ring-enter relative grid h-[222px] w-[222px] shrink-0 place-items-center rounded-full">
      <svg viewBox="0 0 222 222" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="disciplineRingGradient" gradientUnits="userSpaceOnUse" x1="35" y1="190" x2="190" y2="20">
            <stop stopColor="#7868ff" />
            <stop offset="1" stopColor="#42c9ee" />
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
          strokeDasharray="45 315"
          strokeDashoffset="-379"
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
          strokeDasharray="254 106"
          strokeDashoffset="-120"
        />
      </svg>
      <div className="relative grid h-[86%] w-[86%] place-items-center rounded-full bg-[#0b111b] text-center">
        <div>
          <div className="font-mono text-[68px] font-bold leading-none tracking-[-.06em]">
            <AnimatedNumber value={value} />
          </div>
          <div className="mt-1 text-xs tracking-wide text-white/55">
            DISCIPLINE / 100
          </div>
          <PeriodDelta delta={delta} />
        </div>
      </div>
    </div>
  );
}
function ComplianceDome({ data, onNeedsEvidence, needsEvidenceOpen }) {
  return (
    <div className="analytics-gauge relative mx-auto h-[195px] w-full min-w-0 max-w-[430px] shrink-0 overflow-hidden sm:h-auto sm:aspect-[300/160] sm:justify-self-center sm:shrink">
      <svg
        viewBox="0 0 300 160"
        className="absolute inset-x-0 top-0 h-[78%] w-full"
        aria-label={`${data.totalTrades} total trades: ${data.clean} clean, ${data.notFollowed} not followed, and ${data.needsEvidence} need evidence`}
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
        <path d="M250 60 A127 127 0 0 1 274 103" fill="none" stroke="#f45b72" strokeOpacity=".65" strokeWidth="1.5" strokeDasharray="4 4" />
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
      <div className="absolute inset-x-0 top-[36%] -translate-y-1/2 text-center sm:top-[44%]">
        <div className="font-mono text-[30px] font-bold leading-none sm:text-[38px]"><AnimatedNumber value={data.totalTrades} /></div>
        <div className="mt-1 text-sm text-white/60 sm:mt-2 sm:text-base">Total trades</div>
        <div className="mt-1 flex justify-center">
          <PeriodDelta delta={data.totalTradesDelta} sentiment="neutral" compact />
        </div>
      </div>
      <div className="absolute inset-x-0 top-[64%] flex justify-center sm:top-[68%]">
        <button
          type="button"
          onClick={onNeedsEvidence}
          aria-expanded={needsEvidenceOpen}
          aria-controls="needs-evidence-review"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] leading-none transition ${needsEvidenceOpen ? "border-violet-300/45 bg-violet-400/15 text-violet-100" : "border-slate-300/15 bg-slate-300/[0.05] text-slate-300/75 hover:border-violet-300/35 hover:text-violet-200"}`}
        >
          Needs evidence <b className="font-mono text-slate-200"><AnimatedNumber value={data.needsEvidence} /></b>
          <PeriodDelta delta={data.needsEvidenceDelta} sentiment="neutral" compact />
        </button>
      </div>
      <div className="absolute bottom-0 left-[18%] text-left sm:left-[11%]">
        <div className="flex items-center gap-1.5">
          <PeriodDelta delta={data.cleanDelta} compact />
          <b className="font-mono text-[27px] text-[#7ee45f] sm:text-[31px]"><AnimatedNumber value={data.clean} /></b>
        </div>
        <span className="block text-sm text-white/60 sm:text-base">Clean</span>
      </div>
      <div className="absolute bottom-0 right-[18%] text-right sm:right-[11%]">
        <div className="flex items-center justify-end gap-1.5">
          <b className="font-mono text-[27px] text-rose-400 sm:text-[31px]"><AnimatedNumber value={data.notFollowed} /></b>
          <PeriodDelta
            delta={data.notFollowedDelta}
            sentiment={data.notFollowedDelta < 0 ? "positive" : "negative"}
            compact
          />
        </div>
        <span className="block text-sm text-white/60 sm:text-base">Not followed</span>
      </div>
    </div>
  );
}

function FrequencyRateSegments({ value }) {
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
      aria-label={`Clean-day rate ${value}%`}
    >
      <b className={`w-7 shrink-0 font-mono text-xs ${tone.text}`}>
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

function Frequency({ period }) {
  const [activeFrequency, setActiveFrequency] = useState("one");
  const [frequencyMode, setFrequencyMode] = useState("Per day");
  const [session, setSession] = useState("All sessions");
  const periodAnalytics = useMemo(() => buildMockPeriodAnalytics(period), [period]);
  const frequencyData = periodAnalytics.frequency;
  const sessionRows = periodAnalytics.sessionFrequency[session];
  const selectedFrequency = frequencyData.rows.find(
    (row) => row.key === activeFrequency,
  );
  const strongestSessionRow = sessionRows
    .filter((row) => row.occurrences >= 10)
    .sort((a, b) => b.winRate - a.winRate)[0];

  return (
    <Panel className="h-full min-h-[382px] min-w-0 p-4">
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
      <div className="analytics-scrollbar-hidden mt-4 overflow-x-auto">
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
                <b className="font-mono text-base text-white/90">
                  {Math.round(row.averageDays)} days
                </b>
                <span className="mt-1 block text-[10px] text-white/40">
                  {row.share}% of trading days
                </span>
              </div>
              <div
                role="img"
                aria-label={`${row.green}% green days, ${row.red}% red days, ${row.breakEven}% break-even days`}
              >
                <div className="analytics-segments flex h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <span
                    className="bg-emerald-400"
                    style={{ width: `${row.green}%` }}
                  />
                  <span
                    className="bg-rose-400"
                    style={{ width: `${row.red}%` }}
                  />
                  {row.breakEven > 0 && (
                    <span
                      className="bg-slate-400"
                      style={{ width: `${row.breakEven}%` }}
                    />
                  )}
                </div>
                <div className="mt-1.5 flex gap-3 font-mono text-[10px]" aria-hidden="true">
                  <span className="text-emerald-400">{row.green}% Green</span>
                  <span className="text-rose-400">{row.red}% Red</span>
                  <span className="text-white/45">{row.breakEven}% BE</span>
                </div>
              </div>
              <div className="font-mono">
                <b
                  className={
                    row.averagePnl >= 0 ? "text-emerald-400" : "text-rose-400"
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
                  <b className="font-mono text-violet-200">{row.setupRate}%</b>
                </div>
              </div>
              <div className="border-l border-white/10 pl-4">
                <b className="font-mono text-rose-400">{row.breachDayRate}%</b>
                <span className="mt-1 block text-[9px] leading-3 text-white/35">
                  of logged days
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white/90">What counts as a clean day?</h3>
          <p className="mt-1 text-xs leading-5 text-white/50">
            A clean day means you followed every logged rule and executed with proper discipline. Example: on {selectedFrequency.exampleLabel}, the trade matched your setup, stayed within the planned risk, and no rule was broken. That day counts as clean. In these logs, {selectedFrequency.cleanDayRate}% of {selectedFrequency.sampleDays} completed {selectedFrequency.dayDescription} were clean.
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-[10px] text-violet-200">
          Selected · {selectedFrequency.sampleDays} days
        </span>
      </div>

      <p className="mt-3 text-[10px] leading-4 text-white/35">
        A day is Green, Red, or BE from its final net P&amp;L. These historical rates describe completed logs and do not predict future outcomes.
      </p>
      </>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-white/10 py-3">
            <span className="mr-1 text-[11px] text-white/45">Session</span>
            {["All sessions", "Asian", "London", "New York"].map((item) => (
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
          <div className="analytics-table-scrollbar mt-3 overflow-x-auto">
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
                      <td className="border-b border-white/10 px-3 py-3 font-mono text-white/85">{row.winRate}%</td>
                      <td className={`border-b border-white/10 px-3 py-3 font-mono ${row.averagePnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(row.averagePnl)}</td>
                      <td className="border-b border-white/10 px-3 py-3"><FrequencyRateSegments value={row.cleanRate} /></td>
                      <td className="border-b border-white/10 px-3 py-3 font-mono text-white/75">{row.occurrences}</td>
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
            A session is counted only when it contains at least one completed trade. Results describe historical logs and are not trading recommendations.
          </p>
        </>
      )}
    </Panel>
  );
}
function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : "-"}$${Math.abs(value).toLocaleString()}`;
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
    <span className="inline-flex items-center gap-1.5 font-mono text-xs whitespace-nowrap" aria-label={`${setup.wins} wins, ${setup.losses} losses, ${setup.breakEven} break-even`}>
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
      <div className="mt-1 flex gap-2 font-mono text-[10px] whitespace-nowrap">
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

function SetupTable({ onViewAll, period }) {
  const periodSetups = useMemo(() => getSetupsForPeriod(period), [period]);
  const visibleSetups = [...periodSetups].sort(sortByEvidence).slice(0, 4);
  const [selectedSetupName, setSelectedSetupName] = useState(visibleSetups[0].name);
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
          <div className="grid grid-cols-[1.2fr_.35fr_.72fr_.92fr_.62fr_.7fr_.72fr] items-center gap-3 border-b border-white/20 pb-2 text-[11px] text-white/60">
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
              aria-pressed={selectedSetup.name === setup.name}
              onClick={() => setSelectedSetupName(setup.name)}
              className={`analytics-row grid w-full grid-cols-[1.2fr_.35fr_.72fr_.92fr_.62fr_.7fr_.72fr] items-center gap-3 border-b border-white/15 py-3 text-left text-sm ${selectedSetup.name === setup.name ? "bg-violet-400/[0.07] shadow-[inset_3px_0_0_#7c68ff]" : ""}`}
            >
              <b className="pl-3 font-medium text-violet-300">{setup.name}</b>
              <span>{setup.trades}</span>
              <OutcomeRecord setup={setup} />
              <OutcomeMix setup={setup} compact />
              <span className="font-mono text-white/85" aria-label={`${setup.historicalWinRate} percent historical win rate`}>
                {setup.historicalWinRate}%
              </span>
              <QualityBadge setup={setup} />
              <span
                className={`font-mono ${setup.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}
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
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white/90">
            {selectedSetup.name}: what the percentages mean
          </h3>
          <p className="mt-1 text-xs leading-5 text-white/50">
            Historical win rate: {selectedSetup.wins} wins from {selectedSetup.trades} completed trades = {selectedSetup.historicalWinRate}%. Execution quality: {selectedSetup.executionScore}% ({selectedSetup.executionGrade}), calculated from 60% setup adherence and 40% clean-trade rate. Win rate describes past outcomes; execution quality describes how consistently the rules were followed. Neither predicts future results.
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-[10px] text-violet-200">
          Selected · {selectedSetup.trades} trades
        </span>
      </div>
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
                    <span className="font-mono text-2xl leading-none">{item.count}</span>
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
function MiniDayChart({ onExplore, data }) {
  const baseline = data.kpis[0].value;
  const chartValues = [baseline - 2, baseline - 5, baseline - 8, baseline - 3, baseline - 6];
  const chartPoints = chartValues.map((value, index) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri"][index],
    x: 85 + index * 100,
    y: 14 + ((100 - value) / 100) * 80,
    value,
  }));
  const chartPath = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
  return (
    <Panel className="relative h-[174px] min-w-0 overflow-hidden p-4">
      <div className="relative h-full w-full min-[980px]:grid min-[980px]:grid-cols-[minmax(0,520px)_auto] min-[980px]:gap-3">
        <div className="relative h-full w-full max-w-[520px] min-[980px]:max-w-none">
          <h2 className="absolute left-[7.31%] top-0 z-10 flex items-center gap-2 text-[18px] font-semibold">Compliance by day <span className="grid h-5 w-5 place-items-center rounded-full border border-white/60 text-[11px] text-white/70">i</span></h2>
          <svg viewBox="0 0 520 110" className="absolute inset-x-0 top-8 aspect-[520/110] w-full" aria-label="Compliance by day line chart with percentage scale and visible axes">
            {[["100%",14],["75%",34],["50%",54],["25%",74],["0%",94]].map(([label,y])=><g key={label}><text x="2" y={y+4} fill="white" fillOpacity=".55" fontSize="10">{label}</text><line x1="38" y1={y} x2="510" y2={y} stroke="white" strokeOpacity=".12" strokeDasharray="3 3" /></g>)}
            <line x1="38" y1="14" x2="38" y2="94" stroke="white" strokeOpacity=".28" strokeWidth="1" />
            <line x1="38" y1="94" x2="510" y2="94" stroke="white" strokeOpacity=".28" strokeWidth="1" />
            <path className="analytics-line-draw analytics-line-delay" pathLength="1" d={chartPath} fill="none" stroke="#7187ff" strokeWidth="2" />
            {chartPoints.map(({day,x,y,value},index)=><g className="analytics-chart-point" style={{animationDelay:`${420 + index * 85}ms`}} key={day}><circle cx={x} cy={y} r="4" fill="#7187ff"/><text x={x} y={y-9} fill="white" fontSize="12" textAnchor="middle">{value}%</text><text x={x} y="108" fill="white" fillOpacity=".65" fontSize="12" textAnchor="middle">{day}</text></g>)}
          </svg>
        </div>
        <button
          onClick={onExplore}
          className="absolute right-0 top-0 z-20 rounded-lg border border-violet-400 px-3 py-2 text-xs text-[#8191ff] hover:bg-violet-500/10 sm:px-4 sm:py-2.5 sm:text-sm min-[980px]:static min-[980px]:self-center min-[980px]:justify-self-end"
        >
          <span className="min-[1500px]:hidden">EDGE</span>
          <span className="hidden min-[1500px]:inline">Explore in EDGE</span>
        </button>
      </div>
    </Panel>
  );
}

function BreachConcentration({ data }) {
  const repeatedBreaches = Math.max(1, Math.round(data.notFollowed * 0.35));
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
function NeedsEvidenceReview({ trades, onClose }) {
  const visibleTrades = trades.slice(0, 8);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [reviewAnswers, setReviewAnswers] = useState({});
  const selectedTrade = trades.find((trade) => trade.id === selectedTradeId);
  const selectedAnswers = reviewAnswers[selectedTradeId] || {};
  const reviewQuestions = [
    { key: "entry", label: "Planned entry and setup followed" },
    { key: "risk", label: "Risk stayed within the planned limit" },
    { key: "exit", label: "Exit followed the logged trade plan" },
  ];
  const reviewComplete = reviewQuestions.every((question) => selectedAnswers[question.key]);
  const previewClassification = !reviewComplete
    ? "Needs evidence"
    : reviewQuestions.some((question) => selectedAnswers[question.key] === "no")
      ? "Not followed"
      : "Clean";
  const previewTone = {
    Clean: "border-emerald-300/30 bg-emerald-400/[0.08] text-emerald-200",
    "Not followed": "border-rose-300/30 bg-rose-400/[0.08] text-rose-200",
    "Needs evidence": "border-amber-300/25 bg-amber-300/[0.07] text-amber-200",
  }[previewClassification];
  const setupEvidence = selectedTrade?.setup_follow_map?.[selectedTrade.setup];
  const setupEvidenceLabel = {
    yes: "Setup marked as followed",
    partial: "Setup marked as partially followed",
    no: "Setup marked as not followed",
  }[setupEvidence] || "Setup review not recorded";
  return (
    <Panel id="needs-evidence-review" className="overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-300/20 bg-slate-300/[0.06] text-sm text-slate-300">?</span>
            <h2 className="text-[18px] font-semibold">Trades needing evidence</h2>
          </div>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/50">
            These completed trades do not yet have enough rule-review evidence to classify them as Clean or Not followed. Add or finish the review before using them in discipline-rate calculations.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-slate-300/15 bg-slate-300/[0.05] px-3 py-2 font-mono text-[10px] text-slate-300">
            {trades.length} incomplete {trades.length === 1 ? "review" : "reviews"}
          </span>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-3 py-2 text-[10px] text-white/60 transition hover:bg-white/5 hover:text-white">
            Close
          </button>
        </div>
      </div>

      {visibleTrades.length ? (
        <div className="analytics-table-scrollbar mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="text-[10px] text-white/40">
              <tr>{["Trade date", "Session", "Setup", "Planned risk", "Historical P&L", "Evidence review"].map((heading) => <th key={heading} className="border-b border-white/15 px-3 py-2.5 font-normal">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visibleTrades.map((trade) => (
                <tr key={trade.id} className="analytics-row">
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/70">{trade.trade_date}</td>
                  <td className="border-b border-white/10 px-3 py-3 text-white/70">{trade.session}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-medium text-violet-300">{trade.setup}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/70">{trade.riskR.toFixed(2)}R</td>
                  <td className={`border-b border-white/10 px-3 py-3 font-mono ${trade.pnl > 0 ? "text-emerald-400" : trade.pnl < 0 ? "text-rose-400" : "text-white/50"}`}>{formatCurrency(trade.pnl)}</td>
                  <td className="border-b border-white/10 px-3 py-3">
                    <button
                      type="button"
                      aria-expanded={selectedTradeId === trade.id}
                      aria-controls="trade-evidence-detail"
                      onClick={() => setSelectedTradeId((current) => current === trade.id ? null : trade.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] transition ${selectedTradeId === trade.id ? "border-violet-300/45 bg-violet-400/15 text-violet-100" : "border-amber-300/25 bg-amber-300/[0.07] text-amber-200 hover:border-violet-300/35 hover:text-violet-200"}`}
                    >
                      {selectedTradeId === trade.id ? "Hide review" : "Review evidence"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-5 text-sm text-emerald-200">
          Every completed trade in this period has enough evidence to classify.
        </div>
      )}
      {selectedTrade && (
        <div id="trade-evidence-detail" className="mt-4 rounded-xl border border-violet-300/20 bg-violet-400/[0.045] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[.12em] text-violet-300/75">Evidence review</p>
              <h3 className="mt-1 text-base font-semibold">{selectedTrade.setup} · {selectedTrade.trade_date}</h3>
              <p className="mt-1 text-xs text-white/45">{selectedTrade.session} session · {selectedTrade.riskR.toFixed(2)}R planned risk · historical P&amp;L {formatCurrency(selectedTrade.pnl)}</p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-2 text-[10px] ${previewTone}`}>Preview · {previewClassification}</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <span className="text-[10px] text-white/40">Setup evidence</span>
              <p className={`mt-1 text-xs font-medium ${setupEvidence === "yes" ? "text-emerald-300" : setupEvidence ? "text-amber-200" : "text-white/60"}`}>{setupEvidenceLabel}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <span className="text-[10px] text-white/40">Rule checklist</span>
              <p className="mt-1 text-xs font-medium text-amber-200">Not completed</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/10 p-3">
              <span className="text-[10px] text-white/40">Discipline classification</span>
              <p className={`mt-1 text-xs font-medium ${previewClassification === "Clean" ? "text-emerald-300" : previewClassification === "Not followed" ? "text-rose-300" : "text-amber-200"}`}>{previewClassification}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-black/10 p-3">
            <div className="flex flex-col gap-2.5">
              {reviewQuestions.map((question) => (
                <div key={question.key} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] text-white/65">{question.label}</span>
                  <div className="inline-flex w-fit rounded-lg border border-white/10 bg-[#0b111b] p-0.5" role="group" aria-label={question.label}>
                    {["yes", "no"].map((answer) => (
                      <button
                        key={answer}
                        type="button"
                        aria-pressed={selectedAnswers[question.key] === answer}
                        onClick={() => setReviewAnswers((current) => ({
                          ...current,
                          [selectedTradeId]: { ...(current[selectedTradeId] || {}), [question.key]: answer },
                        }))}
                        className={`rounded-md px-3 py-1.5 text-[10px] font-medium transition ${selectedAnswers[question.key] === answer ? answer === "yes" ? "bg-emerald-400/15 text-emerald-200" : "bg-rose-400/15 text-rose-200" : "text-white/40 hover:text-white/70"}`}
                      >
                        {answer === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={`mt-3 rounded-lg border px-3 py-2.5 text-[11px] leading-5 ${previewTone}`}>
            {previewClassification === "Needs evidence" && <><b>Preview incomplete:</b> answer all three checks before the trade can be classified.</>}
            {previewClassification === "Clean" && <><b>Preview classification: Clean.</b> All reviewed rules were followed.</>}
            {previewClassification === "Not followed" && <><b>Preview classification: Not followed.</b> At least one reviewed rule was not followed.</>}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-white/30">Mockup preview only · Overview totals remain unchanged and no journal data is saved.</p>
            {Object.keys(selectedAnswers).length > 0 && <button type="button" onClick={() => setReviewAnswers((current) => ({ ...current, [selectedTradeId]: {} }))} className="shrink-0 text-[10px] text-white/45 underline decoration-white/20 underline-offset-2 hover:text-white/75">Reset answers</button>}
          </div>
        </div>
      )}
      {trades.length > visibleTrades.length && <p className="mt-3 text-[10px] text-white/35">Showing the first {visibleTrades.length} of {trades.length} incomplete reviews.</p>}
    </Panel>
  );
}

function Overview({ setTab, onViewSetups, data, period, analytics }) {
  const [needsEvidenceOpen, setNeedsEvidenceOpen] = useState(false);
  const needsEvidenceTrades = analytics.trades.filter((trade) => trade.evidenceStatus === "unknown");
  return (
    <div className="space-y-3">
      <div className="grid gap-3 min-[1120px]:grid-cols-[1.08fr_.95fr]">
        <Panel className="grid min-h-[300px] grid-cols-1 items-start gap-6 px-5 py-5 sm:grid-cols-2">
          <div className="flex h-full w-full flex-col items-center border-b border-white/15 pb-6 text-center sm:justify-self-center sm:border-b-0 sm:border-r sm:pb-0">
            <Ring value={data.discipline} delta={data.disciplineDelta} />
            <p className="mt-4 text-sm text-white/65">
              Based on rule adherence — not P&amp;L.
            </p>
          </div>
          <ComplianceDome
            data={data}
            needsEvidenceOpen={needsEvidenceOpen}
            onNeedsEvidence={() => setNeedsEvidenceOpen((current) => !current)}
          />
          <p className="col-span-full -mt-3 text-center text-[10px] leading-4 text-white/40 sm:text-left">
            Needs evidence means the rule review is incomplete. It is not counted as Clean or Not followed.
          </p>
        </Panel>
        <div className="space-y-3">
          <Panel className="grid min-h-[190px] grid-cols-2 gap-0 px-3 py-5 sm:grid-cols-4">
            {data.kpis.map(({ label, value, type, delta }) => (
              <div key={label} className="analytics-kpi flex flex-col items-center border-l border-white/20 px-3 first:border-0">
                <KpiIcon type={type}/>
                <div className="mt-2 text-center text-sm text-white/75">{label}</div>
                <div className="mt-1 font-mono text-[30px] font-semibold leading-none"><AnimatedNumber value={value} suffix="%" /></div>
                <PeriodDelta delta={delta} percent />
                <Sparkline/>
              </div>
            ))}
          </Panel>
          <Panel className="min-h-[117px] px-6 py-3">
            <p className="mb-2 border-b border-white/15 pb-2 text-center text-sm text-white/70">
              Historical outcomes · not used in Discipline score
            </p>
            <div className="grid grid-cols-3 gap-5">
              <HistoricalMetric icon="pnl" label="Net P&L" value={data.outcomes.pnl} tone="text-emerald-400" />
              <HistoricalMetric icon="wins" label="Win rate" value={data.outcomes.winRate} />
              <HistoricalMetric icon="drawdown" label="Max drawdown" value={data.outcomes.drawdown} tone="text-rose-400" />
            </div>
          </Panel>
        </div>
      </div>
      {needsEvidenceOpen && <NeedsEvidenceReview trades={needsEvidenceTrades} onClose={() => setNeedsEvidenceOpen(false)} />}
      <div className="grid items-stretch gap-3 min-[2000px]:grid-cols-[.94fr_1.02fr]">
        <div className="min-w-0"><Frequency period={period} /></div>
        <div className="min-w-0"><SetupTable onViewAll={onViewSetups} period={period} /></div>
      </div>
      <div className="grid items-stretch gap-3 min-[980px]:grid-cols-3">
        <MiniDayChart onExplore={() => setTab("EDGE")} data={data} />
        <BreachConcentration data={data} />
        <Panel className="flex h-[174px] items-center gap-4 px-5 py-5 text-xs leading-5 text-white/55"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#8092bd] text-lg text-[#8092bd]">i</span><span>Historical outcomes describe past logs.<br/>They do not affect your Discipline score and are not trading recommendations.</span></Panel>
      </div>
    </div>
  );
}

function formatDayBarValue(value, metric) {
  if (metric === "Historical P&L") {
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}$${Math.abs(value).toLocaleString()}`;
  }
  return metric === "Compliance" || metric === "Breaches" ? `${value}%` : value;
}

function DayBars({ metric, active, setActive, period, daysData }) {
  const profile = periodProfiles[period] || periodProfiles.all;
  const showComparison = period !== "all";
  const pnlAll = [410, 760, 690, 470, -340];
  const pnlPeriod = pnlAll.map((value) => Math.round(value * profile.setupFactor));
  const values = daysData.map((d, i) => ({
    ...d,
    month:
      metric === "Compliance"
        ? d.month
        : metric === "Breaches"
          ? 100 - d.month
          : pnlPeriod[i],
    all:
      metric === "Compliance"
        ? d.all
        : metric === "Breaches"
          ? 100 - d.all
          : pnlAll[i],
  }));
  const max =
    metric === "Historical P&L" ? 1400 : 100;
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
                ? d.month >= 0
                  ? "bg-emerald-400"
                  : "bg-rose-400"
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
                      ? d.all >= 0
                        ? "bg-emerald-400/45"
                        : "bg-rose-400/45"
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
                  className={`mb-1 whitespace-nowrap font-mono text-[9px] font-semibold sm:text-[10px] ${metric === "Historical P&L" ? (item.value >= 0 ? "text-emerald-300" : "text-rose-300") : item.key === "period" ? "text-violet-300" : "text-cyan-300"}`}
                >
                  <span className="block text-[8px] font-normal text-white/35 sm:text-[9px]">
                    {item.label}
                  </span>
                  {formatDayBarValue(item.value, metric)}
                </span>
                <span
                  className={`analytics-bar-rise w-full rounded-t ${item.barTone}`}
                  style={{
                    height: `${Math.max(4, (Math.abs(item.value) / max) * 68)}%`,
                    animationDelay: `${index * 70 + seriesIndex * 80}ms`,
                  }}
                />
              </span>
            ))}
            <span className="absolute bottom-[-48px] inset-x-0 text-center">
              <b
                className={active === d.day ? "text-violet-300" : "text-white/70"}
              >
                {d.day}
              </b>
              <span className="mt-1 block text-[10px] text-white/35">
                {d.trades} trades
              </span>
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
    { group: "Daily outcomes", label: "Avg day P&L", value: (day) => formatCurrency(details[day.day].averageDayPnl), tone: (day) => details[day.day].averageDayPnl >= 0 },
    { label: "Median day P&L", value: (day) => formatCurrency(details[day.day].medianDayPnl), tone: (day) => details[day.day].medianDayPnl >= 0 },
    { label: "Green-day rate", value: (day) => `${details[day.day].greenDayRate}%` },
    { label: "Historical trade win rate", value: (day) => `${details[day.day].tradeWinRate}%` },
    { label: "Avg win / Avg loss", value: (day) => `${formatCurrency(details[day.day].averageWin)} / ${formatCurrency(details[day.day].averageLoss)}` },
    { label: "Total P&L", value: (day) => formatCurrency(details[day.day].totalPnl), tone: (day) => details[day.day].totalPnl >= 0 },
    { group: "Discipline", label: "Clean trades", value: (day) => `${day.clean} / ${day.trades}` },
    { label: "Rule adherence", value: (day) => `${day.month}%` },
    { label: "Setup adherence", value: (day) => `${details[day.day].setupAdherence}%` },
    { label: "Rule breaches", value: (day) => day.breached },
    { group: "Trade frequency", label: "Avg trades / day", value: (day) => details[day.day].averageTradesPerDay.toFixed(1) },
    { label: "1-trade days", value: (day) => `${details[day.day].distribution[0]}%` },
    { label: "2-trade days", value: (day) => `${details[day.day].distribution[1]}%` },
    { label: "3+ trade days", value: (day) => `${details[day.day].distribution[2]}%` },
    { group: "Setup & session context", label: "Most logged setup", value: (day) => `${day.setup} · ${details[day.day].setupShare}%` },
    { label: "Highest observed session WR", value: (day) => {
      const ranked = [...details[day.day].sessions].filter((session) => session.trades >= 10).sort((a, b) => b.winRate - a.winRate)[0];
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

function DayEdge({ period }) {
  const [metric, setMetric] = useState("Compliance");
  const [active, setActive] = useState("Mon");
  const [view, setView] = useState("Weekday detail");
  const periodAnalytics = useMemo(() => buildMockPeriodAnalytics(period), [period]);
  const daysData = periodAnalytics.days;
  const details = periodAnalytics.weekdayDetails;
  const selected = daysData.find((day) => day.day === active);
  const detail = details[active];
  const fullDay = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" }[active];
  const rankedSessions = [...detail.sessions].filter((session) => session.trades >= 10).sort((a, b) => b.winRate - a.winRate);
  const strongestSession = rankedSessions[0];

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Day-of-week behaviour</h1>
          <p className="mt-2 text-sm text-white/50">See when your execution is most consistent — without turning past outcomes into trading advice.</p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">{periodProfiles[period].label}</span>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PillTabs value={view} onChange={setView} items={["Weekday detail", "All days comparison"]} textSize="text-[13px] sm:text-sm" />
        {view === "Weekday detail" && <PillTabs value={metric} onChange={setMetric} items={["Compliance", "Breaches", "Historical P&L"]} />}
      </div>

      {view === "All days comparison" ? (
        <WeekdayComparisonTable daysData={daysData} details={details} />
      ) : (
        <>
          <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_.75fr]">
            <Panel className="overflow-hidden p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-white/45">{metric === "Compliance" ? "Clean-trade rate (%)" : metric === "Breaches" ? "Breach rate (%) · lower is better" : metric}</span>
                <div className="flex gap-4 text-[10px] text-white/50">
                  <span><i className={`mr-2 inline-block h-2 w-2 ${metric === "Historical P&L" ? "bg-white/80" : "bg-violet-500"}`} />{periodProfiles[period].label}</span>
                  {period !== "all" && <span><i className={`mr-2 inline-block h-2 w-2 ${metric === "Historical P&L" ? "bg-white/35" : "bg-cyan-500"}`} />All time</span>}
                </div>
              </div>
              <DayBars metric={metric} active={active} setActive={setActive} period={period} daysData={daysData} />
              <div className="h-12" />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-white/45">
                <span>{period === "all" ? "Each bar shows the All-time value." : `Left bar: ${periodProfiles[period].chartLabel} · Right bar: All time.`}</span>
                <span>{metric === "Historical P&L" ? "Green = profit · Red = loss · faded = All time." : metric === "Breaches" ? "Lower breach rate means fewer rule violations." : "Select a weekday to see its details."}</span>
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-2xl font-semibold">{fullDay} snapshot</h2>
              <p className="mt-1 text-xs text-white/45">{selected.trades} completed trades · {detail.tradingDays} trading days</p>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-white/10 py-4">
                <Metric label="Avg day P&L" value={formatCurrency(detail.averageDayPnl)} tone={detail.averageDayPnl >= 0 ? "text-emerald-400" : "text-rose-400"} />
                <Metric label="Median day P&L" value={formatCurrency(detail.medianDayPnl)} tone={detail.medianDayPnl >= 0 ? "text-emerald-400" : "text-rose-400"} />
                <Metric label="Green-day rate" value={`${detail.greenDayRate}%`} />
                <Metric label="Trade win rate" value={`${detail.tradeWinRate}%`} />
                <Metric label="Rule adherence" value={`${selected.month}%`} />
                <Metric label="Setup adherence" value={`${detail.setupAdherence}%`} />
              </div>
              <p className="mt-4 text-xs text-white/45">Trades per day distribution</p>
              {[["1 trade", detail.distribution[0]], ["2 trades", detail.distribution[1]], ["3+ trades", detail.distribution[2]]].map(([label, value]) => (
                <div key={label} className="mt-3 grid grid-cols-[70px_1fr_35px] items-center gap-3 text-xs">
                  <span className="text-white/55">{label}</span><span className="h-1.5 overflow-hidden rounded bg-white/10"><i className="block h-full bg-violet-500" style={{ width: `${value}%` }} /></span><span>{value}%</span>
                </div>
              ))}
              <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/55">Most logged setup: <b className="text-violet-300">{selected.setup}</b> · {detail.setupTrades} trades ({detail.setupShare}%)</p>
            </Panel>
          </div>

          <Panel className="mt-3 overflow-hidden p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-semibold">{fullDay} by session</h2><p className="mt-1 text-[11px] text-white/40">Each session has its own denominator. Session win rates are not parts of a stacked total.</p></div>
              {strongestSession ? <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-2 text-[10px] text-cyan-200">Highest observed win rate · {strongestSession.name} {strongestSession.winRate}%</span> : <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-[10px] text-amber-200">Not enough data to rank reliably</span>}
            </div>
            <div className="analytics-table-scrollbar mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="text-[10px] text-white/40"><tr>{["Session", "Completed trades", "Share of weekday", "Historical win rate", "Avg session P&L", "Evidence"].map((heading) => <th key={heading} className="border-b border-white/15 px-3 py-2.5 font-normal">{heading}</th>)}</tr></thead>
                <tbody>{detail.sessions.map((session) => <tr key={session.name}>
                  <td className="border-b border-white/10 px-3 py-3 font-medium text-white/85">{session.name}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/75">{session.trades || "—"}</td>
                  <td className="border-b border-white/10 px-3 py-3 font-mono text-white/75">{session.trades ? `${session.share}%` : "—"}</td>
                  <td className="border-b border-white/10 px-3 py-3"><div className="flex items-center gap-3"><b className="w-9 font-mono text-white/85">{session.winRate === null ? "—" : `${session.winRate}%`}</b>{session.winRate !== null && <span className="h-1.5 w-28 overflow-hidden rounded bg-white/10"><i className="block h-full bg-cyan-400" style={{ width: `${session.winRate}%` }} /></span>}</div></td>
                  <td className={`border-b border-white/10 px-3 py-3 font-mono ${session.averagePnl === null ? "text-white/35" : session.averagePnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatCurrency(session.averagePnl)}</td>
                  <td className="border-b border-white/10 px-3 py-3">{session.trades ? <EvidenceBadge trades={session.trades} /> : <span className="text-white/30">No logged trades</span>}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-white/35">Average session P&amp;L = session P&amp;L across selected weekdays ÷ selected weekdays where that session had at least one completed trade. Ranking requires 10 completed trades.</p>
          </Panel>

          <Panel className="mt-3 p-5">
            <h2 className="font-semibold">Historical outcome context</h2>
            <p className="mt-1 text-[11px] text-white/40">Describes past logs only. It does not affect your Discipline score and is not a recommendation to trade or avoid {fullDay}.</p>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
              <Metric label="Clean / not followed / needs evidence" value={`${selected.clean} / ${selected.breached} / ${selected.unknown}`} />
              <Metric label="Trade win rate" value={`${detail.tradeWinRate}%`} />
              <Metric label="Total P&L" value={formatCurrency(detail.totalPnl)} tone={detail.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"} />
              <Metric label="Avg win" value={formatCurrency(detail.averageWin)} tone="text-emerald-400" />
              <Metric label="Avg loss" value={formatCurrency(detail.averageLoss)} tone="text-rose-400" />
              <Metric label="Avg trades / day" value={detail.averageTradesPerDay.toFixed(1)} />
            </div>
          </Panel>

          <div className="mt-3 grid gap-3 xl:grid-cols-[1.45fr_.55fr]">
            <Panel className="overflow-hidden p-5"><h2 className="font-semibold">{fullDay} trade log</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="text-[10px] text-white/40"><tr>{["Date", "Trade #", "Setup", "Rule status", "Risk", "Outcome context", "Review"].map((heading) => <th key={heading} className="border-b border-white/10 py-2 font-normal">{heading}</th>)}</tr></thead><tbody>{logRows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, columnIndex) => <td key={columnIndex} className={`border-b border-white/[0.07] py-2.5 ${columnIndex === 3 ? (cell === "Clean" ? "text-emerald-400" : "text-rose-400") : columnIndex === 5 ? (cell.startsWith("+") ? "text-emerald-400" : "text-rose-400") : "text-white/65"}`}>{cell}</td>)}<td className="border-b border-white/[0.07] py-2.5"><button className="rounded-lg border border-white/15 px-3 py-1 text-[10px] hover:bg-white/5">View trade</button></td></tr>)}</tbody></table></div></Panel>
            <Panel className="flex flex-col justify-center p-6"><h2 className="text-xl font-semibold leading-tight">Review {fullDay}&apos;s rule-adherence pattern.</h2><p className="mt-3 text-sm leading-6 text-white/50">Review what was consistent across these {selected.clean} clean trades.</p><button className="mt-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-3 text-sm font-semibold hover:brightness-110">Review clean trades</button></Panel>
          </div>
        </>
      )}
      <p className="mt-4 text-center text-[11px] text-white/40">Insights describe behaviour in your journal. They do not provide trading signals or predict results.</p>
    </div>
  );
}
function SetupEdge({ period }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All grades");
  const [sortBy, setSortBy] = useState("Evidence-ranked");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const periodSetups = useMemo(() => getSetupsForPeriod(period), [period]);
  const filteredSetups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...periodSetups]
      .filter((setup) => {
        const matchesQuery = setup.name.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          status === "All grades" ||
          (status === "A / A+ quality" && setup.executionScore >= 80) ||
          (status === "B / C quality" && setup.executionScore >= 60 && setup.executionScore < 80) ||
          (status === "D quality" && setup.executionScore < 60) ||
          (status === "Provisional sample" && setup.sampleConfidence === "Provisional");
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "Highest quality") return b.executionScore - a.executionScore;
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
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
          {periodSetups.length} logged setups · {periodProfiles[period].label}
        </span>
      </div>

      <Panel className="mt-5 overflow-hidden p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto] sm:items-center">
          <label className="relative block">
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
            {["All grades", "A / A+ quality", "B / C quality", "D quality", "Provisional sample"].map(
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

        <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-white/45 xl:hidden">
          <span>Setup and Trades stay visible</span>
          <span className="whitespace-nowrap text-cyan-200/80">Swipe to see more →</span>
        </div>

        <div className="analytics-table-scrollbar mt-3 overflow-x-auto xl:mt-5">
          <table className="w-full min-w-[1540px] border-separate border-spacing-0 text-left text-sm">
            <thead className="text-[11px] text-white/45">
              <tr>
                {["Setup", "Trades", "Results", "Avg W / Avg L", "Max streaks", "Historical mix / 10", "Historical win rate", "Execution quality", "Historical P&L", "Sample"].map(
                  (heading, index) => (
                    <th
                      key={heading}
                      className={`border-b border-white/15 pb-3 pr-5 font-normal ${
                        index === 0
                          ? "sticky left-0 z-30 w-[210px] min-w-[210px] bg-[#0b111b]"
                          : index === 1
                            ? "sticky left-[210px] z-30 w-[90px] min-w-[90px] bg-[#0b111b] shadow-[12px_0_18px_-16px_rgba(0,0,0,.95)]"
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
                  <td className="sticky left-0 z-20 w-[210px] min-w-[210px] border-b border-white/10 bg-[#0b111b] py-3.5 pr-5 font-medium text-violet-300">
                    {setup.name}
                  </td>
                  <td className="sticky left-[210px] z-20 w-[90px] min-w-[90px] border-b border-white/10 bg-[#0b111b] py-3.5 pr-5 shadow-[12px_0_18px_-16px_rgba(0,0,0,.95)]">
                    {setup.trades}
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5"><OutcomeRecord setup={setup} /></td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <span className="inline-flex gap-2 font-mono text-xs whitespace-nowrap" aria-label={`Average win ${formatCurrency(setup.avgWin)}, average loss ${formatCurrency(setup.avgLoss)}`}>
                      <span className="text-emerald-400">{formatCurrency(setup.avgWin)}</span>
                      <span className="text-rose-400">{formatCurrency(setup.avgLoss)}</span>
                    </span>
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <span className="font-mono text-xs whitespace-nowrap" aria-label={`Maximum win streak ${setup.maxWinStreak}, maximum loss streak ${setup.maxLossStreak}`}>
                      <span className="text-emerald-400">W{setup.maxWinStreak}</span>
                      <span className="px-1 text-white/25">/</span>
                      <span className="text-rose-400">L{setup.maxLossStreak}</span>
                    </span>
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <OutcomeMix setup={setup} />
                  </td>
                  <td
                    className="border-b border-white/10 py-3.5 pr-5 font-mono text-white/85"
                    aria-label={`${setup.historicalWinRate} percent historical win rate`}
                  >
                    {setup.historicalWinRate}%
                  </td>
                  <td className="border-b border-white/10 py-3.5 pr-5">
                    <QualityBadge setup={setup} />
                  </td>
                  <td
                    className={`border-b border-white/10 py-3.5 pr-5 font-mono ${setup.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}
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

function Edge({ view, onChangeView, period }) {
  return (
    <div>
      <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/[0.025] p-1">
        {[['days', 'Day analysis'], ['setups', 'Setup analysis']].map(
          ([value, label]) => (
            <button
              key={value}
              onClick={() => onChangeView(value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:px-4 ${view === value ? "bg-violet-500/20 text-violet-200" : "text-white/50 hover:text-white/80"}`}
            >
              {label}
            </button>
          ),
        )}
      </div>
      {view === "setups" ? <SetupEdge period={period} /> : <DayEdge period={period} />}
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
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-white/80">Close evidence gaps</p><p className="mt-1 text-[10px] text-white/40">Finish incomplete rule reviews.</p></div><b className="font-mono text-slate-300">{analytics.summary.needsEvidence} open</b></div>
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
    [introActive, setIntroActive] = useState(false);
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
  const handlePeriodChange = (nextPeriod) => {
    setIntroActive(false);
    setPeriod(nextPeriod);
    try {
      window.sessionStorage.setItem(PERIOD_SESSION_KEY, nextPeriod);
    } catch {
      // Keep the shared period control usable when browser storage is unavailable.
    }
  };
  const periodAnalytics = useMemo(() => buildMockPeriodAnalytics(period), [period]);
  const overviewData = useMemo(
    () => buildOverviewData(period, periodAnalytics),
    [period, periodAnalytics],
  );
  if (!mounted)
    return (
      <div
        className="min-h-screen bg-[#07101a]"
        aria-label="Loading AI Analytics mockup"
      />
    );
  return (
    <IntroMotionContext.Provider value={introActive}>
    <div className={`ai-analytics-motion min-h-screen overflow-x-hidden bg-[#07101a] text-[#f4f6fb] ${introActive ? "ai-analytics-intro" : ""}`}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07101a]/95 backdrop-blur">
        <div className="flex h-[60px] items-center justify-between gap-4 px-4 sm:px-7">
          <nav
            className="flex"
            aria-label="AI Analytics sections"
          >
            <div className="flex gap-3 sm:gap-7">
              {["Overview", "EDGE", "Coach Me"].map((item) => (
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
      <main className="px-4 pb-0 pt-6 sm:px-6">
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
              </div>
              <PeriodSelect value={period} onChange={handlePeriodChange} className="self-end sm:hidden" />
            </div>
            <Overview
              data={overviewData}
              analytics={periodAnalytics}
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
              period={period}
              onChangeView={(view) => {
                setIntroActive(false);
                setEdgeView(view);
              }}
            />
          </>
        )}
        {tab === "Coach Me" && (
          <>
            <div className="mb-4 flex justify-end sm:hidden">
              <PeriodSelect value={period} onChange={handlePeriodChange} />
            </div>
            <Coach analytics={periodAnalytics} period={period} />
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
