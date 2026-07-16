/**
 * Account helpers for multi-account feature.
 * Elite-only: traders can group trades under separate prop-firm accounts.
 */

/**
 * Fetch all non-archived accounts for a user, ordered by sort_order.
 */
export async function getAccounts(supabase, userId) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, prop_firm, account_size, phase, status, color, starting_balance, is_archived, sort_order, created_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getAccounts error', error);
    return [];
  }
  return data || [];
}

/**
 * Get the user's active_account_id from user_preferences.
 * Returns null if "All Accounts" is selected or no preference set.
 */
export async function getActiveAccountId(supabase, userId) {
  const { data } = await supabase
    .from('user_preferences')
    .select('active_account_id')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.active_account_id || null;
}

/**
 * Compute per-account P&L stats for the account switcher dropdown.
 * Returns a map of { accountId: { pnl, tradeCount } }.
 */
export async function getAccountStats(supabase, userId, tradingDate) {
  const { data: trades } = await supabase
    .from('trades')
    .select('account_id, pnl')
    .eq('user_id', userId)
    .gte('trade_date', tradingDate);

  const stats = {};
  (trades || []).forEach((t) => {
    const aid = t.account_id || '__unassigned__';
    if (!stats[aid]) stats[aid] = { pnl: 0, tradeCount: 0 };
    stats[aid].pnl += Number(t.pnl) || 0;
    stats[aid].tradeCount += 1;
  });
  return stats;
}

/**
 * Apply optional account filter to a Supabase query builder.
 * If activeAccountId is null, returns the query unchanged (All Accounts).
 */
export function applyAccountFilter(query, activeAccountId) {
  if (activeAccountId) {
    return query.eq('account_id', activeAccountId);
  }
  return query;
}
