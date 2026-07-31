-- 0047_discipline_program.sql
-- 30-day discipline programme foundation.
-- Safe to apply first on the isolated staging project; additive and idempotent.

create table if not exists public.discipline_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  first_propol_reveal_unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_discipline_programs_one_active_per_scope
  on public.discipline_programs(user_id, coalesce(account_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'active';

create table if not exists public.discipline_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  name text not null,
  rule_type text not null check (rule_type in ('required_guardrail', 'focus', 'library')),
  metric text not null check (metric in ('risk_per_trade', 'daily_loss_limit', 'maximum_position_size', 'stop_on_profit', 'behavior')),
  threshold numeric,
  unit text,
  account_id uuid references public.accounts(id) on delete set null,
  instrument text,
  effective_from date not null default current_date,
  effective_until date,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (threshold is null or threshold > 0)
);

create unique index if not exists idx_discipline_rules_active_version
  on public.discipline_rules(program_id, name, version);
create index if not exists idx_discipline_rules_user_program
  on public.discipline_rules(user_id, program_id, is_active);

create table if not exists public.discipline_program_focus_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  rule_id uuid not null references public.discipline_rules(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(program_id, rule_id)
);

create table if not exists public.discipline_program_trading_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  trade_date date not null,
  created_at timestamptz not null default now(),
  unique(program_id, trade_date)
);

create table if not exists public.trade_rule_breaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  rule_id uuid references public.discipline_rules(id) on delete set null,
  source text not null check (source in ('derived', 'explicit', 'legacy_tag', 'review')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(trade_id, rule_id, source)
);

create table if not exists public.discipline_trade_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid not null references public.trades(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  result text not null default 'draft' check (result in ('draft', 'good_loss', 'mistake_confirmed')),
  primary_reason text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(program_id, trade_id)
);

create table if not exists public.discipline_review_rule_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid not null references public.discipline_trade_reviews(id) on delete cascade,
  rule_id uuid references public.discipline_rules(id) on delete set null,
  outcome text not null check (outcome in ('followed', 'broken', 'unknown')),
  evidence_source text,
  created_at timestamptz not null default now(),
  unique(review_id, rule_id)
);

create table if not exists public.discipline_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  required_guardrail_score integer not null check (required_guardrail_score between 0 and 40),
  focus_rule_score integer not null check (focus_rule_score between 0 and 60),
  evidence_coverage integer not null check (evidence_coverage between 0 and 100),
  calculated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.discipline_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  week_start date not null,
  available_at timestamptz not null,
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(program_id, week_start)
);

create table if not exists public.discipline_badge_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.discipline_programs(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(program_id, badge_key)
);

create index if not exists idx_discipline_reviews_queue
  on public.discipline_trade_reviews(user_id, program_id, result, completed_at);
create index if not exists idx_trade_rule_breaks_queue
  on public.trade_rule_breaks(user_id, program_id, trade_id);
create index if not exists idx_discipline_program_days
  on public.discipline_program_trading_days(user_id, program_id, trade_date);

alter table public.discipline_programs enable row level security;
alter table public.discipline_rules enable row level security;
alter table public.discipline_program_focus_rules enable row level security;
alter table public.discipline_program_trading_days enable row level security;
alter table public.trade_rule_breaks enable row level security;
alter table public.discipline_trade_reviews enable row level security;
alter table public.discipline_review_rule_checks enable row level security;
alter table public.discipline_score_snapshots enable row level security;
alter table public.discipline_weekly_reviews enable row level security;
alter table public.discipline_badge_events enable row level security;

drop policy if exists "discipline_programs_own" on public.discipline_programs;
drop policy if exists "discipline_rules_own" on public.discipline_rules;
drop policy if exists "discipline_focus_rules_own" on public.discipline_program_focus_rules;
drop policy if exists "discipline_days_own" on public.discipline_program_trading_days;
drop policy if exists "trade_rule_breaks_own" on public.trade_rule_breaks;
drop policy if exists "discipline_reviews_own" on public.discipline_trade_reviews;
drop policy if exists "discipline_review_checks_own" on public.discipline_review_rule_checks;
drop policy if exists "discipline_scores_own" on public.discipline_score_snapshots;
drop policy if exists "discipline_weekly_reviews_own" on public.discipline_weekly_reviews;
drop policy if exists "discipline_badges_own" on public.discipline_badge_events;

create policy "discipline_programs_own" on public.discipline_programs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_rules_own" on public.discipline_rules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_focus_rules_own" on public.discipline_program_focus_rules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_days_own" on public.discipline_program_trading_days for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trade_rule_breaks_own" on public.trade_rule_breaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_reviews_own" on public.discipline_trade_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_review_checks_own" on public.discipline_review_rule_checks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_scores_own" on public.discipline_score_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_weekly_reviews_own" on public.discipline_weekly_reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "discipline_badges_own" on public.discipline_badge_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
