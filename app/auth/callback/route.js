import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // Validate next param to prevent open redirects
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  const supabase = createClient();

  // Email verification flow (token_hash + type from email link)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=verification_failed`);
    }
    // For signup verification, redirect to login with success message
    if (type === 'signup' || type === 'email') {
      return NextResponse.redirect(`${origin}/login?verified=1`);
    }
    // For password recovery, redirect to settings
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/dashboard/settings`);
    }
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // OAuth flow (code from Google/GitHub etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
