-- Preserve follow status independently for every selected trade setup. Safe to re-run.
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS setup_follow_map jsonb NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
