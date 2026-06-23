-- 0011b_public_profile_rls.sql
-- Fix: Allow unauthenticated access to public profile data

-- Allow anyone to look up user_preferences by share_code
create policy "Public profile lookup by share_code"
  on user_preferences for select
  using (share_code is not null);

-- Allow public read of trades for users who enabled calendar sharing
create policy "Public calendar access"
  on trades for select
  using (
    exists (
      select 1 from user_preferences
      where user_preferences.user_id = trades.user_id
      and user_preferences.share_code is not null
      and user_preferences.show_calendar = true
    )
  );

-- Allow public read of payouts for users who enabled payout sharing
create policy "Public payout access"
  on payouts for select
  using (
    exists (
      select 1 from user_preferences
      where user_preferences.user_id = payouts.user_id
      and user_preferences.share_code is not null
      and user_preferences.show_payouts = true
    )
  );

-- Note: trophies already has "Anyone can view public trophies" policy (is_public = true)
