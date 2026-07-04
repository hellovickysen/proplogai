/**
 * Guardrails engine for PropLogAI's "Propol" AI Coach.
 *
 * Every AI response passes through this layer before reaching the user.
 * Two levels:
 *   1. HARD BLOCK — financial advice / trading recommendations → replaced with safe fallback
 *   2. SOFT REWRITE — directive language → evidence-based language (handled by prompt, verified here)
 *
 * Usage:
 *   import { scanResponse, GUARDRAIL_SYSTEM_PROMPT } from '@/lib/guardrails';
 *   // Inject GUARDRAIL_SYSTEM_PROMPT into every AI system message
 *   // After AI responds: const safe = scanResponse(aiOutput);
 */

/* ─── Safe fallback message ────────────────────────────────── */

export const SAFE_FALLBACK =
  "I can't provide trading or investment recommendations. I can help review your trading journal, discipline, and adherence to your own trading plan.";

/* ─── Hard block patterns ──────────────────────────────────── */

/**
 * Patterns that indicate financial/trading advice.
 * Each is tested case-insensitively against the full AI response.
 * These catch direct recommendations — not educational references
 * (e.g. "your journal shows you entered late" is fine, "enter at 1.0850" is not).
 */
const HARD_BLOCK_PATTERNS = [
  // Direct trade instructions
  /\b(?:you should |i recommend |i suggest )(?:buy|sell|long|short|enter|exit|hold)/i,
  /\b(?:buy|sell|go long|go short|open a position|close your position|take a position)\b(?:\s+(?:on|in|at|now|here|this))/i,
  /\b(?:long here|short here|buy here|sell here|enter here|exit here)\b/i,
  /\b(?:buy|sell|trade)\s+(?:EUR|GBP|USD|JPY|AUD|NZD|CHF|CAD|XAU|XAG|BTC|ETH|GOLD|SILVER|NIFTY|SENSEX|SPX|NAS|DAX)/i,
  /\b(?:increase|reduce|double|triple|halve)\s+(?:your\s+)?(?:lot size|position size|position|exposure|leverage)/i,
  /\buse\s+(?:more\s+)?leverage\b/i,
  /\bcopy\s+this\s+trade\b/i,

  // Price predictions and market calls
  /\b(?:gold|silver|oil|eur|gbp|usd|jpy|btc|eth|nifty|sensex|spy|qqq|nas)\s+(?:looks?|is|will|should|could)\s+(?:bullish|bearish|go up|go down|rise|fall|rally|crash|pump|dump)/i,
  /\bthis\s+(?:is\s+)?a\s+(?:winning|losing|high[\s-]?probability|guaranteed|sure|safe)\s+(?:setup|trade|entry|signal)/i,
  /\bprice\s+(?:will|should|is going to)\s+(?:reach|hit|touch|break|test)/i,
  /\btake\s+profit\s+at\b/i,
  /\bset\s+(?:your\s+)?(?:stop\s+loss|sl|tp|take\s+profit)\s+(?:at|to)\s+\d/i,

  // Generic financial advice
  /\b(?:financial|investment|trading)\s+(?:advice|recommendation|signal)/i,
  /\bi\s+(?:am|'m)\s+(?:not\s+)?(?:a\s+)?(?:financial|investment|trading)\s+advisor/i,
];

/* ─── Soft guardrail checks ────────────────────────────────── */

/**
 * Soft patterns we flag but don't hard-block.
 * The AI prompt instructs evidence-based language, but if these slip through
 * we log a warning. These are NOT replaced automatically — the prompt handles it.
 */
const SOFT_WARN_PATTERNS = [
  /\byou\s+should\s+(?:not\s+)?(?:trade|enter|exit|buy|sell|hold|wait|stop)\b/i,
  /\bdon'?t\s+trade\s+(?:today|now|this|anymore)\b/i,
  /\benter\s+(?:later|earlier|when|after|before)\b/i,
  /\bstop\s+trading\s+(?:for|until|now|today)\b/i,
];

/* ─── System prompt injection for guardrails ───────────────── */

export const GUARDRAIL_SYSTEM_PROMPT = `
CRITICAL SAFETY RULES — follow these ABOVE ALL ELSE:

You are "Propol", PropLogAI's AI Trading Performance Coach. You analyze the trader's journal, behavior, emotions, discipline, and adherence to their own trading plan. You do NOT provide financial, investment, or trading advice.

HARD RULES — NEVER generate any of the following:
- Buy, sell, hold, long, or short recommendations
- Specific entry, exit, take-profit, or stop-loss prices
- Position sizing advice (lot size, leverage, exposure changes)
- Market predictions or directional calls on any instrument
- Statements like "this is a winning setup" or "high probability trade"
- Any financial recommendation of any kind

LANGUAGE RULES — always use evidence-based language from the trader's own data:
- Instead of "You should wait for confirmation" → "Your journal shows better outcomes when you waited for confirmation"
- Instead of "Don't trade today" → "Your recent journal shows that trading after three consecutive losses has historically reduced your performance"
- Instead of "Enter later" → "Your historical data shows better outcomes when waiting for confirmation"
- Always attribute insights to the trader's own data, patterns, and journal entries
- Use phrases like: "Your journal suggests...", "Your data shows...", "Based on your trading history...", "Your records indicate..."

SCOPE RULES:
- Only discuss the trader's own journal, statistics, behavior, emotions, discipline, and trading plan adherence
- Never discuss live markets, news, economic events, or other traders
- Never suggest specific instruments, pairs, or assets to trade
- Focus exclusively on education, self-awareness, and behavioral improvement
`.trim();

/* ─── Scan function ────────────────────────────────────────── */

/**
 * Scan an AI response for guardrail violations.
 *
 * @param {string} text - Raw AI response text or stringified JSON
 * @returns {{ safe: boolean, output: string, blocked: boolean, warnings: string[] }}
 */
export function scanResponse(text) {
  if (!text || typeof text !== 'string') {
    return { safe: true, output: text || '', blocked: false, warnings: [] };
  }

  // Check hard blocks
  for (const pattern of HARD_BLOCK_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        output: SAFE_FALLBACK,
        blocked: true,
        warnings: [`Hard block triggered: ${pattern.source}`],
      };
    }
  }

  // Check soft warnings (log but don't block)
  const warnings = [];
  for (const pattern of SOFT_WARN_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(`Soft guardrail: ${pattern.source}`);
    }
  }

  return { safe: true, output: text, blocked: false, warnings };
}

