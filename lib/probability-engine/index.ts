/* ── Probability Engine — Public API ────────────────────────── */

export { analyzeStatement } from './analyzer';
export { parseTrades }      from './parser';
export { computeStatistics } from './statistics';
export { simulate }         from './simulator';
export { PROFILES, getProfileById } from './profiles';
export { loadFirms }        from './firmLoader';

export type {
  Trade,
  Statistics,
  ChallengeProfile,
  SimulationResult,
  Improvement,
  AnalysisReport,
  ParseResult,
  SimulatorInput,
  SimulatorOutput,
  ProbabilityBreakdown,
  TradingPersonality,
  BiggestMistake,
  TraderLevel,
  RiskMeter,
  WeekProjection,
} from './types';

export type { FirmWithMeta } from './firmLoader';
