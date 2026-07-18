-- Migration 0044: global discount settings (admin-editable)
-- Stores the partner (trial) rate and the post-trial default rate, each with
-- its Razorpay UPI offer id, in the existing site_settings key/value table.
-- Admin edits these at /admin/discounts. Sitewide/occasion codes stay in
-- promo_codes. Idempotent.

insert into site_settings (key, value) values
  ('partner_trial_pct', '30'),
  ('partner_trial_offer_id_upi', ''),
  ('default_pct', '15'),
  ('default_offer_id_upi', '')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
