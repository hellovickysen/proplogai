-- Migration: Add trophy_date column to trophies table
-- Allows users to set a custom date for their trophies (defaults to created_at)

ALTER TABLE trophies ADD COLUMN IF NOT EXISTS trophy_date date;

-- Backfill existing trophies with their created_at date
UPDATE trophies SET trophy_date = created_at::date WHERE trophy_date IS NULL;
