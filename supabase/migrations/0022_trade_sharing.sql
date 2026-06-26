-- Migration 0022: Trade sharing with 24h auto-expiry
-- Add share_id and shared_until columns to trades table

ALTER TABLE trades ADD COLUMN IF NOT EXISTS share_id uuid UNIQUE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS shared_until timestamptz;

-- Index for fast share_id lookups
CREATE INDEX IF NOT EXISTS idx_trades_share_id ON trades (share_id) WHERE share_id IS NOT NULL;

-- RLS: public (anon) can view shared trades within expiry window
CREATE POLICY "Public can view shared trades" ON trades
  FOR SELECT TO anon
  USING (share_id IS NOT NULL AND shared_until > now());

-- RLS: public can read journal entries for shared trades
CREATE POLICY "Public can view journals for shared trades" ON journal_entries
  FOR SELECT TO anon
  USING (
    trade_id IN (SELECT id FROM trades WHERE share_id IS NOT NULL AND shared_until > now())
  );

-- RLS: public can read AI insights for shared trades
CREATE POLICY "Public can view insights for shared trades" ON ai_insights
  FOR SELECT TO anon
  USING (
    trade_id IN (SELECT id FROM trades WHERE share_id IS NOT NULL AND shared_until > now())
  );

-- RLS: public can view setup names for shared trades
CREATE POLICY "Public can view setups for shared trades" ON setups
  FOR SELECT TO anon
  USING (
    user_id IN (SELECT user_id FROM trades WHERE share_id IS NOT NULL AND shared_until > now())
  );
