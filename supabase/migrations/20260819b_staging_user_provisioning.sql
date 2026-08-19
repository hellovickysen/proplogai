-- Staging-only new-user provisioning for onboarding and backup-import tests.
-- Apply only to Supabase project floggzxiitesfpkptwqc, after prior staging migrations.

-- Backfill the prerequisite preference row for users already created in staging.
insert into public.user_preferences (user_id, onboarding_complete)
select u.id, false
from auth.users u
where not exists (
  select 1 from public.user_preferences p where p.user_id = u.id
);

-- Give users without any account a default Account 1.
insert into public.accounts (user_id, name, color, sort_order, is_primary)
select u.id, 'Account 1', '#a78bfa', 0, true
from auth.users u
where not exists (
  select 1 from public.accounts a where a.user_id = u.id
);

-- Repair old staging accounts that predate the primary-account marker.
with candidates as (
  select distinct on (a.user_id) a.id, a.user_id
  from public.accounts a
  where not exists (
    select 1 from public.accounts primary_account
    where primary_account.user_id = a.user_id and primary_account.is_primary = true
  )
  order by a.user_id, a.is_archived asc, a.created_at asc
)
update public.accounts a
set is_primary = true
from candidates c
where a.id = c.id;

-- Every preference row should select an active account when one exists.
update public.user_preferences p
set active_account_id = (
  select a.id
  from public.accounts a
  where a.user_id = p.user_id and a.is_archived = false
  order by a.is_primary desc, a.created_at asc
  limit 1
)
where p.active_account_id is null
  and exists (
    select 1 from public.accounts a
    where a.user_id = p.user_id and a.is_archived = false
  );

-- Future staging signups receive all prerequisites atomically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
begin
  insert into public.subscriptions (user_id, plan, status, trial_ends_at)
  values (new.id, 'free', 'active', now() + interval '14 days')
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id, onboarding_complete)
  values (new.id, false)
  on conflict (user_id) do nothing;

  insert into public.accounts (user_id, name, color, sort_order, is_primary)
  values (new.id, 'Account 1', '#a78bfa', 0, true)
  on conflict do nothing
  returning id into v_account_id;

  if v_account_id is null then
    select id into v_account_id
    from public.accounts
    where user_id = new.id and is_archived = false
    order by is_primary desc, created_at asc
    limit 1;
  end if;

  update public.user_preferences
  set active_account_id = coalesce(active_account_id, v_account_id)
  where user_id = new.id;

  return new;
end;
$$;

notify pgrst, 'reload schema';
