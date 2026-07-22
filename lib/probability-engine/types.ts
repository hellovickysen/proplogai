/* ── Probability Engine — Type Definitions ─────────────────── */

export interface Trade {
  id: string;
  date: string;                    // ISO string
  openDate: string | null;
  closeDate: string | null;
  symbol: string;
  direction: 'buy' | 'sell';
  entry: number;
  exit: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  profit: number;
  commission: number;
  swap: number;
  netProfit: number;
  duration: number;                // minutes
}

export interface Statistics {
  totalTrades: number;
  tradingDays: number;
  totalProfit: number;
  winRate: number;                 // 0–100
  lossRate: number;                // 0–100
  avgRisk: number;
  avgReward: number;
  avgRR: number;
  expectancy: number;
  profitFactor: number;
  avgDailyReturn: number;
  maxDrawdown: number;             // percentage
  largestLosingStreak: number;
  largestWinningStreak: number;
  avgTradesPerDay: number;
  avgHoldingTime: number;          // minutes
  riskConsistency: number;         // 0–100  (higher = more consistent)
  positionSizeConsistency: number; // 0–100
  dailyReturns: number[];          // raw daily P&L array for Monte Carlo sampling
}

export interface ChallengeProfile {
  id: string;
  name: string;
  description: string;
  profitTarget: number;            // %
  dailyDrawdown: number;           // %
  overallDrawdown: number;         // %
  minimumProfitableDays: number;
  challengeDays: number;
  maxRiskPerTrade?: number;        // % (Instant Funding only)
  consistencyRequirement?: number; // % (Instant Funding only)
}

export interface SimulationResult {
  profileId: string;
  profileName: string;
  passRate: number;                // 0–100
  avgDaysToPass: number | null;
  medianDaysToPass: number | null;
  difficulty: string;              // Easy, Medium, Hard, Very Hard
  failReasons: {
    dailyDrawdown: number;
    overallDrawdown: number;
    targetNotReached: number;
    minDaysNotMet: number;
  };
}

export interface Improvement {
  title: string;
  current: string;
  recommended: string;
  estimatedImpact: string;
}

export interface ProbabilityBreakdown {
  factor: string;
  impact: number;                  // positive = helping, negative = hurting
  status: 'positive' | 'negative';
}

export interface TradingPersonality {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  unlocked: boolean;
}

export interface IndustryComparison {
  metric: string;
  yours: string;
  average: string;
  percentile: number;              // 0–100 (top X%)
  verdict: 'above' | 'below' | 'average';
}

export interface BiggestMistake {
  title: string;
  description: string;
  impact: string;
}

export interface TraderLevel {
  level: string;                   // Beginner, Intermediate, Advanced, Professional, Elite
  score: number;                   // 0–100
}

export interface AnalysisReport {
  overallProbability: number;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceReasons: string[];
  percentile: number;              // "better than X% of traders"
  traderLevel: TraderLevel;
  bestChallenge: {
    profileId: string;
    name: string;
    reason: string;
    rating: number;
  };
  expectedDays: { label: string; days: number }[];
  challengeSuitability: SimulationResult[];
  probabilityBreakdown: ProbabilityBreakdown[];
  personality: TradingPersonality;
  badges: Badge[];
  biggestMistake: BiggestMistake;
  strengths: string[];
  weaknesses: string[];
  improvements: Improvement[];
  failureReasons: { reason: string; percentage: number }[];
  verdict: string;
  statistics: Statistics;
}

export interface ParseResult {
  broker: string;
  trades: Trade[];
  tradeCount: number;
}

/* ── Simulator input (used by Web Worker too) ──────────────── */

export interface SimulatorInput {
  winRate: number;
  avgWin: number;
  avgLoss: number;
  tradesPerDay: number;
  dailyReturns: number[];
  profitTarget: number;
  dailyDrawdown: number;
  overallDrawdown: number;
  minimumProfitableDays: number;
  challengeDays: number;
  accountSize: number;
  simulations: number;
}

export interface SimulatorOutput {
  passRate: number;
  passes: number;
  failures: number;
  avgDaysToPass: number | null;
  medianDaysToPass: number | null;
  failReasons: {
    dailyDrawdown: number;
    overallDrawdown: number;
    targetNotReached: number;
    minDaysNotMet: number;
  };
}
