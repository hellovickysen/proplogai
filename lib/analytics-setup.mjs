// Resolve tags using only the authenticated user's setup lookup supplied by the caller.
export function resolveAnalyticsSetups(trade, setupById) {
  const ids = Array.isArray(trade.setup_ids) && trade.setup_ids.length
    ? trade.setup_ids : trade.setup_id ? [trade.setup_id] : [];
  const mapped = ids.map((id) => setupById.get(id)).filter(Boolean);
  const names = mapped.length ? mapped : String(trade.setup || "").split(",");
  return [...new Set(names.map((name) => String(name).trim()).filter(Boolean))];
}
