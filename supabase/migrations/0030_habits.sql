-- Migration 0028: Habits & Habit Logs for Phase 2 (Persona + Habits + Streaks)
-- Idempotent: safe to re-run

-- ─── Habits table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_custom boolean DEFAULT true,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);

-- ─── Habit Logs table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_date ON habit_logs(habit_id, log_date);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Habits RLS
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habits_select_own' AND tablename = 'habits') THEN
  CREATE POLICY habits_select_own ON habits FOR SELECT USING (auth.uid() = user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habits_insert_own' AND tablename = 'habits') THEN
  CREATE POLICY habits_insert_own ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habits_update_own' AND tablename = 'habits') THEN
  CREATE POLICY habits_update_own ON habits FOR UPDATE USING (auth.uid() = user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habits_delete_own' AND tablename = 'habits') THEN
  CREATE POLICY habits_delete_own ON habits FOR DELETE USING (auth.uid() = user_id);
END IF;
END $$;

-- Habit Logs RLS
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habit_logs_select_own' AND tablename = 'habit_logs') THEN
  CREATE POLICY habit_logs_select_own ON habit_logs FOR SELECT USING (auth.uid() = user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habit_logs_insert_own' AND tablename = 'habit_logs') THEN
  CREATE POLICY habit_logs_insert_own ON habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habit_logs_update_own' AND tablename = 'habit_logs') THEN
  CREATE POLICY habit_logs_update_own ON habit_logs FOR UPDATE USING (auth.uid() = user_id);
END IF;
END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'habit_logs_delete_own' AND tablename = 'habit_logs') THEN
  CREATE POLICY habit_logs_delete_own ON habit_logs FOR DELETE USING (auth.uid() = user_id);
END IF;
END $$;
