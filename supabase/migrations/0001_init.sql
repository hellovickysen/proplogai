-- PropLogAI initial schema (Sprint 1)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
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
  created_at timestamptz default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  pair text not null,
  direction text check (direction in ('long','short')),
  entry_price numeric,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  lot_size numeric,
  pnl numeric,
  r_multiple numeric,
  setup text,
  timeframe text,
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  note text,
  emotions text[],
  confidence int,
  screenshot_url text,
  created_at timestamptz default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete cascade,
  type text,
  summary text,
  mistakes jsonb,
  severity int,
  created_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text default 'free',
  status text default 'active',
  stripe_id text,
  renews_at timestamptz,
  created_at timestamptz default now()
);

-- Row level security: each user can only see and manage their own rows.
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;
alter table public.ai_insights enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own trades" on public.trades;
create policy "own trades" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own journal" on public.journal_entries;
create policy "own journal" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own insights" on public.ai_insights;
create policy "own insights" on public.ai_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own subscriptions" on public.subscriptions;
create policy "own subscriptions" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create a profile + free subscription when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
