-- 0042_affiliate_payout_method.sql
-- Let partners save a default payout method on their profile (Settings).
-- Idempotent.

alter table affiliates add column if not exists payout_method text;

notify pgrst, 'reload schema';
