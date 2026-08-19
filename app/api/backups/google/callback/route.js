import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { finishGoogleDriveConnection } from '@/lib/backups/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL(request.url);
  const providerError = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (providerError) return NextResponse.redirect(new URL(`/dashboard/settings?tab=backup&backup_error=${encodeURIComponent('Google Drive connection was cancelled.')}`, base));

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', base));
  try {
    await finishGoogleDriveConnection(supabase, user, code, state);
    return NextResponse.redirect(new URL('/dashboard/settings?tab=backup&backup=connected', base));
  } catch (error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?tab=backup&backup_error=${encodeURIComponent(error?.message || 'Unable to connect Google Drive.')}`, base));
  }
}
