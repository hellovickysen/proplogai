// Canonical Analytics buckets. Unsupported labels stay in Unassigned so no trade disappears.
export function normalizeAnalyticsSession(value) {
  const name = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (["asia", "asian", "asia session", "asian session"].includes(name)) return "Asian";
  if (["london", "london session"].includes(name)) return "London";
  if (["ny", "new york", "newyork", "ny session", "new york session"].includes(name)) return "New York";
  return "Unassigned";
}
