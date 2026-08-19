import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProfileBackup } from '@/lib/backups/profile-backup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });

  try {
    const { archive, manifest } = await createProfileBackup(supabase, user);
    const filename = `proplogai-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    await supabase.from('backup_runs').insert({
      user_id: user.id,
      destination: 'local_download',
      status: 'completed',
      archive_version: manifest.version,
      bytes: archive.length,
      record_count: manifest.tables.reduce((total, table) => total + table.rows, 0),
      completed_at: new Date().toISOString(),
    });
    return new NextResponse(archive, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Backup-Unavailable-Assets': String(manifest.unavailableAssets?.length || 0),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to create a backup.' }, { status: 400 });
  }
}
