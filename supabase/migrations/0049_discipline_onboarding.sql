-- 0049_discipline_onboarding.sql
-- Five-step discipline onboarding. Additive and safe to re-apply after 0048.

alter table public.user_preferences
  add column if not exists onboarding_complete boolean not null default false;

create or replace function public.complete_discipline_onboarding(
  p_user_id uuid,
  p_daily_loss_limit numeric,
  p_maximum_position_size numeric,
  p_stop_on_profit numeric,
  p_focus_rule_ids jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_program_id uuid;
  v_active_account_id uuid;
  v_focus_id text;
  v_focus_name text;
  v_focus_rule_id uuid;
  v_sort_order integer := 0;
  v_focus_count integer;
  v_rule_metric text;
  v_rule_name text;
  v_rule_threshold numeric;
  v_rule_unit text;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized programme request';
  end if;

  if p_daily_loss_limit is null or p_daily_loss_limit <= 0
    or p_maximum_position_size is null or p_maximum_position_size <= 0
    or p_stop_on_profit is null or p_stop_on_profit <= 0 then
    raise exception 'Each required guardrail must have a positive value';
  end if;

  if p_focus_rule_ids is null or jsonb_typeof(p_focus_rule_ids) <> 'array' then
    raise exception 'Focus rules must be supplied as an array';
  end if;

  select count(*) into v_focus_count
  from (
    select distinct value
    from jsonb_array_elements_text(p_focus_rule_ids) as item(value)
  ) selected;

  if v_focus_count < 3 or v_focus_count > 5
    or jsonb_array_length(p_focus_rule_ids) <> v_focus_count then
    raise exception 'Choose between three and five unique Focus rules';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(p_focus_rule_ids) as item(value)
    where value not in (
      'planned_setups_only',
      'candle_close_confirmation',
      'one_trade_at_a_time',
      'no_averaging_down',
      'journal_before_next_trade',
      'pause_after_rule_break'
    )
  ) then
    raise exception 'Invalid Focus rule selection';
  end if;

  -- The account is never accepted from the client; it is always derived from
  -- this user's selected active_account_id preference.
  select active_account_id
    into v_active_account_id
  from public.user_preferences
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'User preferences were not found';
  end if;

  if v_active_account_id is not null and not exists (
    select 1 from public.accounts
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

  select id into v_program_id
  from public.discipline_programs
  where user_id = p_user_id
    and account_id is not distinct from v_active_account_id
    and status = 'active'
  order by started_at asc
  limit 1
  for update;

  if v_program_id is null then
    insert into public.discipline_programs (user_id, account_id, status)
    values (p_user_id, v_active_account_id, 'active')
    returning id into v_program_id;
  end if;

  -- Upsert the three explicit required guardrails. This avoids duplicates on
  -- retry while retaining the programme identity returned to the caller.
  for v_rule_metric, v_rule_name, v_rule_threshold, v_rule_unit in
    select 'daily_loss_limit', 'Daily loss limit', p_daily_loss_limit, '$'
    union all select 'maximum_position_size', 'Maximum position size', p_maximum_position_size, 'Lots'
    union all select 'stop_on_profit', 'Stop-on-profit', p_stop_on_profit, '$'
  loop
    update public.discipline_rules
    set name = v_rule_name,
        threshold = v_rule_threshold,
        unit = v_rule_unit,
        rule_type = 'required_guardrail',
        account_id = v_active_account_id,
        is_active = true
    where id = (
      select id from public.discipline_rules
      where user_id = p_user_id
        and program_id = v_program_id
        and metric = v_rule_metric
      order by created_at asc
      limit 1
    );

    if not found then
      insert into public.discipline_rules (
        user_id, program_id, account_id, name, rule_type, metric, threshold, unit, is_active
      ) values (
        p_user_id, v_program_id, v_active_account_id, v_rule_name,
        'required_guardrail', v_rule_metric, v_rule_threshold, v_rule_unit, true
      );
    end if;
  end loop;

  -- Rebuild only the selected programme's focus ordering. Rules are reused on
  -- retry, while the join table remains an exact 3–5 item representation.
  delete from public.discipline_program_focus_rules
  where user_id = p_user_id and program_id = v_program_id;

  for v_focus_id in select value from jsonb_array_elements_text(p_focus_rule_ids) as item(value)
  loop
    v_focus_name := case v_focus_id
      when 'planned_setups_only' then 'Planned A-grade setups only'
      when 'candle_close_confirmation' then 'Wait for candle-close confirmation'
      when 'one_trade_at_a_time' then 'One trade at a time'
      when 'no_averaging_down' then 'No averaging down'
      when 'journal_before_next_trade' then 'Journal before the next trade'
      when 'pause_after_rule_break' then 'Pause after a rule break'
    end;

    select id into v_focus_rule_id
    from public.discipline_rules
    where user_id = p_user_id
      and program_id = v_program_id
      and name = v_focus_name
      and metric = 'behavior'
    order by created_at asc
    limit 1;

    if v_focus_rule_id is null then
      insert into public.discipline_rules (
        user_id, program_id, account_id, name, rule_type, metric, is_active
      ) values (
        p_user_id, v_program_id, v_active_account_id, v_focus_name, 'focus', 'behavior', true
      ) returning id into v_focus_rule_id;
    else
      update public.discipline_rules
      set rule_type = 'focus', account_id = v_active_account_id, is_active = true
      where id = v_focus_rule_id;
    end if;

    insert into public.discipline_program_focus_rules (user_id, program_id, rule_id, sort_order)
    values (p_user_id, v_program_id, v_focus_rule_id, v_sort_order);
    v_sort_order := v_sort_order + 1;
  end loop;

  update public.discipline_programs
  set configured_at = coalesce(configured_at, now()),
      updated_at = now()
  where id = v_program_id and user_id = p_user_id;

  -- This is part of the same transaction as the programme/rule setup, so a
  -- successful RPC can never leave onboarding marked incomplete.
  update public.user_preferences
  set onboarding_complete = true
  where user_id = p_user_id;

  return v_program_id;
end;
$$;

-- Override the 0048 rule-creation contract for the onboarding guardrail set.
create or replace function public.create_discipline_rule_with_focus(
  p_user_id uuid, p_program_id uuid, p_name text, p_rule_type text, p_metric text,
  p_threshold numeric default null, p_unit text default null, p_instrument text default null
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
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'Unauthorized rule request'; end if;
  if p_name is null or length(btrim(p_name)) = 0 then raise exception 'Rule name is required'; end if;
  if p_rule_type not in ('required_guardrail', 'focus', 'library') then raise exception 'Invalid rule type'; end if;
  if p_metric not in ('risk_per_trade', 'daily_loss_limit', 'maximum_position_size', 'stop_on_profit', 'behavior') then raise exception 'Invalid rule metric'; end if;
  if p_metric = 'behavior' and p_threshold is not null then raise exception 'Behaviour rules do not use a threshold'; end if;
  if p_metric <> 'behavior' and (p_threshold is null or p_threshold <= 0) then raise exception 'A positive threshold is required for this rule'; end if;

  select * into v_program from public.discipline_programs
  where id = p_program_id and user_id = p_user_id and status = 'active' for update;
  if not found then raise exception 'Active programme not found'; end if;

  if p_rule_type = 'required_guardrail'
    and p_metric not in ('daily_loss_limit', 'maximum_position_size', 'stop_on_profit') then
    raise exception 'Required guardrails must be Daily loss limit, Maximum position size, or Stop-on-profit';
  end if;
  if p_rule_type = 'focus' and p_metric not in ('maximum_position_size', 'behavior') then
    raise exception 'Focus rules must be a position-size or behaviour rule';
  end if;
  if p_rule_type = 'library' and p_metric not in ('stop_on_profit', 'behavior') then
    raise exception 'Rulebook controls must be stop-on-profit or behaviour rules';
  end if;
  if p_rule_type = 'required_guardrail' and exists (
    select 1 from public.discipline_rules
    where user_id = p_user_id and program_id = p_program_id and is_active = true
      and rule_type = 'required_guardrail' and metric = p_metric
  ) then raise exception 'This required guardrail is already configured'; end if;

  if p_rule_type = 'focus' then
    select count(*) into v_focus_count
    from public.discipline_program_focus_rules focus
    join public.discipline_rules rule on rule.id = focus.rule_id
    where focus.user_id = p_user_id and focus.program_id = p_program_id
      and rule.user_id = p_user_id and rule.program_id = p_program_id
      and rule.rule_type = 'focus' and rule.is_active = true;
    if v_focus_count >= 5 then raise exception 'Choose up to five Focus rules for this programme'; end if;
  end if;

  insert into public.discipline_rules (
    user_id, program_id, account_id, name, rule_type, metric, threshold, unit, instrument, is_active
  ) values (
    p_user_id, p_program_id, v_program.account_id, left(btrim(p_name), 80), p_rule_type,
    p_metric, p_threshold, nullif(left(btrim(coalesce(p_unit, '')), 20), ''),
    nullif(left(btrim(coalesce(p_instrument, '')), 30), ''), true
  ) returning id into v_rule_id;

  if p_rule_type = 'focus' then
    insert into public.discipline_program_focus_rules (user_id, program_id, rule_id, sort_order)
    values (p_user_id, p_program_id, v_rule_id, v_focus_count);
  end if;
  return v_rule_id;
end;
$$;

-- Override 0048 completion validation so it matches the three onboarding guardrails.
create or replace function public.complete_discipline_program_setup(p_user_id uuid, p_program_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_configured_at timestamptz;
  v_focus_count integer;
  v_has_daily_limit boolean;
  v_has_maximum_position_size boolean;
  v_has_stop_on_profit boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'Unauthorized programme request'; end if;
  select configured_at into v_configured_at from public.discipline_programs
  where id = p_program_id and user_id = p_user_id and status = 'active' for update;
  if not found then raise exception 'Active programme not found'; end if;
  if v_configured_at is not null then return v_configured_at; end if;

  select
    exists (select 1 from public.discipline_rules where user_id = p_user_id and program_id = p_program_id and is_active = true and rule_type = 'required_guardrail' and metric = 'daily_loss_limit' and threshold > 0),
    exists (select 1 from public.discipline_rules where user_id = p_user_id and program_id = p_program_id and is_active = true and rule_type = 'required_guardrail' and metric = 'maximum_position_size' and threshold > 0),
    exists (select 1 from public.discipline_rules where user_id = p_user_id and program_id = p_program_id and is_active = true and rule_type = 'required_guardrail' and metric = 'stop_on_profit' and threshold > 0)
  into v_has_daily_limit, v_has_maximum_position_size, v_has_stop_on_profit;

  select count(*) into v_focus_count
  from public.discipline_program_focus_rules focus
  join public.discipline_rules rule on rule.id = focus.rule_id
  where focus.user_id = p_user_id and focus.program_id = p_program_id
    and rule.user_id = p_user_id and rule.program_id = p_program_id
    and rule.rule_type = 'focus' and rule.is_active = true;
  if not v_has_daily_limit or not v_has_maximum_position_size or not v_has_stop_on_profit then
    raise exception 'Daily loss limit, Maximum position size, and Stop-on-profit are required';
  end if;
  if v_focus_count < 3 or v_focus_count > 5 then
    raise exception 'Choose between three and five Focus rules before completing setup';
  end if;

  update public.discipline_programs
  set configured_at = coalesce(configured_at, now()), updated_at = now()
  where id = p_program_id and user_id = p_user_id
  returning configured_at into v_configured_at;
  return v_configured_at;
end;
$$;

grant execute on function public.complete_discipline_onboarding(uuid, numeric, numeric, numeric, jsonb) to authenticated;
grant execute on function public.create_discipline_rule_with_focus(uuid, uuid, text, text, text, numeric, text, text) to authenticated;
grant execute on function public.complete_discipline_program_setup(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
