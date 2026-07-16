-- Multi-account support for Elite users
-- Repurposes the dormant accounts table (from 0001_init.sql) with prop-firm columns.
-- Existing columns (broker, server, metaapi_id, balance, equity, currency) are left for future broker sync.
-- trades.account_id FK already exists from 0001_init.sql.

-- Add prop-firm columns to accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Account 1',
  ADD COLUMN IF NOT EXISTS prop_firm text,
  ADD COLUMN IF NOT EXISTS account_size numeric,
  ADD COLUMN IF NOT EXISTS phase text CHECK (phase IN ('challenge', 'funded', 'payout')),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#a78bfa',
  ADD COLUMN IF NOT EXISTS starting_balance numeric,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- Add active_account_id to user_preferences for remembering last selection
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS active_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Index on trades.account_id for filtered queries
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(account_id);

-- Index on accounts for user lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_archived ON public.accounts(user_id, is_archived);

-- Notify PostgREST to reload schema cache (prevents schema cache crash — bug #1)
NOTIFY pgrst, 'reload schema';
