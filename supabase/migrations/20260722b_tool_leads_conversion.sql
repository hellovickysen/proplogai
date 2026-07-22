-- Add conversion tracking columns to tool_leads
ALTER TABLE tool_leads ADD COLUMN IF NOT EXISTS converted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tool_leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- Add unique constraint on email for upsert support
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tool_leads_email_key') THEN
    ALTER TABLE tool_leads ADD CONSTRAINT tool_leads_email_key UNIQUE (email);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tool_leads_converted ON tool_leads (converted) WHERE converted = true;

NOTIFY pgrst, 'reload schema';
