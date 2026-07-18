-- Migration 0043: no-card 14-day trial for everyone
-- New signups auto-get a 14-day trial (trial_ends_at) with no Razorpay/card.
-- Existing Basic users are backfilled with a fresh 14-day trial.
-- Access (lib/plans.js) treats any future trial_ends_at as Elite.
-- Idempotent: safe to re-run.

-- 1) New signups: grant a 14-day trial on the auto-created subscription row.
--    (Only handle_new_user is redefined here — it lives solely in 0001; the
--     referral/admin triggers are separate functions and are untouched.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  insert into public.subscriptions (user_id, plan, status, trial_ends_at)
    values (new.id, 'free', 'active', now() + interval '14 days');
  return new;
end;
$$;

-- 2) Backfill existing Basic users (no paid sub, no existing trial) with a
--    fresh 14-day trial. Skips admins (already Elite) and paid subscribers.
--    trial_ends_at IS NULL guard makes this safe to re-run.
update public.subscriptions s
set trial_ends_at = now() + interval '14 days'
where s.trial_ends_at is null
  and s.razorpay_subscription_id is null
  and s.status = 'active'
  and s.plan in ('free', 'basic')
  and not exists (
    select 1 from public.user_preferences up
    where up.user_id = s.user_id and up.is_admin = true
  );

notify pgrst, 'reload schema';
