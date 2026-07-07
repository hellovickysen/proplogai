/**
 * Server-side search functions for PropLogAI sitewide search.
 * Searches trades, journal entries, ai insights, setups, expenses, trophies, payouts.
 * All queries include .eq('user_id', userId) for data isolation.
 */

const MAX_PER_GROUP = 8;

/**
 * Search trades by pair, direction, setup name, or notes.
 */
async function searchTrades(supabase, userId, query, filters = {}) {
  let q = supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, trade_date, setup, session, timeframe, lot_size, entry_price, exit_price, stop_loss, created_at')
    .eq('user_id', userId)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(MAX_PER_GROUP);

  // Apply structured filters (from AI parse or direct)
  if (filters.pair) q = q.ilike('pair', `%${filters.pair}%`);
  if (filters.direction) q = q.eq('direction', filters.direction.toLowerCase());
  if (filters.session) q = q.ilike('session', `%${filters.session}%`);
  if (filters.timeframe) q = q.ilike('timeframe', `%${filters.timeframe}%`);
  if (filters.setup) q = q.ilike('setup', `%${filters.setup}%`);
  if (filters.pnl_direction === 'positive') q = q.gt('pnl', 0);
  if (filters.pnl_direction === 'negative') q = q.lt('pnl', 0);
  if (filters.date_from) q = q.gte('trade_date', filters.date_from);
  if (filters.date_to) q = q.lte('trade_date', filters.date_to);

  // If no structured filters, do text search on pair
  if (!Object.keys(filters).length && query) {
    q = q.ilike('pair', `%${query}%`);
  }

  const { data, error } = await q;
  if (error) { console.error('searchTrades error:', error); return []; }
  return (data || []).map(t => ({
    type: 'trade',
    id: t.id,
    pair: t.pair,
    title: `${t.pair} — ${t.setup || 'No Setup'}`,
    subtitle: t.trade_date,
    pnl: t.pnl,
    r_multiple: t.r_multiple,
    direction: t.direction,
    session: t.session,
    href: `/dashboard/trades?search=${encodeURIComponent(t.pair)}`,
  }));
}

/**
 * Search journal entries by note text, lesson, emotions, tags.
 */
