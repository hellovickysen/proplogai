-- Migration 0034: Re-add r_multiple column (empty, not displayed anywhere)
-- PostgREST schema cache crashes on select('*') after column drop.
-- Adding it back as a nullable column fixes all runtime errors.
-- The column is not used in UI, AI context, or exports — purely for query compatibility.

ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple numeric;
