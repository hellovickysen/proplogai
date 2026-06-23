-- 0010_trophy_wall.sql
-- Phase 7C: Trophy Wall — upload and share trading achievement certificates

create table if not exists trophies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text check (category in ('payout', 'challenge_pass', 'funded', 'other')),
  description text,
  file_url text not null,
  is_public boolean default false,
  share_id text unique,
  created_at timestamptz default now()
);

-- RLS
alter table trophies enable row level security;

create policy "Users can view own trophies"
  on trophies for select using (auth.uid() = user_id);

create policy "Anyone can view public trophies"
  on trophies for select using (is_public = true);

create policy "Users can insert own trophies"
  on trophies for insert with check (auth.uid() = user_id);

create policy "Users can update own trophies"
  on trophies for update using (auth.uid() = user_id);

create policy "Users can delete own trophies"
  on trophies for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_trophies_user_id on trophies(user_id);
create index if not exists idx_trophies_share_id on trophies(share_id);
