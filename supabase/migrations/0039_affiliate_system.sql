-- 0039_affiliate_system.sql
-- PropLogAI Affiliate Program — Phase 1 (MVP)
-- Separate from the existing user-to-user referral system (referral_codes / referrals).
-- All tables namespaced affiliate_*. Idempotent. Writes go through service role;
-- RLS grants SELECT-own only. Ends with a PostgREST schema reload.

/* ─── affiliates ───────────────────────────────────────────── */
create table if not exists affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  email text,
  social_links text,
  audience_size text,
  referral_username text,
  commission_rate numeric not null default 0.40 check (commission_rate >= 0 and commission_rate <= 0.60),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  created_at timestamptz default now(),
  approved_at timestamptz,
  updated_at timestamptz default now()
);
-- Unique referral username (only when set)
create unique index if not exists idx_affiliates_username
  on affiliates (lower(referral_username)) where referral_username is not null;
create index if not exists idx_affiliates_user on affiliates(user_id);
create index if not exists idx_affiliates_status on affiliates(status);

/* ─── affiliate_coupons (one per affiliate, tracking only) ──── */
create table if not exists affiliate_coupons (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null unique references affiliates(id) on delete cascade,
  code text not null,
  last_edited_at timestamptz default now(),
  created_at timestamptz default now()
);
create unique index if not exists idx_affiliate_coupons_code on affiliate_coupons (upper(code));

/* ─── affiliate_referral_clicks ────────────────────────────── */
create table if not exists affiliate_referral_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  source text default 'link',
  ip_hash text,
  ua text,
  created_at timestamptz default now()
);
create index if not exists idx_aff_clicks_affiliate on affiliate_referral_clicks(affiliate_id);

/* ─── affiliate_referrals (referred user ↔ affiliate) ──────── */
create table if not exists affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  source text default 'link',
  subscription_id uuid,
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz default now()
);
create index if not exists idx_aff_referrals_affiliate on affiliate_referrals(affiliate_id);
create index if not exists idx_aff_referrals_user on affiliate_referrals(referred_user_id);

/* ─── affiliate_commissions ────────────────────────────────── */
create table if not exists affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  referred_user_id uuid,
  subscription_id uuid,
  razorpay_payment_id text,
  cycle text default 'monthly',
  amount numeric not null default 0,
  currency text default 'USD',
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')),
  created_at timestamptz default now()
);
create index if not exists idx_aff_commissions_affiliate on affiliate_commissions(affiliate_id);
create index if not exists idx_aff_commissions_status on affiliate_commissions(status);
-- Idempotency: one commission per Razorpay payment
create unique index if not exists idx_aff_commissions_payment
  on affiliate_commissions (razorpay_payment_id) where razorpay_payment_id is not null;

/* ─── affiliate_payout_requests ────────────────────────────── */
create table if not exists affiliate_payout_requests (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  amount numeric not null default 0,
  method text,
  note text,
  status text not null default 'requested' check (status in ('requested','approved','rejected','paid')),
  created_at timestamptz default now(),
  processed_at timestamptz
);
create index if not exists idx_aff_payouts_affiliate on affiliate_payout_requests(affiliate_id);
create index if not exists idx_aff_payouts_status on affiliate_payout_requests(status);

/* ─── RLS: SELECT-own only. All writes via service role. ───── */
alter table affiliates enable row level security;
alter table affiliate_coupons enable row level security;
alter table affiliate_referral_clicks enable row level security;
alter table affiliate_referrals enable row level security;
alter table affiliate_commissions enable row level security;
alter table affiliate_payout_requests enable row level security;

drop policy if exists "aff_select_own" on affiliates;
create policy "aff_select_own" on affiliates
  for select using (auth.uid() = user_id);

drop policy if exists "aff_coupons_select_own" on affiliate_coupons;
create policy "aff_coupons_select_own" on affiliate_coupons
  for select using (affiliate_id in (select id from affiliates where user_id = auth.uid()));

drop policy if exists "aff_clicks_select_own" on affiliate_referral_clicks;
create policy "aff_clicks_select_own" on affiliate_referral_clicks
  for select using (affiliate_id in (select id from affiliates where user_id = auth.uid()));

drop policy if exists "aff_referrals_select_own" on affiliate_referrals;
create policy "aff_referrals_select_own" on affiliate_referrals
  for select using (affiliate_id in (select id from affiliates where user_id = auth.uid()));

drop policy if exists "aff_commissions_select_own" on affiliate_commissions;
create policy "aff_commissions_select_own" on affiliate_commissions
  for select using (affiliate_id in (select id from affiliates where user_id = auth.uid()));

drop policy if exists "aff_payouts_select_own" on affiliate_payout_requests;
create policy "aff_payouts_select_own" on affiliate_payout_requests
  for select using (affiliate_id in (select id from affiliates where user_id = auth.uid()));

/* ─── Defense-in-depth: block self-approval / self-rate-change ─
   Regular users have auth.uid() set; service role has auth.uid() = NULL.
   If a regular user somehow writes, force status back to 'pending' and
   commission_rate back to the 0.40 default. Service role is unaffected. */
create or replace function protect_affiliate_privileged_fields()
returns trigger as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.commission_rate := 0.40;
    elsif tg_op = 'UPDATE' then
      if new.status is distinct from old.status then
        new.status := old.status;
      end if;
      if new.commission_rate is distinct from old.commission_rate then
        new.commission_rate := old.commission_rate;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_affiliate_privileged_fields_trigger on affiliates;
create trigger protect_affiliate_privileged_fields_trigger
  before insert or update on affiliates
  for each row execute function protect_affiliate_privileged_fields();

notify pgrst, 'reload schema';
