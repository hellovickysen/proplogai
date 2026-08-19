import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserAccess } from '@/lib/plans';
import { revokeGoogleDriveConnection } from '@/lib/backups/google-drive';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('google_drive_backup')) return NextResponse.json({ error: 'Google Drive backup is an Elite feature.' }, { status: 403 });
  try {
    await revokeGoogleDriveConnection(supabase, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Unable to revoke Google Drive access.' }, { status: 400 });
  }
}
