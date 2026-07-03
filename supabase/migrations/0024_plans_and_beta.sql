-- Migration 0024: Plan system foundation
-- Adds is_beta flag to user_preferences and updates subscriptions plan values

-- 1. Add is_beta column (default true so all existing users keep full access)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS is_beta boolean DEFAULT true;

-- 2. Update existing subscriptions: rename 'free' → 'basic', 'pro' → 'elite'
UPDATE subscriptions SET plan = 'basic' WHERE plan = 'free';
UPDATE subscriptions SET plan = 'elite' WHERE plan = 'pro';

-- 3. Drop old check constraint if it exists and add new one
-- Note: constraint name may vary — use DO block for safety
DO $$
BEGIN
  -- Try to drop any existing check constraint on plan column
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('basic', 'elite', 'free', 'pro'));
-- Keeping 'free' and 'pro' for backward compatibility during transition