async function searchJournal(supabase, userId, query, filters = {}) {
  // Use Supabase foreign-key join to get the trade's pair alongside journal data
  let q = supabase
    .from('journal_entries')
    .select('id, trade_id, note, lesson, emotions, tags, confidence, created_at, trades!inner(pair, trade_date)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_PER_GROUP);

  if (filters.emotion) {
    q = q.contains('emotions', [filters.emotion]);
  }
  if (filters.tag) {
    q = q.contains('tags', [filters.tag]);
  }

  // Text search on note and lesson
  if (query && !filters.emotion && !filters.tag) {
    q = q.or(`note.ilike.%${query}%,lesson.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) {
    // Fallback without join if FK relationship isn't set up
    console.error('searchJournal join error, retrying without join:', error);
    return searchJournalFallback(supabase, userId, query, filters);
  }
  return (data || []).map(j => {
    const pair = j.trades?.pair || '';
    const tradeDate = j.trades?.trade_date || '';
    return {
      type: 'journal',
      id: j.id,
      tradeId: j.trade_id,
      pair,
      title: j.note ? `"${j.note.substring(0, 80)}${j.note.length > 80 ? '...' : ''}"` : (j.lesson || 'Journal entry'),
      subtitle: `${pair ? pair + ' · ' : ''}${tradeDate || new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      emotions: j.emotions,
      tags: j.tags,
      href: pair ? `/dashboard/trades?search=${encodeURIComponent(pair)}` : '/dashboard/trades',
    };
  });
}

/** Fallback journal search without FK join */
async function searchJournalFallback(supabase, userId, query, filters = {}) {
  let q = supabase
    .from('journal_entries')
    .select('id, trade_id, note, lesson, emotions, tags, confidence, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_PER_GROUP);

  if (filters.emotion) q = q.contains('emotions', [filters.emotion]);
  if (filters.tag) q = q.contains('tags', [filters.tag]);
  if (query && !filters.emotion && !filters.tag) {
    q = q.or(`note.ilike.%${query}%,lesson.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) { console.error('searchJournal fallback error:', error); return []; }
  return (data || []).map(j => ({
    type: 'journal',
    id: j.id,
    tradeId: j.trade_id,
    title: j.note ? `"${j.note.substring(0, 80)}${j.note.length > 80 ? '...' : ''}"` : (j.lesson || 'Journal entry'),
    subtitle: new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    emotions: j.emotions,
    tags: j.tags,
    href: '/dashboard/trades',
  }));
}

/**
 * Search AI insights (trade analyses and coach reports).
 */
async function searchCoach(supabase, userId, query) {
  let q = supabase
    .from('ai_insights')
    .select('id, trade_id, type, summary, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_PER_GROUP);

  if (query) {
    q = q.ilike('summary', `%${query}%`);
  }

  const { data, error } = await q;
  if (error) { console.error('searchCoach error:', error); return []; }
  return (data || []).map(a => ({
    type: 'coach',
    id: a.id,
    title: a.summary ? `${a.summary.substring(0, 80)}${a.summary.length > 80 ? '...' : ''}` : (a.type === 'coach_report' ? 'Coach Report' : 'Trade Analysis'),
    subtitle: `${a.type === 'coach_report' ? 'Coach Report' : 'Trade Analysis'} · ${new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    href: '/dashboard/coach',
  }));
}

/**
 * Search setups by name and description.
 */
async function searchSetups(supabase, userId, query) {
  let q = supabase
    .from('setups')
    .select('id, name, direction, description, is_default, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(MAX_PER_GROUP);

  if (query) {
    q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) { console.error('searchSetups error:', error); return []; }
  return (data || []).map(s => ({
    type: 'setup',
    id: s.id,
    title: s.name,
    subtitle: `${s.direction || 'Any direction'} · ${s.is_default ? 'Default' : 'Custom'}`,
    href: '/dashboard/rulebook',
  }));
}

/**
 * Search expenses by firm name and notes.
 */
async function searchExpenses(supabase, userId, query) {
  let q = supabase
    .from('expenses')
    .select('id, firm_name, account_type, account_size, total_cost, expense_date, notes')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .limit(MAX_PER_GROUP);

  if (query) {
    q = q.or(`firm_name.ilike.%${query}%,notes.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) { console.error('searchExpenses error:', error); return []; }
  return (data || []).map(e => ({
    type: 'expense',
    id: e.id,
    title: e.firm_name,
    subtitle: `$${e.total_cost} · ${new Date(e.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    pnl: -Math.abs(e.total_cost),
    href: '/dashboard/expenses',
  }));
}

/**
 * Search trophies by title, description, firm name.
 */
async function searchTrophies(supabase, userId, query) {
  let q = supabase
    .from('trophies')
    .select('id, title, category, description, firm_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(MAX_PER_GROUP);

  if (query) {
    q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%,firm_name.ilike.%${query}%`);
  }

  const { data, error } = await q;
  if (error) { console.error('searchTrophies error:', error); return []; }
  return (data || []).map(t => ({
    type: 'trophy',
    id: t.id,
    title: t.title || t.firm_name || 'Trophy',
    subtitle: `${t.category} · ${t.firm_name || ''} · ${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    href: '/dashboard/trophies',
  }));
}

/**
 * Run all searches in parallel and return grouped results.
 */
export async function searchAll(supabase, userId, query, filters = {}, activeFilter = 'all') {
  const searches = {};

  if (activeFilter === 'all' || activeFilter === 'trades') {
    searches.trades = searchTrades(supabase, userId, query, filters);
  }
  if (activeFilter === 'all' || activeFilter === 'journal') {
    searches.journal = searchJournal(supabase, userId, query, filters);
  }
  if (activeFilter === 'all' || activeFilter === 'coach') {
    searches.coach = searchCoach(supabase, userId, query);
  }
  if (activeFilter === 'all' || activeFilter === 'setups') {
    searches.setups = searchSetups(supabase, userId, query);
  }
  if (activeFilter === 'all' || activeFilter === 'expenses') {
    searches.expenses = searchExpenses(supabase, userId, query);
  }
  if (activeFilter === 'all' || activeFilter === 'trophies') {
    searches.trophies = searchTrophies(supabase, userId, query);
  }

  const keys = Object.keys(searches);
  const results = await Promise.all(Object.values(searches));

  const grouped = {};
  let total = 0;
  keys.forEach((key, i) => {
    grouped[key] = results[i];
    total += results[i].length;
  });

  return { grouped, total };
}
