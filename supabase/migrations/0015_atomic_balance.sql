-- 0015_atomic_balance.sql
-- Atomic referral balance increment to prevent race conditions

create or replace function increment_referral_balance(target_user_id uuid, amount numeric)
returns void
language sql
security definer
as $$
  update user_preferences
  set referral_balance = coalesce(referral_balance, 0) + amount
  where user_id = target_user_id;
$$;
