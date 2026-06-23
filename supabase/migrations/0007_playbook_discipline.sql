-- 0007_playbook_discipline.sql
-- Phase 6: Playbook Discipline — setups as first-class rules with discipline tracking

-- 1. Create setups table
create table if not exists setups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  direction text,
  description text,
  is_default boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add playbook discipline columns to trades
alter table trades
  add column if not exists setup_id uuid references setups(id) on delete set null,
  add column if not exists setup_followed text check (setup_followed in ('yes', 'partial', 'no')),
  add column if not exists no_setup_reason text;

-- 3. RLS for setups (same pattern as other tables)
alter table setups enable row level security;

create policy "Users can view own setups"
  on setups for select
  using (auth.uid() = user_id);

create policy "Users can insert own setups"
  on setups for insert
  with check (auth.uid() = user_id);

create policy "Users can update own setups"
  on setups for update
  using (auth.uid() = user_id);

create policy "Users can delete own setups"
  on setups for delete
  using (auth.uid() = user_id);

-- 4. Indexes
create index if not exists idx_setups_user_id on setups(user_id);
create index if not exists idx_setups_user_active on setups(user_id, is_active);
create index if not exists idx_trades_setup_id on trades(setup_id);
