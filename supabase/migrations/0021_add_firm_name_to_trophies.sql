-- Add firm_name column to trophies table to link trophies to prop firms
ALTER TABLE trophies ADD COLUMN firm_name text;

-- Index for filtering trophies by firm name
CREATE INDEX IF NOT EXISTS idx_trophies_firm_name ON trophies (user_id, firm_name);
