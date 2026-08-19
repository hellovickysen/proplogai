import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserAccess } from '@/lib/plans';
import { startGoogleDriveConnection } from '@/lib/backups/google-drive';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('google_drive_backup')) return NextResponse.redirect(new URL('/dashboard/settings?tab=backup&backup=elite', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  try {
    return NextResponse.redirect(await startGoogleDriveConnection(supabase, user));
  } catch (error) {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(new URL(`/dashboard/settings?tab=backup&backup_error=${encodeURIComponent(error?.message || 'Unable to connect Google Drive.')}`, base));
  }
}
