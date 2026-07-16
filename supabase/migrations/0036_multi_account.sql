-- Multi-account support for Elite users
-- The accounts table from 0001_init.sql was never applied to production,
-- so we CREATE it here with both the original columns and new prop-firm columns.

-- 1. Create accounts table (original schema + prop-firm columns)
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Original broker-sync columns (dormant, for future MetaApi integration)
  broker text,
  server text,
  metaapi_id text,
  balance numeric,
  equity numeric,
  currency text DEFAULT 'USD',
  -- New prop-firm columns
  name text NOT NULL DEFAULT 'Account 1',
  prop_firm text,
  account_size numeric,
  phase text CHECK (phase IN ('challenge', 'funded', 'payout')),
  status text DEFAULT 'active',
  color text DEFAULT '#a78bfa',
  starting_balance numeric,
  is_archived boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. RLS: each user can only see/manage their own accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own accounts" ON public.accounts;
CREATE POLICY "own accounts" ON public.accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Add account_id FK to trades (may not exist if 0001_init was partial)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trades' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE public.trades
      ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Add active_account_id to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS active_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON public.trades(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_archived ON public.accounts(user_id, is_archived);

-- 6. Notify PostgREST to reload schema cache (prevents schema cache crash — bug #1)
NOTIFY pgrst, 'reload schema';
