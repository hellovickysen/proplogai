import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserAccess } from '@/lib/plans';
import { restoreProfileBackup } from '@/lib/backups/profile-backup';
import { downloadGoogleDriveBackup } from '@/lib/backups/google-drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('google_drive_backup')) return NextResponse.json({ error: 'Google Drive backup is an Elite feature.' }, { status: 403 });

  const [{ data: connection }, { data: run }] = await Promise.all([
    supabase.from('backup_drive_connections').select('id,status,token_ciphertext,token_iv,token_tag,token_expires_at').eq('user_id', user.id).eq('status', 'connected').maybeSingle(),
    supabase.from('backup_runs').select('id,provider_file_id,completed_at,archive_version').eq('user_id', user.id).eq('destination', 'google_drive').eq('status', 'completed').not('provider_file_id', 'is', null).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!connection || !run?.provider_file_id) return NextResponse.json({ error: 'No cloud backup is available to restore.' }, { status: 400 });

  try {
    const archive = await downloadGoogleDriveBackup(supabase, user.id, connection, run.provider_file_id);
    const result = await restoreProfileBackup(supabase, user, archive);
    await supabase.from('backup_imports').insert({ user_id: user.id, archive_version: run.archive_version, status: result.report.conflicts.length ? 'completed_with_conflicts' : 'completed', inserted_count: result.report.inserted, skipped_count: result.report.skipped, conflict_count: result.report.conflicts.length, report: result.report, completed_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, restoredBackupAt: run.completed_at, report: result.report });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to restore the latest cloud backup.' }, { status: 400 });
  }
}
