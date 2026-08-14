-- 10-trade discipline challenges. Safe to re-run (idempotent).
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  rule_key text not null,
  label text not null,
  target integer not null default 10,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  start_trade_date date,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_challenges_user_status on public.challenges (user_id, status);
create unique index if not exists idx_challenges_one_active on public.challenges (user_id) where status = 'active';

alter table public.challenges enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'challenges' AND policyname = 'own challenges'
  ) THEN
    CREATE POLICY "own challenges" ON public.challenges
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
