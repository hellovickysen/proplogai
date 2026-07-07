-- Add "Bad SL" default setup for all existing users who have "Good SL" but not "Bad SL"
-- Idempotent: only inserts if Bad SL doesn't already exist for the user

INSERT INTO setups (user_id, name, direction, is_default, is_active, sort_order)
SELECT
  s.user_id,
  'Bad SL',
  'You broke your own stop loss rule — moved it, widened it, or ignored it entirely. This is a risk management violation. Every time you select this, ask yourself: was the extra risk worth it? Your stop loss exists to protect your account.',
  false,
  true,
  8
FROM setups s
WHERE s.name = 'Good SL'
  AND NOT EXISTS (
    SELECT 1 FROM setups s2
    WHERE s2.user_id = s.user_id AND s2.name = 'Bad SL'
  );
