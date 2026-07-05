-- Migration 0031: Razorpay subscription fields
-- Adds Razorpay-specific columns to subscriptions table for payment integration.
-- Idempotent: safe to re-run.

-- Add new columns for Razorpay integration
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_payment_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_payment_at timestamptz;

-- Index for webhook lookups by Razorpay subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_razorpay_sub_id
  ON subscriptions (razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

-- Update status CHECK constraint to include new statuses
-- Drop old constraint first (if it exists), then add new one
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'subscriptions' AND constraint_name = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check;
  END IF;
END $$;

-- Add constraint allowing all Razorpay subscription statuses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'subscriptions' AND constraint_name = 'subscriptions_status_check'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
      CHECK (status IN ('active', 'created', 'authenticated', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'paused'));
  END IF;
END $$;

-- Update plan CHECK constraint to ensure basic/elite values
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'subscriptions' AND constraint_name = 'subscriptions_plan_check'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_plan_check;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'subscriptions' AND constraint_name = 'subscriptions_plan_check'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
      CHECK (plan IN ('basic', 'elite', 'free', 'pro'));
  END IF;
END $$;
