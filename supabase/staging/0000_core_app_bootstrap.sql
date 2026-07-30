-- PropLogAI staging-only core compatibility bootstrap.
--
-- Purpose: make the isolated staging project usable for authenticated onboarding,
-- dashboard layout, Rulebook, and text-only trade logging before discipline-system
-- migrations are introduced. This file is NOT a production migration and must never
-- be executed against production. It intentionally replaces unsafe historical replay
-- of superseded migration files.
--
-- Source of truth checked against production on 2026-07-30:
-- accounts, subscriptions, user_preferences, trades, journal_entries, ai_insights,
-- setups, notifications, and site_settings current columns.

create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  stripe_id text,
  renews_at timestamptz,
  created_at timestamptz default now(),
  razorpay_subscription_id text,
  razorpay_payment_id text,
  billing_cycle text default 'monthly',
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  last_payment_id text,
  last_payment_at timestamptz,
  constraint subscriptions_status_check check (status in ('active', 'created', 'authenticated', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'paused')),
  constraint subscriptions_plan_check check (plan in ('basic', 'elite', 'free', 'pro'))
);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  avatar_url text,
  custom_emotions text[] default '{}',
  default_confidence integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  onboarding_complete boolean default false,
  custom_setups text[] default '{}',
  share_code text,
  show_calendar boolean default false,
  show_payouts boolean default false,
  show_trophies boolean default false,
  calendar_mode text,
  calendar_start date,
  calendar_end date,
  calendar_rolling_days integer,
  show_trades boolean default false,
  referral_balance numeric default 0,
  referred_by text,
  full_name text,
  is_beta boolean default false,
  custom_tags text[] default '{}',
  active_account_id uuid,
  is_admin boolean default false
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  broker text,
  server text,
  metaapi_id text,
  balance numeric,
  equity numeric,
  currency text default 'USD',
  name text not null default 'Account 1',
  prop_firm text,
  account_size numeric,
  phase text check (phase in ('challenge', 'funded', 'payout')),
  status text default 'active',
  color text default '#a78bfa',
  starting_balance numeric,
  is_archived boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_preferences_active_account_id_fkey'
  ) then
    alter table public.user_preferences
      add constraint user_preferences_active_account_id_fkey
      foreign key (active_account_id) references public.accounts(id) on delete set null;
  end if;
end;
$$;

create table if not exists public.setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  direction text,
  description text,
  is_default boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  reference_images jsonb default '[]'::jsonb
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  pair text not null,
  direction text check (direction in ('long', 'short')),
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  lot_size numeric,
  pnl numeric,
  setup text,
  timeframe text,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  external_id text,
  source text,
  session text,
  trade_date date,
  setup_id uuid references public.setups(id) on delete set null,
  setup_followed text check (setup_followed in ('yes', 'partial', 'no')),
  no_setup_reason text,
  setup_ids jsonb default '[]'::jsonb,
  share_id uuid,
  shared_until timestamptz,
  r_multiple numeric,
  is_favorite boolean not null default false
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  note text,
  emotions text[] default '{}',
  confidence integer,
  screenshot_url text,
  created_at timestamptz default now(),
  screenshot_urls jsonb default '[]'::jsonb,
  lesson text,
  tags text[] default '{}'
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  type text,
  summary text,
  mistakes jsonb,
  severity integer,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  is_read boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

create index if not exists idx_accounts_user_id_archived on public.accounts(user_id, is_archived);
create index if not exists idx_trades_user_trade_date on public.trades(user_id, trade_date desc, created_at desc);
create index if not exists idx_trades_account_id on public.trades(account_id);
create index if not exists idx_setups_user_active on public.setups(user_id, is_active);
create index if not exists idx_journal_entries_user_trade on public.journal_entries(user_id, trade_id);
create index if not exists idx_ai_insights_user_trade on public.ai_insights(user_id, trade_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_subscriptions_razorpay_sub_id on public.subscriptions(razorpay_subscription_id) where razorpay_subscription_id is not null;

alter table public.subscriptions enable row level security;
alter table public.user_preferences enable row level security;
alter table public.accounts enable row level security;
alter table public.setups enable row level security;
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;
alter table public.ai_insights enable row level security;
alter table public.notifications enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
drop policy if exists "preferences_manage_own" on public.user_preferences;
drop policy if exists "accounts_manage_own" on public.accounts;
drop policy if exists "setups_manage_own" on public.setups;
drop policy if exists "trades_manage_own" on public.trades;
drop policy if exists "journal_manage_own" on public.journal_entries;
drop policy if exists "insights_manage_own" on public.ai_insights;
drop policy if exists "notifications_manage_own" on public.notifications;

create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "preferences_manage_own" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "accounts_manage_own" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "setups_manage_own" on public.setups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trades_manage_own" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journal_manage_own" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insights_manage_own" on public.ai_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_manage_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'active', now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

notify pgrst, 'reload schema';
