-- Migration 0032: Add reference images to setups
-- Allows traders to attach chart screenshots showing what each setup looks like

ALTER TABLE setups ADD COLUMN IF NOT EXISTS reference_images jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN setups.reference_images IS 'Array of Supabase Storage URLs for setup reference chart images';
