// Bound the UUID filter length so full account lists do not exceed URL limits.
export async function readTradeListJournals(supabase, userId, tradeIds = []) {
  if (!userId) return { data: null, error: { message: "You must be signed in." } };
  const ids = [...new Set(tradeIds)];
  if (!ids.length) return { data: [], error: null };
  const requests = [];
  try {
    for (let start = 0; start < ids.length; start += 100) {
      requests.push(supabase.from("journal_entries")
        .select("trade_id,emotions,tags,note,lesson,screenshot_url,screenshot_urls,confidence")
        .eq("user_id", userId).in("trade_id", ids.slice(start, start + 100)));
    }
    const results = await Promise.all(requests);
    const failed = results.find(result => result.error);
    if (failed) return { data: null, error: failed.error };
    return { data: results.flatMap(result => result.data || []), error: null };
  } catch {
    return { data: null, error: { message: "Unable to load journal details." } };
  }
}
