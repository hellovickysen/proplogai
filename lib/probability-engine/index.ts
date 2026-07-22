/* ── Probability Engine — Public API ────────────────────────── */

export { analyzeStatement } from './analyzer';
export { parseTrades }      from './parser';
export { computeStatistics } from './statistics';
export { simulate }         from './simulator';
export { PROFILES, getProfileById } from './profiles';

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
} from './types';
