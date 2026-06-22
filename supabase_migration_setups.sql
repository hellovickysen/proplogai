-- Add custom_setups to user_preferences
-- Run in Supabase Dashboard → SQL Editor → New query → paste → Run

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS custom_setups text[] DEFAULT '{}';

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'user_preferences' AND table_schema = 'public'
ORDER BY ordinal_position;
