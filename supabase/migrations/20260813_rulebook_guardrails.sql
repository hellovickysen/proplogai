-- Personal Rulebook guardrails: user-owned, idempotent, and safe to replay.

create table if not exists public.rulebook_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rule_key text not null check (rule_key in ('daily_loss_limit', 'maximum_lot_contract_size')),
  category text not null default 'non_negotiable' check (category = 'non_negotiable'),
  title text not null,
  value text not null,
  unit text,
  guidance text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, rule_key)
);

create index if not exists idx_rulebook_rules_user_sort
  on public.rulebook_rules (user_id, category, sort_order);

alter table public.rulebook_rules enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rulebook_rules' AND policyname = 'Users can view own rulebook rules'
  ) THEN
    CREATE POLICY "Users can view own rulebook rules"
      ON public.rulebook_rules FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rulebook_rules' AND policyname = 'Users can insert own rulebook rules'
  ) THEN
    CREATE POLICY "Users can insert own rulebook rules"
      ON public.rulebook_rules FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rulebook_rules' AND policyname = 'Users can update own rulebook rules'
  ) THEN
    CREATE POLICY "Users can update own rulebook rules"
      ON public.rulebook_rules FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'rulebook_rules' AND policyname = 'Users can delete own rulebook rules'
  ) THEN
    CREATE POLICY "Users can delete own rulebook rules"
      ON public.rulebook_rules FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
