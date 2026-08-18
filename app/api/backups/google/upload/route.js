import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserAccess } from '@/lib/plans';
import { createProfileBackup } from '@/lib/backups/profile-backup';
import { retainLatestGoogleDriveBackups, uploadGoogleDriveBackup } from '@/lib/backups/google-drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('google_drive_backup')) return NextResponse.json({ error: 'Google Drive backup is an Elite feature.' }, { status: 403 });

  const { data: connection } = await supabase
    .from('backup_drive_connections')
    .select('id,status,token_ciphertext,token_iv,token_tag,token_expires_at')
    .eq('user_id', user.id)
    .eq('status', 'connected')
    .maybeSingle();
  if (!connection) return NextResponse.json({ error: 'Connect Google Drive before creating a cloud backup.' }, { status: 400 });

  const { data: run, error: runError } = await supabase.from('backup_runs').insert({ user_id: user.id, destination: 'google_drive', trigger_source: 'manual', status: 'queued' }).select('id').single();
  if (runError || !run) return NextResponse.json({ error: 'Unable to start the cloud backup.' }, { status: 400 });

  try {
    const { archive, manifest } = await createProfileBackup(supabase, user);
    const filename = `proplogai-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const providerFileId = await uploadGoogleDriveBackup(supabase, user.id, connection, archive, filename);
    await supabase.from('backup_runs').update({ status: 'completed', archive_version: manifest.version, bytes: archive.length, record_count: manifest.tables.reduce((sum, table) => sum + table.rows, 0), provider_file_id: providerFileId, completed_at: new Date().toISOString() }).eq('id', run.id).eq('user_id', user.id);
    await retainLatestGoogleDriveBackups(supabase, user.id, connection, 30);
    return NextResponse.json({ ok: true, completedAt: new Date().toISOString() });
  } catch (error) {
    await supabase.from('backup_runs').update({ status: 'failed', error_message: String(error?.message || 'Backup failed.').slice(0, 500), completed_at: new Date().toISOString() }).eq('id', run.id).eq('user_id', user.id);
    return NextResponse.json({ error: error?.message || 'Unable to create the cloud backup.' }, { status: 400 });
  }
}
