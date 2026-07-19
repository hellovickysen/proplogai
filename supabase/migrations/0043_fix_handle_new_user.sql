-- 0043_fix_handle_new_user.sql
-- Remove dead profiles insert from handle_new_user trigger.
-- The profiles table was dropped in 0004_cleanup_profiles.sql but
-- the function kept reverting because this fix was never in a migration.
-- Idempotent: safe to re-run.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (new.id, 'free', 'active', now() + interval '14 days');
  RETURN new;
END;
$$;
