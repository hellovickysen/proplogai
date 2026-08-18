-- Staging-only compatibility for whole-profile backup and restore.
-- Apply only to PropLogAI staging floggzxiitesfpkptwqc, after 20260818_profile_backups.sql.
-- The isolated staging bootstrap intentionally omitted these user-owned product tables.

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_name text not null,
  account_type text check (account_type in ('futures', 'cfd')),
  account_size text,
  purchase_type text check (purchase_type in ('new', 'renewal', 'activation')),
  account_cost numeric,
  num_accounts integer default 1,
  total_cost numeric not null,
  expense_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_name text not null,
  amount numeric not null,
  payout_date date default current_date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.trophies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text check (category in ('payout', 'challenge_pass', 'funded', 'other')),
  description text,
  file_url text not null,
  is_public boolean default false,
  share_id text unique,
  firm_name text,
  trophy_date date,
  created_at timestamptz default now()
);

alter table public.trophies
  add column if not exists firm_name text,
  add column if not exists trophy_date date;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_custom boolean default true,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  completed boolean default false,
  created_at timestamptz default now(),
  unique(habit_id, log_date)
);

alter table public.accounts
  add column if not exists is_primary boolean not null default false;

alter table public.trades
  add column if not exists setup_follow_map jsonb not null default '{}'::jsonb;

create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_user_firm on public.expenses(user_id, firm_name);
create index if not exists idx_payouts_user_id on public.payouts(user_id);
create index if not exists idx_trophies_user_id on public.trophies(user_id);
create index if not exists idx_trophies_share_id on public.trophies(share_id);
create index if not exists idx_habits_user on public.habits(user_id);
create index if not exists idx_habit_logs_user on public.habit_logs(user_id);
create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, log_date);

alter table public.expenses enable row level security;
alter table public.payouts enable row level security;
alter table public.trophies enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_own') THEN
    CREATE POLICY "expenses_own" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payouts' AND policyname = 'payouts_own') THEN
    CREATE POLICY "payouts_own" ON public.payouts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trophies' AND policyname = 'trophies_own') THEN
    CREATE POLICY "trophies_own" ON public.trophies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habits' AND policyname = 'habits_own') THEN
    CREATE POLICY "habits_own" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'habit_logs' AND policyname = 'habit_logs_own') THEN
    CREATE POLICY "habit_logs_own" ON public.habit_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

notify pgrst, 'reload schema';