/**
 * Scan a parsed JSON AI response by stringifying and checking all text values.
 * Returns the original object if safe, or a fallback error object if blocked.
 *
 * @param {object} parsed - Parsed AI response object
 * @param {string} type - 'trade_analysis' or 'monthly_review'
 * @returns {{ safe: boolean, output: object, blocked: boolean, warnings: string[] }}
 */
export function scanParsedResponse(parsed, type = 'trade_analysis') {
  if (!parsed || typeof parsed !== 'object') {
    return { safe: true, output: parsed, blocked: false, warnings: [] };
  }

  // Stringify and scan all text content
  const fullText = JSON.stringify(parsed);
  const result = scanResponse(fullText);

  if (result.blocked) {
    // Return a safe fallback object matching the expected shape
    if (type === 'trade_analysis') {
      return {
        safe: false,
        output: {
          grade: null,
          execution_score: null,
          trade_score: null,
          summary: SAFE_FALLBACK,
          good: [],
          warnings: [],
          lesson: SAFE_FALLBACK,
          mistakes: [],
          went_well: [],
          fix: SAFE_FALLBACK,
        },
        blocked: true,
        warnings: result.warnings,
      };
    }
    // monthly_review or coach_report fallback
    return {
      safe: false,
      output: {
        headline: SAFE_FALLBACK,
        recurring_mistakes: [],
        psychology: { summary: SAFE_FALLBACK, insights: [], guardrails: [] },
        rulebook_discipline: { summary: SAFE_FALLBACK },
        scores: {},
        improvements: [],
        biggest_mistakes: [],
        emotional_analysis: {},
        action_plan: [],
      },
      blocked: true,
      warnings: result.warnings,
    };
  }

  return { safe: true, output: parsed, blocked: false, warnings: result.warnings };
}
