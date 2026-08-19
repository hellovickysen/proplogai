import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconcileGoogleDriveBackups } from '@/lib/backups/google-drive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const { data: connection } = await supabase.from('backup_drive_connections').select('status,token_ciphertext,token_iv,token_tag,token_expires_at').eq('user_id', user.id).eq('status', 'connected').maybeSingle();
  if (!connection) return NextResponse.json({ connected: false, count: 0, latestCompletedAt: null });
  try {
    const status = await reconcileGoogleDriveBackups(supabase, user.id, connection);
    return NextResponse.json({ connected: true, ...status });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to sync cloud backup status.' }, { status: 400 });
  }
}
