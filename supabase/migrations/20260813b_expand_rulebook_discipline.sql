-- Expand personal Rulebook rules into future-evaluable global defaults and account overrides.

alter table public.rulebook_rules
  add column if not exists account_id uuid references public.accounts(id) on delete cascade,
  add column if not exists rule_type text,
  add column if not exists enabled boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.rulebook_rules
set rule_type = rule_key
where rule_type is null;

alter table public.rulebook_rules
  alter column rule_type set default 'custom',
  alter column rule_type set not null;

alter table public.rulebook_rules
  drop constraint if exists rulebook_rules_rule_key_check,
  drop constraint if exists rulebook_rules_category_check,
  drop constraint if exists rulebook_rules_user_id_rule_key_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rulebook_rules_category_check'
      AND conrelid = 'public.rulebook_rules'::regclass
  ) THEN
    ALTER TABLE public.rulebook_rules
      ADD CONSTRAINT rulebook_rules_category_check
      CHECK (category IN ('non_negotiable', 'behavior', 'condition', 'response', 'custom'));
  END IF;
END $$;

create unique index if not exists idx_rulebook_rules_user_scope_key
  on public.rulebook_rules (user_id, coalesce(account_id, '00000000-0000-0000-0000-000000000000'::uuid), rule_key);

create index if not exists idx_rulebook_rules_user_scope_category
  on public.rulebook_rules (user_id, account_id, category, sort_order);

NOTIFY pgrst, 'reload schema';
