// Effective dates use the same reporting timezone as Analytics.
export const RULE_HISTORY_KEY = "effective_history";
export const RULEBOOK_TIME_ZONE = "Asia/Kolkata";

const reportingDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: RULEBOOK_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export function rulebookDate(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return reportingDateFormatter.format(date);
}

export function validRuleDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function ruleVersionFromRow(row, effectiveFrom = rulebookDate(row?.updated_at || row?.created_at)) {
  if (!row || !validRuleDate(effectiveFrom)) return null;
  return {
    effective_from: effectiveFrom,
    recorded_at: row.updated_at || row.created_at || effectiveFrom + "T00:00:00Z",
    value: row.value ?? "", unit: row.unit ?? null, enabled: row.enabled !== false,
    ...(row.title !== undefined ? { title: row.title } : {}),
    ...(row.guidance !== undefined ? { guidance: row.guidance } : {}),
    settings: Object.fromEntries(Object.entries(row.metadata || {}).filter(([key]) => key !== RULE_HISTORY_KEY)),
  };
}

export function ruleVersions(row) {
  const stored = Array.isArray(row?.metadata?.[RULE_HISTORY_KEY]) ? row.metadata[RULE_HISTORY_KEY] : [];
  if (stored.length) return stored.filter((entry) => validRuleDate(entry?.effective_from));
  const legacy = ruleVersionFromRow(row);
  // A legacy snapshot records only the last known state, not an invented change.
  return legacy ? [{ ...legacy, baseline: true }] : [];
}

export function appendRuleVersion(existing, next, effectiveFrom, recordedAt) {
  if (!validRuleDate(effectiveFrom)) throw new Error("Choose a valid effective date.");
  if (!Number.isFinite(Date.parse(recordedAt))) throw new Error("A valid recorded timestamp is required.");
  const entry = ruleVersionFromRow({ ...next, updated_at: recordedAt }, effectiveFrom);
  return [...ruleVersions(existing), entry];
}

function compareVersions(a, b) {
  return a.effective_from.localeCompare(b.effective_from)
    || (Date.parse(a.recorded_at) || 0) - (Date.parse(b.recorded_at) || 0);
}

export function latestRuleVersion(history, date = null) {
  return [...history].filter((entry) => !date || entry.effective_from <= date).sort(compareVersions).at(-1);
}

function resolvedVersion(row, version, date, retrospective = false) {
  return { ...row, value: version.value, unit: version.unit, enabled: version.enabled !== false,
    ...(version.title !== undefined ? { title: version.title } : {}),
    ...(version.guidance !== undefined ? { guidance: version.guidance } : {}),
    metadata: version.settings || {}, effective_from: version.effective_from,
    version_recorded_at: version.recorded_at || null,
    effectiveVersion: true, resolved_for_date: date, retrospective };
}

export function ruleForDate(row, date) {
  if (!row || !validRuleDate(date)) return null;
  if (row.effectiveVersion) return !row.resolved_for_date || row.resolved_for_date === date ? row : null;
  if (row.displayDefault) return null;
  // Timestamp-free in-memory fixtures are already explicit rule definitions.
  if (!row.updated_at && !row.created_at && !Array.isArray(row.metadata?.[RULE_HISTORY_KEY])) return row;
  const current = latestRuleVersion(ruleVersions(row), date);
  return current ? resolvedVersion(row, current, date) : null;
}

// Keep comparisons for older trades separate from proof of historical rules.
export function ruleForTradeComparison(row, date) {
  const historical = ruleForDate(row, date);
  if (historical) return historical;
  if (!row || !validRuleDate(date) || row.effectiveVersion) return null;
  if (row.displayDefault) return { ...row, retrospective: true, effectiveVersion: true, resolved_for_date: date };
  const earliest = [...ruleVersions(row)].sort(compareVersions)[0];
  return earliest ? resolvedVersion(row, earliest, date, true) : null;
}

export function ruleSnapshot(rule) {
  return { id: rule.id, rule_key: rule.rule_key, value: rule.value, unit: rule.unit,
    category: rule.category, effective_from: rule.effective_from || null,
    version_recorded_at: rule.version_recorded_at || null,
    settings: rule.metadata || {}, retrospective: Boolean(rule.retrospective) };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function ruleSnapshotKey(rule) { return JSON.stringify(canonical(ruleSnapshot(rule))); }
export function sameRuleSettings(a, b) { return JSON.stringify(canonical(a || {})) === JSON.stringify(canonical(b || {})); }

export function ruleHistoryEntries(rules, now = new Date()) {
  const today = rulebookDate(now);
  return rules.flatMap((rule) => ruleVersions(rule).map((version) => ({ ...version,
    ruleId: rule.id, title: version.title ?? rule.title, ruleKey: rule.rule_key,
    accountId: rule.account_id, legacy: Boolean(version.baseline),
    scheduled: version.effective_from > today,
  }))).sort((a, b) => (Date.parse(b.recorded_at) || 0) - (Date.parse(a.recorded_at) || 0) || b.effective_from.localeCompare(a.effective_from));
}

export function recentRuleHistory(entries, now = new Date()) {
  const today = rulebookDate(now);
  if (!today) return [];
  const [year, month, day] = today.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 4, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cutoff = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay))).toISOString().slice(0, 10);
  return entries.filter((entry) => {
    const date = rulebookDate(entry.recorded_at);
    return date && date >= cutoff && Date.parse(entry.recorded_at) <= new Date(now).getTime();
  });
}
