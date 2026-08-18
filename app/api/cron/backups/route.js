import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createProfileBackup } from '@/lib/backups/profile-backup';
import { retainLatestGoogleDriveBackups, uploadGoogleDriveBackup } from '@/lib/backups/google-drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request) {
  const secret = process.env.BACKUP_CRON_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

async function hasEliteAccess(supabase, userId) {
  const [{ data: subscription }, { data: preferences }] = await Promise.all([
    supabase.from('subscriptions').select('status,razorpay_subscription_id,trial_ends_at').eq('user_id', userId).maybeSingle(),
    supabase.from('user_preferences').select('is_admin').eq('user_id', userId).maybeSingle(),
  ]);
  if (preferences?.is_admin) return true;
  if (subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()) return true;
  return Boolean(subscription?.razorpay_subscription_id) && ['active', 'authenticated'].includes(subscription?.status);
}

export async function GET(request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Backup scheduler is not configured.' }, { status: 503 });

  const { data: connections, error } = await supabase
    .from('backup_drive_connections')
    .select('id,user_id,status,token_ciphertext,token_iv,token_tag,token_expires_at')
    .eq('status', 'connected');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const results = [];
  for (const connection of connections || []) {
    if (!await hasEliteAccess(supabase, connection.user_id)) continue;
    const { data: run } = await supabase.from('backup_runs').insert({ user_id: connection.user_id, destination: 'google_drive', trigger_source: 'scheduled', status: 'queued' }).select('id').single();
    if (!run) { results.push({ userId: connection.user_id, ok: false }); continue; }
    try {
      const { archive, manifest } = await createProfileBackup(supabase, { id: connection.user_id });
      const filename = `proplogai-daily-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      const providerFileId = await uploadGoogleDriveBackup(supabase, connection.user_id, connection, archive, filename);
      await supabase.from('backup_runs').update({ status: 'completed', archive_version: manifest.version, bytes: archive.length, record_count: manifest.tables.reduce((sum, table) => sum + table.rows, 0), provider_file_id: providerFileId, completed_at: new Date().toISOString() }).eq('id', run.id).eq('user_id', connection.user_id);
      await retainLatestGoogleDriveBackups(supabase, connection.user_id, connection, 30);
      results.push({ userId: connection.user_id, ok: true });
    } catch (backupError) {
      await supabase.from('backup_runs').update({ status: 'failed', error_message: String(backupError?.message || 'Scheduled backup failed.').slice(0, 500), completed_at: new Date().toISOString() }).eq('id', run.id).eq('user_id', connection.user_id);
      results.push({ userId: connection.user_id, ok: false });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
