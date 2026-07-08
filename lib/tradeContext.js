/**
 * Build rich context from the trader's data for AI prompts.
 *
 * Data Priority (as defined in PropLogAI AI strategy):
 *   Level 1: Trading rules, setups, risk rules
 *   Level 2: Trade statistics (win rate, RR, profit factor, session, instrument)
 *   Level 3: Journal data (emotions, lessons, notes, tags)
 *   Level 4: Historical patterns (last 30/90/180 trades)
 *
 * Usage:
 *   const context = await getUserTradeContext(supabase, userId, { depth: 30 });
 *   const analysis = await analyzeTradeWithAI(trade, journal, context);
 */

/**
 * Get user's trade context for AI prompts.
 *
 * @param {object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {object} opts
 * @param {number} opts.depth - Number of trades to analyze (30 for Basic, 90/180 for Elite)
 * @returns {object} Context object with userSetups, stats, recentPatterns, sessionStats, instrumentStats
 */
export async function getUserTradeContext(supabase, userId, opts = {}) {
  const depth = opts.depth || 30;
  const context = {};

  // Level 1: User's defined setups/rules
  const { data: setups } = await supabase
    .from('setups')
    .select('name, direction, description, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order');

  if (setups && setups.length > 0) {
    context.userSetups = setups
      .map((s) => `${s.name}${s.direction ? ' (' + s.direction + ')' : ''}${s.description ? ': ' + s.description.slice(0, 80) : ''}`)
      .join('; ');
  }

  // Level 2: Trade statistics
  const { data: recentTrades } = await supabase
    .from('trades')
    .select('pair, direction, pnl, setup, setup_followed, session, timeframe, trade_date')
    .eq('user_id', userId)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(depth);

  const trades = recentTrades || [];
  if (trades.length > 0) {
    const wins = trades.filter((t) => Number(t.pnl) > 0).length;
    const losses = trades.filter((t) => Number(t.pnl) < 0).length;
    const net = trades.reduce((a, t) => a + (Number(t.pnl) || 0), 0);

    context.stats = `${trades.length} trades, ${wins}W/${losses}L, win rate ${Math.round((wins / trades.length) * 100)}%, net $${net.toFixed(2)}, avg R ${avgR.toFixed(2)}`;

    // Session performance
    const sessionMap = {};
    trades.forEach((t) => {
      if (!t.session) return;
      if (!sessionMap[t.session]) sessionMap[t.session] = { wins: 0, total: 0, pnl: 0 };
      sessionMap[t.session].total++;
      if (Number(t.pnl) > 0) sessionMap[t.session].wins++;
      sessionMap[t.session].pnl += Number(t.pnl) || 0;
    });
    if (Object.keys(sessionMap).length > 0) {
      context.sessionStats = Object.entries(sessionMap)
        .map(([s, d]) => `${s}: ${d.total} trades, ${Math.round((d.wins / d.total) * 100)}% win, $${d.pnl.toFixed(0)}`)
        .join('; ');
    }

    // Instrument performance
    const pairMap = {};
    trades.forEach((t) => {
      if (!t.pair) return;
      if (!pairMap[t.pair]) pairMap[t.pair] = { wins: 0, total: 0, pnl: 0 };
      pairMap[t.pair].total++;
      if (Number(t.pnl) > 0) pairMap[t.pair].wins++;
      pairMap[t.pair].pnl += Number(t.pnl) || 0;
    });
    if (Object.keys(pairMap).length > 0) {
      context.instrumentStats = Object.entries(pairMap)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8)
        .map(([p, d]) => `${p}: ${d.total} trades, ${Math.round((d.wins / d.total) * 100)}% win, $${d.pnl.toFixed(0)}`)
        .join('; ');
    }

    // Recent patterns (setup adherence, streaks)
    const followed = trades.filter((t) => t.setup_followed === 'yes').length;
    const partial = trades.filter((t) => t.setup_followed === 'partial').length;
    const notFollowed = trades.filter((t) => t.setup_followed === 'no').length;
    const withData = followed + partial + notFollowed;
    if (withData > 0) {
      context.recentPatterns = `Setup adherence: ${followed}/${withData} followed (${Math.round((followed / withData) * 100)}%), ${partial} partial, ${notFollowed} not followed`;
    }
  }

  return context;
}
