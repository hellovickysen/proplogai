-- Migration 0046: display name/code for the trial auto-bonus
-- Shown at checkout as e.g. "TRIAL BONUS (TRIAL10) — 10%". Editable in admin.
-- Idempotent.

insert into site_settings (key, value) values ('trial_auto_code', 'TRIAL10')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
