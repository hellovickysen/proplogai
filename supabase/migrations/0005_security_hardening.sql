-- Security hardening migration
-- Run in Supabase Dashboard -> SQL Editor

-- =============================================================
-- 1. SUBSCRIPTIONS: Lock down to SELECT-only for users
-- The old 'for all' policy let users self-upgrade their plan.
-- INSERT is handled by handle_new_user() trigger (SECURITY DEFINER).
-- UPDATE/DELETE should only happen via service role (Stripe webhooks).
-- =============================================================

DROP POLICY IF EXISTS "own subscriptions" ON public.subscriptions;

-- Users can only READ their own subscription
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for regular users.
-- The signup trigger uses SECURITY DEFINER (bypasses RLS).
-- Stripe webhook handler should use the service_role key.

-- =============================================================
-- 2. JOURNAL_ENTRIES: Ensure trade_id belongs to same user
-- Prevents a user from linking journal entries to another user's trades.
-- Low risk since data is still user_id-scoped, but defense in depth.
-- =============================================================

-- Drop and recreate with tighter check
DROP POLICY IF EXISTS "own journal" ON public.journal_entries;

CREATE POLICY "journal_select_own"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "journal_insert_own"
  ON public.journal_entries FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      trade_id IS NULL
      OR EXISTS (SELECT 1 FROM public.trades WHERE id = trade_id AND user_id = auth.uid())
    )
  );

CREATE POLICY "journal_update_own"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_delete_own"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- 3. AI_INSIGHTS: Same pattern - split into granular policies
-- =============================================================

DROP POLICY IF EXISTS "own insights" ON public.ai_insights;

CREATE POLICY "insights_select_own"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insights_insert_own"
  ON public.ai_insights FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      trade_id IS NULL
      OR EXISTS (SELECT 1 FROM public.trades WHERE id = trade_id AND user_id = auth.uid())
    )
  );

CREATE POLICY "insights_update_own"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insights_delete_own"
  ON public.ai_insights FOR DELETE
  USING (auth.uid() = user_id);
