"use server";

import { createClient } from '@/lib/supabase/server';

/**
 * Export all trades (+ journal data) as CSV.
 * Returns { csv, filename } or { error }.
 */
export async function exportTradesCSV() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  // Fetch all trades ordered by trade_date
  const { data: trades, error: tErr } = await supabase
    .from('trades')
    .select('id, pair, direction, entry_price, exit_price, stop_loss, take_profit, lot_size, pnl, r_multiple, setup, timeframe, session, trade_date, opened_at, closed_at, created_at')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false, nullsFirst: false });

  if (tErr) return { error: tErr.message };
  const list = trades || [];
  if (list.length === 0) return { error: 'No trades to export.' };

  // Fetch journal entries for all trades
  const tradeIds = list.map((t) => t.id);
  let journalMap = {};
  if (tradeIds.length > 0) {
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('trade_id, note, emotions, confidence')
      .in('trade_id', tradeIds);
    (journals || []).forEach((j) => {
      journalMap[j.trade_id] = j;
    });
  }

  // CSV headers
  const headers = [
    'Date',
    'Pair',
    'Direction',
    'Entry Price',
    'Exit Price',
    'Stop Loss',
    'Take Profit',
    'Lot Size',
    'P&L ($)',
    'R Multiple',
    'Setup',
    'Timeframe',
    'Session',
    'Confidence',
    'Emotions',
    'Journal Note',
  ];

  // Build rows
  const rows = list.map((t) => {
    const j = journalMap[t.id];
    const date = t.trade_date || (t.closed_at ? t.closed_at.slice(0, 10) : t.created_at ? t.created_at.slice(0, 10) : '');
    const emotions = j && Array.isArray(j.emotions) ? j.emotions.join('; ') : '';
    const note = j && j.note ? j.note : '';
    const confidence = j && j.confidence != null ? j.confidence : '';

    return [
      date,
      t.pair || '',
      t.direction || '',
      t.entry_price != null ? t.entry_price : '',
      t.exit_price != null ? t.exit_price : '',
      t.stop_loss != null ? t.stop_loss : '',
      t.take_profit != null ? t.take_profit : '',
      t.lot_size != null ? t.lot_size : '',
      t.pnl != null ? t.pnl : '',
      t.r_multiple != null ? t.r_multiple : '',
      t.setup || '',
      t.timeframe || '',
      t.session || '',
      confidence,
      emotions,
      note,
    ];
  });

  // Escape CSV fields (handle commas, quotes, newlines)
  function escapeField(val) {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  const csvLines = [headers.map(escapeField).join(',')];
  rows.forEach((row) => {
    csvLines.push(row.map(escapeField).join(','));
  });
  const csv = csvLines.join('\n');

  const today = new Date().toISOString().slice(0, 10);
  const filename = 'propjournal-trades-' + today + '.csv';

  return { csv, filename, count: list.length };
}
