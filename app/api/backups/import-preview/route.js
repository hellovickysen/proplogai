import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restoreProfileBackup } from '@/lib/backups/profile-backup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getArchive(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Choose a PropLogAI backup file first.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Backup files larger than 25MB are not supported yet.');
  return Buffer.from(await file.arrayBuffer());
}

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  try {
    const preview = await restoreProfileBackup(supabase, user, await getArchive(request), { dryRun: true });
    return NextResponse.json(preview, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to inspect this backup.' }, { status: 400 });
  }
}
