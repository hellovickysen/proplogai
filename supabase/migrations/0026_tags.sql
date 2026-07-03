-- Migration 0026: Add tags to journal entries and custom_tags to user preferences
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS custom_tags text[] DEFAULT '{}';
