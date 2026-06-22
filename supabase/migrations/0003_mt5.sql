-- PipMind Phase 2: MT5 auto-sync (MetaApi)
alter table public.trades add column if not exists external_id text;
alter table public.trades add column if not exists source text default 'manual';

-- Unique per user+external_id (NULLs are distinct, so manual trades are unaffected).
create unique index if not exists trades_user_external_unique on public.trades (user_id, external_id);

alter table public.accounts add column if not exists region text;
alter table public.accounts add column if not exists login text;
alter table public.accounts add column if not exists name text;
alter table public.accounts add column if not exists status text default 'connected';
alter table public.accounts add column if not exists last_synced_at timestamptz;
