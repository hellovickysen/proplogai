-- Webhook idempotency: track processed Razorpay webhook events to prevent duplicate processing.
-- Service-role only — webhooks are not user-authenticated.

CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON razorpay_webhook_events (event_id);

-- Auto-cleanup: delete events older than 30 days (prevents unbounded growth)
-- Run manually or via pg_cron: DELETE FROM razorpay_webhook_events WHERE processed_at < now() - interval '30 days';

-- RLS: block all user access — only service role should read/write this table
ALTER TABLE razorpay_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies = no user access. Service role bypasses RLS.

NOTIFY pgrst, 'reload schema';
