-- Migration 0029: Resolved status + ticket number + auto-delete support

-- 1. Add resolved_at timestamp for 7-day auto-delete countdown
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- 2. Add sequential ticket number for human-readable IDs (#001, #002, etc.)
-- Use a sequence for global uniqueness across all users
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS ticket_number int;

-- Backfill existing tickets with sequential numbers
UPDATE support_tickets
SET ticket_number = nextval('ticket_number_seq')
WHERE ticket_number IS NULL;

-- Set default for new tickets
ALTER TABLE support_tickets ALTER COLUMN ticket_number SET DEFAULT nextval('ticket_number_seq');

-- 3. Update status CHECK constraint to include 'resolved'
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved'));

-- 4. Index for auto-delete cleanup queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved ON support_tickets(resolved_at)
  WHERE status = 'resolved' AND resolved_at IS NOT NULL;
