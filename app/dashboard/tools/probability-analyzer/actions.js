'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Map PropLogAI direction values to MT4-compatible buy/sell.
 */
function normalizeDirection(dir) {
  if (!dir) return 'buy';
  const d = String(dir).toLowerCase().trim();
  if (d === 'long' || d === 'buy') return 'buy';
  if (d === 'short' || d === 'sell') return 'sell';
  return 'buy';
}

/**
 * Fetch user's trades from PropLogAI journal and convert to CSV format
 * for the probability engine.
 */
export async function fetchJournalTrades(userId) {
  if (!userId) return { error: 'Not authenticated.' };

  try {
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
      // Clean pair name — remove slashes, ensure no commas
      const symbol = (t.pair || 'UNKNOWN').replace(/[\/,]/g, '');

      // Normalize direction: long→buy, short→sell
      const direction = normalizeDirection(t.direction);

      // Handle dates — use trade_date as fallback for both open and close
      const openTime = t.trade_date || t.created_at || '';
      const closeTime = t.closed_at || t.trade_date || t.created_at || '';

      // Ensure numeric values are actual numbers (not null/undefined)
      const entryPrice = Number(t.entry_price) || 0;
      const exitPrice = Number(t.exit_price) || 0;
      const stopLoss = Number(t.stop_loss) || 0;
      const takeProfit = Number(t.take_profit) || 0;
      const lotSize = Number(t.lot_size) || 0.01;
      const pnl = Number(t.pnl) || 0;

      lines.push(`${i + 1},${openTime},${closeTime},${direction},${lotSize},${symbol},${entryPrice},${exitPrice},${stopLoss},${takeProfit},0,0,${pnl}`);
    });

    return { csv: lines.join('\n'), tradeCount: trades.length };
  } catch (err) {
    console.error('[fetchJournalTrades] Error:', err);
    return { error: 'Failed to fetch trades: ' + (err.message || 'Unknown error') };
  }
}

/**
 * Convert a tool_lead to "converted" when user signs up or logs in.
 */
export async function convertLead(email) {
  if (!email) return;

  try {
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
  } catch (err) {
    console.error('[convertLead] Error:', err);
  }
}
