-- Sprint 6 migration: add onboarding_complete to user_preferences
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences' AND table_schema = 'public'
ORDER BY ordinal_position;
