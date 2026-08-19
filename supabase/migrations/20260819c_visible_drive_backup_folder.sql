-- Staging-only visible Google Drive backup folder support.
-- Apply only to floggzxiitesfpkptwqc.

alter table public.backup_drive_connections
  add column if not exists provider_folder_id text;

notify pgrst, 'reload schema';
