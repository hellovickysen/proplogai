/**
 * Probability Scoring Engine
 * Converts raw probability into grade, confidence, and risk level.
 */

/**
 * @param {number} probability - Pass probability (0-100)
 * @param {Object} metrics - Computed metrics object
 * @param {Object} simResult - Monte Carlo simulation result
 * @returns {Object} Score object
 */
export function computeScore(probability, metrics, simResult) {
  const grade = getGrade(probability);
  const confidence = getConfidence(probability, metrics, simResult);
  const riskLevel = getRiskLevel(probability, metrics);

  return {
    probability: Math.round(probability * 10) / 10,
    grade,
    confidence,
    riskLevel,
    summary: getSummary(probability, grade, riskLevel),
  };
}

function getGrade(prob) {
  if (prob >= 90) return 'A+';
  if (prob >= 80) return 'A';
  if (prob >= 65) return 'B';
  if (prob >= 50) return 'C';
  if (prob >= 35) return 'D';
  return 'F';
}

function getConfidence(prob, metrics, simResult) {
  // Confidence depends on sample size and consistency of results
  let score = 0;

  // More trades = higher confidence
  if (metrics.totalTrades >= 200) score += 3;
  else if (metrics.totalTrades >= 100) score += 2;
  else if (metrics.totalTrades >= 50) score += 1;

  // More trading days = higher confidence
  if (metrics.tradingDays >= 30) score += 2;
  else if (metrics.tradingDays >= 15) score += 1;

  // Consistency score contributes
  if (metrics.consistencyScore >= 60) score += 1;

  if (score >= 5) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

function getRiskLevel(prob, metrics) {
  let risk = 0;

  // Low probability = higher risk
  if (prob < 40) risk += 3;
  else if (prob < 60) risk += 2;
  else if (prob < 75) risk += 1;

  // High max drawdown = higher risk
  if (metrics.maxDrawdown > 8) risk += 2;
  else if (metrics.maxDrawdown > 5) risk += 1;

  // Poor discipline = higher risk
  if (metrics.disciplineScore < 40) risk += 2;
  else if (metrics.disciplineScore < 60) risk += 1;

  // Overtrading
  if (metrics.tradesPerDay > 8) risk += 1;

  if (risk >= 5) return 'High';
  if (risk >= 3) return 'Medium';
  return 'Low';
}

function getSummary(prob, grade, riskLevel) {
  if (prob >= 80) return 'Strong chance of passing. Your trading history shows solid performance.';
  if (prob >= 65) return 'Good probability of passing. A few adjustments could push you higher.';
  if (prob >= 50) return 'Moderate chance. Focus on consistency and risk management to improve.';
  if (prob >= 35) return 'Below average probability. Significant improvements needed in key areas.';
  return 'Low probability of passing. Review your strategy fundamentals before attempting.';
}

/* ── Grade colors for UI ───────────────────────────────────── */

export const GRADE_COLORS = {
  'A+': { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' },
  A:    { bg: 'rgba(52, 211, 153, 0.12)', text: '#34d399', border: 'rgba(52, 211, 153, 0.25)' },
  B:    { bg: 'rgba(96, 165, 250, 0.12)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.25)' },
  C:    { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' },
  D:    { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.25)' },
  F:    { bg: 'rgba(248, 113, 113, 0.12)', text: '#f87171', border: 'rgba(248, 113, 113, 0.25)' },
};

export const RISK_COLORS = {
  Low:    '#34d399',
  Medium: '#fbbf24',
  High:   '#f87171',
};

export const CONFIDENCE_COLORS = {
  High:   '#34d399',
  Medium: '#fbbf24',
  Low:    '#f87171',
};
