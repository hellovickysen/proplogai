-- Migration 0018: Prop firm profiles for logos and display customization
create table if not exists firm_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_name text not null,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, firm_name)
);

alter table firm_profiles enable row level security;

create policy "Users can read own firm profiles"
  on firm_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own firm profiles"
  on firm_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own firm profiles"
  on firm_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete own firm profiles"
  on firm_profiles for delete
  using (auth.uid() = user_id);
