-- 0041_promo_code_upi_offer.sql
-- Support per-method Razorpay offers on promo codes.
-- The existing razorpay_offer_id column is treated as the CARD offer;
-- this adds a separate UPI offer so one code can discount on both methods.
-- Idempotent.

alter table promo_codes add column if not exists razorpay_offer_id_upi text;

notify pgrst, 'reload schema';
