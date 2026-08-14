-- 20260814_analytics_evaluations.sql
-- AI Analytics: per-trade automatic rule evaluation results.
-- Staging-only. Additive and idempotent.

-- Stores the outcome of each automatic rule check against a trade.
-- One row per trade per rule_key per evaluation run.
-- Separate from trade_rule_breaks (discipline programme reviews).
create table if not exists public.trade_rule_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  trade_date date not null,
  rule_key text not null,
  rule_label text not null,
  outcome text not null check (outcome in ('followed', 'broken', 'unknown')),
  evidence jsonb not null default '{}'::jsonb,
  rule_snapshot jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(trade_id, rule_key)
);

-- Analytics query indexes
create index if not exists idx_tre_user_account_date
  on public.trade_rule_evaluations(user_id, account_id, trade_date);
create index if not exists idx_tre_user_outcome
  on public.trade_rule_evaluations(user_id, outcome, rule_key);
create index if not exists idx_tre_trade
  on public.trade_rule_evaluations(trade_id);

-- RLS
alter table public.trade_rule_evaluations enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trade_rule_evaluations'
      AND policyname = 'trade_rule_evaluations_own'
  ) THEN
    CREATE POLICY "trade_rule_evaluations_own"
      ON public.trade_rule_evaluations FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add over_trading_limit to rulebook_rules allowed keys
-- (the check constraint was already dropped by 20260813b, so rule_key is unconstrained text)

NOTIFY pgrst, 'reload schema';
