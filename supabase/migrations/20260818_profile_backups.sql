-- Versioned whole-profile backups. Apply only to PropLogAI staging floggzxiitesfpkptwqc.
-- Additive and idempotent. OAuth tokens are encrypted in the application before storage.

create table if not exists public.backup_drive_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text not null default 'google_drive' check (provider = 'google_drive'),
  status text not null default 'connected' check (status in ('connected', 'revoked', 'error')),
  token_ciphertext text not null,
  token_iv text not null,
  token_tag text not null,
  token_expires_at timestamptz,
  provider_email text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.backup_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination text not null check (destination in ('local_download', 'google_drive')),
  trigger_source text not null default 'manual' check (trigger_source in ('manual', 'scheduled')),
  status text not null check (status in ('queued', 'completed', 'failed')),
  archive_version integer not null default 1,
  bytes bigint,
  record_count integer,
  provider_file_id text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.backup_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  archive_version integer not null,
  status text not null check (status in ('completed', 'completed_with_conflicts', 'failed')),
  inserted_count integer not null default 0,
  skipped_count integer not null default 0,
  conflict_count integer not null default 0,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.backup_import_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_table text not null,
  source_id uuid not null,
  destination_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, source_table, source_id)
);

create table if not exists public.backup_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_backup_runs_user_completed
  on public.backup_runs(user_id, completed_at desc);
create index if not exists idx_backup_runs_drive_retention
  on public.backup_runs(user_id, destination, completed_at desc)
  where destination = 'google_drive' and status = 'completed';
create index if not exists idx_backup_imports_user_created
  on public.backup_imports(user_id, created_at desc);
create index if not exists idx_backup_oauth_states_expiry
  on public.backup_oauth_states(expires_at);

alter table public.backup_drive_connections enable row level security;
alter table public.backup_runs enable row level security;
alter table public.backup_imports enable row level security;
alter table public.backup_import_mappings enable row level security;
alter table public.backup_oauth_states enable row level security;

drop policy if exists "backup_drive_connections_own" on public.backup_drive_connections;
drop policy if exists "backup_runs_own" on public.backup_runs;
drop policy if exists "backup_imports_own" on public.backup_imports;
drop policy if exists "backup_import_mappings_own" on public.backup_import_mappings;
drop policy if exists "backup_oauth_states_own" on public.backup_oauth_states;

create policy "backup_drive_connections_own" on public.backup_drive_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "backup_runs_own" on public.backup_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "backup_imports_own" on public.backup_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "backup_import_mappings_own" on public.backup_import_mappings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "backup_oauth_states_own" on public.backup_oauth_states
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
