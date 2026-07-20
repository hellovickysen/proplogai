-- Migration 0045: charge-now conversions + additive-stacking discounts
-- Adds an in-trial UPI offer id to promo codes (charged when a promo is used
-- during the trial = base% + trial-auto%), and seeds the site_settings slots
-- for the partner rate, the trial auto-bonus, and their per-scenario UPI offers.
-- Idempotent: safe to re-run.

alter table public.promo_codes add column if not exists razorpay_offer_id_upi_trial text;

insert into site_settings (key, value) values
  ('partner_pct', '30'),
  ('trial_auto_pct', '10'),
  ('partner_offer_upi', ''),
  ('partner_trial_offer_upi', ''),
  ('trial_auto_offer_upi', '')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
