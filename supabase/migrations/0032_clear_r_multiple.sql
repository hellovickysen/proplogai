-- Migration 0032: Clear all r_multiple values from trades
-- R-multiple has been removed from the UI; this clears stale stored values.
-- Column is kept for backward compatibility but all values set to NULL.

UPDATE trades SET r_multiple = NULL WHERE r_multiple IS NOT NULL;
