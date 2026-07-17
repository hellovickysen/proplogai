import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const AFF_COOKIE = 'plog_aff';
const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

// Public partner paths (no auth required). Everything else under the partner
// subdomain that is app-like requires a signed-in user.
const PARTNER_PUBLIC = ['/', '/login', '/apply', '/join'];

function isPartnerHost(host) {
  return host.startsWith('partner.');
}

// Paths we never rewrite onto the /partner segment, even on the partner host.
function isPassthrough(pathname) {
  return (
    pathname.startsWith('/partner') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/ref') ||
    pathname === '/favicon.ico' ||
    /\.[a-zA-Z0-9]+$/.test(pathname) // static asset with an extension
  );
}

export async function middleware(request) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const partner = isPartnerHost(host);
  const pathname = request.nextUrl.pathname;

  // Decide the effective (internal) path once, so auth checks use the real target.
  let effectivePath = pathname;
  if (partner && !isPassthrough(pathname)) {
    effectivePath = pathname === '/' ? '/partner' : `/partner${pathname}`;
  }

  // ── Session refresh (unchanged Supabase SSR plumbing) ──
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase env vars are missing, block protected routes instead of failing open.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const isProtected =
      effectivePath.startsWith('/dashboard') ||
      effectivePath.startsWith('/admin') ||
      partnerProtected(effectivePath, partner);
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = partner ? '/login' : '/login';
      return NextResponse.redirect(url);
    }
    return finalize(request, supabaseResponse, partner, pathname, effectivePath);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const isProtectedRoute =
    effectivePath.startsWith('/dashboard') ||
    effectivePath.startsWith('/admin') ||
    partnerProtected(effectivePath, partner);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login'; // on partner host this rewrites to /partner/login
      return NextResponse.redirect(url);
    }
  } catch (error) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return finalize(request, supabaseResponse, partner, pathname, effectivePath);
}

// Partner app-like routes that require auth.
function partnerProtected(effectivePath, partner) {
  if (!partner) return false;
  return (
    effectivePath.startsWith('/partner/dashboard') ||
    effectivePath.startsWith('/partner/earnings') ||
    effectivePath.startsWith('/partner/payouts') ||
    effectivePath.startsWith('/partner/settings')
  );
}

/**
 * Build the final response:
 * - capture ?ref=<slug> into the plog_aff cookie (main host, cookie-only fallback)
 * - rewrite partner-host requests onto the /partner segment
 * - carry over any Supabase auth cookies from the refresh step
 */
function finalize(request, supabaseResponse, partner, pathname, effectivePath) {
  let response = supabaseResponse;

  if (partner && effectivePath !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = effectivePath;
    response = NextResponse.rewrite(url, { request });
    // Carry over refreshed auth cookies onto the rewrite response
    supabaseResponse.cookies.getAll().forEach((c) => response.cookies.set(c));
  }

  // ?ref=<slug> fallback: set the affiliate attribution cookie (does not overwrite).
  const ref = request.nextUrl.searchParams.get('ref');
  if (ref && /^[A-Za-z0-9_]{3,20}$/.test(ref) && !request.cookies.get(AFF_COOKIE)) {
    response.cookies.set(AFF_COOKIE, ref, {
      path: '/',
      maxAge: AFF_COOKIE_MAX_AGE,
      sameSite: 'lax',
      secure: true,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
