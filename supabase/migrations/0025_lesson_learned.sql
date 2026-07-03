-- Migration 0025: Add lesson_learned column to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS lesson text;
