-- Persist a user's selected trades as favorites. Safe to re-run.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS trades_user_favorite_idx
  ON public.trades (user_id, is_favorite)
  WHERE is_favorite = true;

NOTIFY pgrst, 'reload schema';
