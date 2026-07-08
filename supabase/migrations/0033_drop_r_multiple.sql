-- Migration 0033: Drop r_multiple column from trades table
-- R-multiple has been fully removed from the codebase.
-- Run this AFTER deploying the code that removes all r_multiple references.

ALTER TABLE trades DROP COLUMN IF EXISTS r_multiple;
