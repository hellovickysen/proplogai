/**
 * Prop Firm Rule Engine
 * JSON-based config — never hardcoded. Add unlimited firms.
 */

export const PROP_FIRMS = {
  FTMO: {
    name: 'FTMO',
    profitTarget: 10,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 4,
    challengeDays: 30,
    phase: 'Challenge',
  },
  'FTMO-Verification': {
    name: 'FTMO Verification',
    profitTarget: 5,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 4,
    challengeDays: 60,
    phase: 'Verification',
  },
  MyFundedFX: {
    name: 'MyFundedFX',
    profitTarget: 8,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 5,
    challengeDays: 30,
    phase: 'Challenge',
  },
  'The Funded Trader': {
    name: 'The Funded Trader',
    profitTarget: 10,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 3,
    challengeDays: 35,
    phase: 'Challenge',
  },
  E8: {
    name: 'E8 Funding',
    profitTarget: 8,
    dailyDrawdown: 5,
    overallDrawdown: 8,
    minimumTradingDays: 0,
    challengeDays: 30,
    phase: 'Challenge',
  },
  'True Forex Funds': {
    name: 'True Forex Funds',
    profitTarget: 8,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 5,
    challengeDays: 30,
    phase: 'Challenge',
  },
  'Alpha Capital': {
    name: 'Alpha Capital',
    profitTarget: 8,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 3,
    challengeDays: 30,
    phase: 'Challenge',
  },
  Custom: {
    name: 'Custom',
    profitTarget: 10,
    dailyDrawdown: 5,
    overallDrawdown: 10,
    minimumTradingDays: 4,
    challengeDays: 30,
    phase: 'Challenge',
  },
};

export function getFirmRules(firmKey) {
  return PROP_FIRMS[firmKey] || PROP_FIRMS.FTMO;
}

export function getFirmList() {
  return Object.entries(PROP_FIRMS).map(([key, firm]) => ({
    key,
    name: firm.name,
    phase: firm.phase,
  }));
}
