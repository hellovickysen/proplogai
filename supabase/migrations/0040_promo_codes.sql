-- 0040_promo_codes.sql
-- Admin-managed promotional codes for occasion discounts (e.g. DIWALI50).
-- Each code maps to a Razorpay subscription Offer (created in the Razorpay
-- Dashboard; its offer_id is pasted here). Store-wide, NO partner commission.
-- Distinct from affiliate_coupons (partner codes that carry commission).
-- Idempotent. Writes go through the service role; RLS grants no anon access.

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text,
  discount_pct numeric not null default 0 check (discount_pct >= 0 and discount_pct <= 100),
  razorpay_offer_id text,
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Case-insensitive unique code
create unique index if not exists idx_promo_codes_code on promo_codes (upper(code));
create index if not exists idx_promo_codes_active on promo_codes (active);

-- RLS on; all access via service role (admin actions + checkout resolution).
alter table promo_codes enable row level security;

notify pgrst, 'reload schema';
