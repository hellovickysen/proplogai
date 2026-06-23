-- 0011_public_profile.sql
-- Public Profile: shareable link showing calendar, payouts, and trophies

alter table user_preferences
  add column if not exists share_code text unique,
  add column if not exists show_calendar boolean default false,
  add column if not exists show_payouts boolean default false,
  add column if not exists show_trophies boolean default false,
  add column if not exists calendar_mode text default 'rolling' check (calendar_mode in ('fixed', 'rolling')),
  add column if not exists calendar_start date,
  add column if not exists calendar_end date,
  add column if not exists calendar_rolling_days int default 30;

-- Index for public profile lookups
create index if not exists idx_user_prefs_share_code on user_preferences(share_code);
