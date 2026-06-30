-- Add full_name column to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS full_name text;
