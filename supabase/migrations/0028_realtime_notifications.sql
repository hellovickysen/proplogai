-- Migration 0028: Enable Supabase Realtime on notifications table
-- This allows clients to subscribe to INSERT events for live notification updates.
-- RLS ensures each user only receives events for their own rows.

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
