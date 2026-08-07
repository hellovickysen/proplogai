-- 0048_discipline_rules_foundation.sql
-- Slice 1: atomic, user-scoped programme setup and Rulebook creation.
-- Additive and idempotent. Apply only to the isolated staging project.

alter table public.discipline_programs
  add column if not exists configured_at timestamptz;

create or replace function public.enforce_discipline_focus_rule()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.discipline_rules
    where id = new.rule_id
      and user_id = new.user_id
      and program_id = new.program_id
      and rule_type = 'focus'
      and is_active = true
  ) then
    raise exception 'Focus rules must reference an active Focus rule in the same programme';
  end if;
  return new;
end;
$$;

drop trigger if exists discipline_focus_rule_integrity on public.discipline_program_focus_rules;
create trigger discipline_focus_rule_integrity
before insert or update on public.discipline_program_focus_rules
for each row execute function public.enforce_discipline_focus_rule();

drop function if exists public.start_discipline_program(uuid, uuid);

create or replace function public.start_discipline_program(
  p_user_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_program_id uuid;
  v_active_account_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized programme request';
  end if;

  select active_account_id
    into v_active_account_id
  from public.user_preferences
  where user_id = p_user_id;

  if v_active_account_id is not null and not exists (
    select 1
    from public.accounts
    where id = v_active_account_id
      and user_id = p_user_id
      and is_archived = false
  ) then
    raise exception 'Selected account was not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    p_user_id::text || ':' || coalesce(v_active_account_id::text, 'all-accounts'),
    0
  ));

  select id
    into v_program_id
  from public.discipline_programs
  where user_id = p_user_id
    and account_id is not distinct from v_active_account_id
    and status = 'active'
  order by started_at asc
  limit 1;

  if v_program_id is not null then
    return v_program_id;
  end if;

  insert into public.discipline_programs (user_id, account_id, status)
  values (p_user_id, v_active_account_id, 'active')
  returning id into v_program_id;

  return v_program_id;
end;
$$;

create or replace function public.create_discipline_rule_with_focus(
  p_user_id uuid,
  p_program_id uuid,
  p_name text,
  p_rule_type text,
  p_metric text,
  p_threshold numeric default null,
  p_unit text default null,
  p_instrument text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_program public.discipline_programs%rowtype;
  v_rule_id uuid;
  v_focus_count integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized rule request';
  end if;

  if p_name is null or length(btrim(p_name)) = 0 then
    raise exception 'Rule name is required';
  end if;

  if p_rule_type not in ('required_guardrail', 'focus', 'library') then
    raise exception 'Invalid rule type';
  end if;

  if p_metric not in ('risk_per_trade', 'daily_loss_limit', 'maximum_position_size', 'stop_on_profit', 'behavior') then
    raise exception 'Invalid rule metric';
  end if;

  if p_metric = 'behavior' and p_threshold is not null then
    raise exception 'Behaviour rules do not use a threshold';
  end if;

  if p_metric <> 'behavior' and (p_threshold is null or p_threshold <= 0) then
    raise exception 'A positive threshold is required for this rule';
  end if;

  select *
    into v_program
  from public.discipline_programs
  where id = p_program_id
    and user_id = p_user_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Active programme not found';
  end if;

  if p_rule_type = 'required_guardrail'
    and p_metric not in ('risk_per_trade', 'daily_loss_limit') then
    raise exception 'Only Risk per trade and Daily loss limit are required guardrails';
  end if;

  if p_rule_type = 'focus'
    and p_metric not in ('maximum_position_size', 'behavior') then
    raise exception 'Focus rules must be a position-size or behaviour rule';
  end if;

  if p_rule_type = 'library'
    and p_metric not in ('stop_on_profit', 'behavior') then
    raise exception 'Rulebook controls must be stop-on-profit or behaviour rules';
  end if;

  if p_rule_type = 'required_guardrail' and exists (
    select 1
    from public.discipline_rules
    where user_id = p_user_id
      and program_id = p_program_id
      and is_active = true
      and rule_type = 'required_guardrail'
      and metric = p_metric
  ) then
    raise exception 'This required guardrail is already configured';
  end if;

  if p_rule_type = 'focus' then
    select count(*)
      into v_focus_count
    from public.discipline_program_focus_rules focus
    join public.discipline_rules rule on rule.id = focus.rule_id
    where focus.user_id = p_user_id
      and focus.program_id = p_program_id
      and rule.user_id = p_user_id
      and rule.program_id = p_program_id
      and rule.rule_type = 'focus'
      and rule.is_active = true;

    if v_focus_count >= 5 then
      raise exception 'Choose up to five Focus rules for this programme';
    end if;
  end if;

  insert into public.discipline_rules (
    user_id,
    program_id,
    account_id,
    name,
    rule_type,
    metric,
    threshold,
    unit,
    instrument,
    is_active
  )
  values (
    p_user_id,
    p_program_id,
    v_program.account_id,
    left(btrim(p_name), 80),
    p_rule_type,
    p_metric,
    p_threshold,
    nullif(left(btrim(coalesce(p_unit, '')), 20), ''),
    nullif(left(btrim(coalesce(p_instrument, '')), 30), ''),
    true
  )
  returning id into v_rule_id;

  if p_rule_type = 'focus' then
    insert into public.discipline_program_focus_rules (
      user_id,
      program_id,
      rule_id,
      sort_order
    )
    values (p_user_id, p_program_id, v_rule_id, v_focus_count);
  end if;

  return v_rule_id;
end;
$$;

create or replace function public.complete_discipline_program_setup(
  p_user_id uuid,
  p_program_id uuid
)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_configured_at timestamptz;
  v_focus_count integer;
  v_has_risk boolean;
  v_has_daily_limit boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized programme request';
  end if;

  select configured_at
    into v_configured_at
  from public.discipline_programs
  where id = p_program_id
    and user_id = p_user_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Active programme not found';
  end if;

  if v_configured_at is not null then
    return v_configured_at;
  end if;

  select exists (
    select 1 from public.discipline_rules
    where user_id = p_user_id
      and program_id = p_program_id
      and is_active = true
      and rule_type = 'required_guardrail'
      and metric = 'risk_per_trade'
      and threshold is not null
      and threshold > 0
  ), exists (
    select 1 from public.discipline_rules
    where user_id = p_user_id
      and program_id = p_program_id
      and is_active = true
      and rule_type = 'required_guardrail'
      and metric = 'daily_loss_limit'
      and threshold is not null
      and threshold > 0
  )
  into v_has_risk, v_has_daily_limit;

  select count(*)
    into v_focus_count
  from public.discipline_program_focus_rules focus
  join public.discipline_rules rule on rule.id = focus.rule_id
  where focus.user_id = p_user_id
    and focus.program_id = p_program_id
    and rule.user_id = p_user_id
    and rule.program_id = p_program_id
    and rule.rule_type = 'focus'
    and rule.is_active = true;

  if not v_has_risk or not v_has_daily_limit then
    raise exception 'Risk per trade and Daily loss limit are required';
  end if;

  if v_focus_count < 3 or v_focus_count > 5 then
    raise exception 'Choose between three and five Focus rules before completing setup';
  end if;

  update public.discipline_programs
  set configured_at = coalesce(configured_at, now()),
      updated_at = now()
  where id = p_program_id
    and user_id = p_user_id
  returning configured_at into v_configured_at;

  return v_configured_at;
end;
$$;

grant execute on function public.start_discipline_program(uuid) to authenticated;
grant execute on function public.create_discipline_rule_with_focus(uuid, uuid, text, text, text, numeric, text, text) to authenticated;
grant execute on function public.complete_discipline_program_setup(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
