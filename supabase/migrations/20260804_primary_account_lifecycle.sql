-- Primary account lifecycle: safe to re-run.
-- 1. Add a durable primary-account marker so Account 1 can be renamed safely.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Prefer an existing Account 1 as the primary account, preferring an active one.
UPDATE public.accounts a
SET is_primary = true
WHERE a.id IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.accounts
  WHERE lower(trim(name)) = 'account 1'
  ORDER BY user_id, is_archived ASC, created_at ASC
);

-- Create Account 1 only for users who do not already have a primary account.
INSERT INTO public.accounts (user_id, name, color, sort_order, is_primary)
SELECT u.id, 'Account 1', '#a78bfa', 0, true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.accounts a
  WHERE a.user_id = u.id
    AND a.is_primary = true
);

-- 2. Move legacy unassigned trades into each user's active primary account.
UPDATE public.trades t
SET account_id = a.id
FROM public.accounts a
WHERE t.user_id = a.user_id
  AND t.account_id IS NULL
  AND a.is_primary = true
  AND COALESCE(a.is_archived, false) = false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_one_primary_per_user
  ON public.accounts (user_id)
  WHERE is_primary = true;

-- 3. Prevent duplicate account names for the same user, including archived accounts.
CREATE OR REPLACE FUNCTION public.prevent_duplicate_account_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.accounts a
    WHERE a.user_id = NEW.user_id
      AND a.id IS DISTINCT FROM NEW.id
      AND lower(trim(a.name)) = lower(trim(NEW.name))
  ) THEN
    RAISE EXCEPTION 'An account named "%" already exists, including archived accounts.', NEW.name
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_account_name ON public.accounts;
CREATE TRIGGER trg_prevent_duplicate_account_name
  BEFORE INSERT OR UPDATE OF name, user_id ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_duplicate_account_name();

-- 4. Give future users a renameable Account 1 at signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (new.id, 'free', 'active', now() + interval '14 days');

  INSERT INTO public.accounts (user_id, name, color, sort_order, is_primary)
  VALUES (new.id, 'Account 1', '#a78bfa', 0, true);

  RETURN new;
END;
$$;

-- 5. Archived-account trades are hidden from every authenticated active view.
-- Anonymous shared-trade access remains governed by its existing public policy.
DROP POLICY IF EXISTS "own trades" ON public.trades;
DROP POLICY IF EXISTS "own active trades" ON public.trades;
CREATE POLICY "own active trades" ON public.trades
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    AND (
      account_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.accounts a
        WHERE a.id = trades.account_id
          AND a.user_id = auth.uid()
          AND COALESCE(a.is_archived, false) = false
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (
      account_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.accounts a
        WHERE a.id = trades.account_id
          AND a.user_id = auth.uid()
          AND COALESCE(a.is_archived, false) = false
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_trades_user_account_trade_date
  ON public.trades (user_id, account_id, trade_date DESC, created_at DESC);

NOTIFY pgrst, 'reload schema';
