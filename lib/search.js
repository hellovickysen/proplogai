/**
 * Server-side search functions for PropLogAI sitewide search.
 * Searches trades, journal entries, ai insights, setups, expenses, trophies, payouts.
 * All queries include .eq('user_id', userId) for data isolation.
 */

const MAX_PER_GROUP = 8;

/** Common trading emotions for detection */
const KNOWN_EMOTIONS = ['fomo', 'fear', 'greedy', 'greed', 'confident', 'calm', 'anxious', 'anxiety', 'impatient', 'disciplined', 'frustrated', 'revenge', 'excited', 'bored', 'nervous', 'hopeful', 'regret', 'euphoric'];

/** Check if query matches a known emotion (case-insensitive) */
function detectEmotion(query) {
  const lower = (query || '').toLowerCase().trim();
  return KNOWN_EMOTIONS.find(e => lower === e || lower.includes(e)) || null;
}

/** Common tags for detection */
const KNOWN_TAGS = ['news', 'high impact', 'low volume', 'scalp', 'swing', 'nfp', 'cpi', 'fomc', 'breakout', 'reversal'];

/** Check if query matches a known tag */
function detectTag(query) {
  const lower = (query || '').toLowerCase().trim();
  return KNOWN_TAGS.find(t => lower === t || lower.includes(t)) || null;
}

/**
 * Search trades by pair, direction, setup name, or notes.
 * Also finds trades by emotion (via journal_entries join).
 */
async function searchTrades(supabase, userId, query, filters = {}) {
  const detectedEmotion = filters.emotion || detectEmotion(query);
  const detectedTag = filters.tag || detectTag(query);

  // If searching by emotion or tag, find trades via journal entries
  if (detectedEmotion && !filters.pair && !filters.direction) {
    return searchTradesByEmotion(supabase, userId, detectedEmotion, filters);
  }
  if (detectedTag && !filters.pair && !filters.direction && !detectedEmotion) {
    return searchTradesByTag(supabase, userId, detectedTag, filters);
  }

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
    href: `/dashboard/trades/${t.id}?from=search`,
  }));
}

/**
 * Find trades that have a specific emotion in their journal entry.
 */
async function searchTradesByEmotion(supabase, userId, emotion, filters = {}) {
  // Capitalize first letter for matching (emotions stored as "FOMO", "Fear", etc.)
  const emotionCaps = emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase();
  // Also try all-uppercase for acronyms like FOMO
  const emotionUpper = emotion.toUpperCase();

  // Step 1: find journal entries with this emotion
  let jq = supabase
    .from('journal_entries')
    .select('trade_id, emotions')
    .eq('user_id', userId);

  const { data: journals, error: jErr } = await jq;
  if (jErr) { console.error('searchTradesByEmotion journal error:', jErr); return []; }

  // Filter journals that contain the emotion (case-insensitive)
  const matchingTradeIds = (journals || [])
    .filter(j => (j.emotions || []).some(e =>
      e.toLowerCase() === emotion.toLowerCase()
    ))
    .map(j => j.trade_id)
    .filter(Boolean);

  if (matchingTradeIds.length === 0) return [];

  // Step 2: fetch those trades
  let tq = supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, trade_date, setup, session, created_at')
    .eq('user_id', userId)
    .in('id', matchingTradeIds.slice(0, MAX_PER_GROUP))
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.pnl_direction === 'positive') tq = tq.gt('pnl', 0);
  if (filters.pnl_direction === 'negative') tq = tq.lt('pnl', 0);
  if (filters.date_from) tq = tq.gte('trade_date', filters.date_from);
  if (filters.date_to) tq = tq.lte('trade_date', filters.date_to);

  const { data: trades, error: tErr } = await tq;
  if (tErr) { console.error('searchTradesByEmotion trades error:', tErr); return []; }

  return (trades || []).map(t => ({
    type: 'trade',
    id: t.id,
    pair: t.pair,
    title: `${t.pair} — ${t.setup || 'No Setup'}`,
    subtitle: t.trade_date,
    pnl: t.pnl,
    r_multiple: t.r_multiple,
    direction: t.direction,
    session: t.session,
    emotion: emotion,
    href: `/dashboard/trades/${t.id}?from=search`,
  }));
}

/**
 * Find trades that have a specific tag in their journal entry.
 */
async function searchTradesByTag(supabase, userId, tag, filters = {}) {
  // Step 1: find journal entries with this tag
  const { data: journals, error: jErr } = await supabase
    .from('journal_entries')
    .select('trade_id, tags')
    .eq('user_id', userId);

  if (jErr) { console.error('searchTradesByTag journal error:', jErr); return []; }

  // Filter journals that contain the tag (case-insensitive)
  const matchingTradeIds = (journals || [])
    .filter(j => (j.tags || []).some(t =>
      t.toLowerCase() === tag.toLowerCase()
    ))
    .map(j => j.trade_id)
    .filter(Boolean);

  if (matchingTradeIds.length === 0) return [];

  // Step 2: fetch those trades
  let tq = supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, trade_date, setup, session, created_at')
    .eq('user_id', userId)
    .in('id', matchingTradeIds.slice(0, MAX_PER_GROUP))
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.pnl_direction === 'positive') tq = tq.gt('pnl', 0);
  if (filters.pnl_direction === 'negative') tq = tq.lt('pnl', 0);

  const { data: trades, error: tErr } = await tq;
  if (tErr) { console.error('searchTradesByTag trades error:', tErr); return []; }

  return (trades || []).map(t => ({
    type: 'trade',
    id: t.id,
    pair: t.pair,
    title: `${t.pair} — ${t.setup || 'No Setup'}`,
    subtitle: t.trade_date,
    pnl: t.pnl,
    r_multiple: t.r_multiple,
    direction: t.direction,
    session: t.session,
    tag: tag,
    href: `/dashboard/trades/${t.id}?from=search`,
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

  // Check if query matches a known emotion — search emotions array too
  const detectedEmotion = detectEmotion(query);

  if (query && !filters.emotion && !filters.tag) {
    if (detectedEmotion) {
      // Search both note text AND emotions array
      // Supabase .or() doesn't support .contains, so we search note text
      // and rely on post-filter for emotions
      q = q.or(`note.ilike.%${query}%,lesson.ilike.%${query}%`);
    } else {
      q = q.or(`note.ilike.%${query}%,lesson.ilike.%${query}%`);
    }
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
      href: j.trade_id ? `/dashboard/trades/${j.trade_id}?from=search` : '/dashboard/trades',
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
    href: j.trade_id ? `/dashboard/trades?tradeId=${j.trade_id}` : '/dashboard/trades',
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
    href: '/dashboard/prop-expenses',
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
