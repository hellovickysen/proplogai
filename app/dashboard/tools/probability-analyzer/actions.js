'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Fetch user's trades from PropLogAI journal and convert to CSV format
 * for the probability engine.
 */
export async function fetchJournalTrades(userId) {
  if (!userId) return { error: 'Not authenticated.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { error: 'Unauthorized.' };

  const { data: trades, error } = await supabase
    .from('trades')
    .select('id, pair, direction, pnl, entry_price, exit_price, stop_loss, take_profit, lot_size, trade_date, closed_at, created_at')
    .eq('user_id', userId)
    .order('trade_date', { ascending: true });

  if (error) return { error: error.message };
  if (!trades || trades.length < 10) {
    return { error: `Only ${trades?.length || 0} trades found. Minimum 10 required.` };
  }

  // Build CSV string matching MT4 format so the parser can handle it
  const lines = ['Ticket,Open Time,Close Time,Type,Volume,Symbol,Open Price,Close Price,S/L,T/P,Commission,Swap,Profit'];
  trades.forEach((t, i) => {
    lines.push([
      t.id || i + 1,
      t.trade_date || t.created_at || '',
      t.closed_at || t.trade_date || '',
      (t.direction || 'buy').toLowerCase(),
      t.lot_size || 0.01,
      (t.pair || 'UNKNOWN').replace(/\//g, ''),
      t.entry_price || 0,
      t.exit_price || 0,
      t.stop_loss || 0,
      t.take_profit || 0,
      0, // commission
      0, // swap
      t.pnl || 0,
    ].join(','));
  });

  return { csv: lines.join('\n'), tradeCount: trades.length };
}

/**
 * Convert a tool_lead to "converted" when user signs up or logs in.
 */
export async function convertLead(email) {
  if (!email) return;

  const supabase = await createClient();
  // Use service role for this operation since tool_leads has no user RLS
  const { createClient: createAdmin } = await import('@supabase/supabase-js');
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  await admin
    .from('tool_leads')
    .update({ converted: true, converted_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())
    .eq('verified', true);
}
