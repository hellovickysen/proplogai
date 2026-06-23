-- Performance indexes
-- Run in Supabase Dashboard -> SQL Editor

-- Primary index: speeds up all trade queries (dashboard, calendar, trades list)
-- Most queries filter by user_id (via RLS) and sort by trade_date
CREATE INDEX IF NOT EXISTS idx_trades_user_date
  ON trades(user_id, trade_date DESC NULLS LAST);

-- Secondary index: speeds up journal_entries lookup by trade_id
-- Used on calendar, trades list, and trade detail pages
CREATE INDEX IF NOT EXISTS idx_journal_entries_trade_id
  ON journal_entries(trade_id);

-- Secondary index: speeds up ai_insights lookup by trade_id + type
-- Used on trade detail page and coach report
CREATE INDEX IF NOT EXISTS idx_ai_insights_trade_type
  ON ai_insights(trade_id, type);
