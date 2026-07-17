import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { AFF_COOKIE, AFF_COOKIE_MAX_AGE, resolveAffiliateBySlug } from '@/lib/affiliate';

/**
 * GET /ref/<slug>
 *
 * Affiliate share link. <slug> is either an affiliate's referral username or a
 * coupon code (tracking only). Logs a click, sets the plog_aff attribution
 * cookie (90 days), then redirects to the marketing homepage.
 *
 * Uses the service-role client for the click insert (RLS blocks anon writes).
 * Never throws — a broken referral link must still land the visitor on the site.
 */
export async function GET(request, { params }) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const slug = (params?.slug || '').trim();
  const res = NextResponse.redirect(`${origin}/`);

  try {
    if (!slug || !/^[A-Za-z0-9_]{3,20}$/.test(slug)) return res;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      // Still set the cookie so attribution survives even if logging is down.
      res.cookies.set(AFF_COOKIE, slug, cookieOpts());
      return res;
    }

    const admin = createAdminClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const affiliate = await resolveAffiliateBySlug(admin, slug);

    // Set the attribution cookie regardless (resolves at checkout); store the slug.
    res.cookies.set(AFF_COOKIE, slug, cookieOpts());

    if (affiliate) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
      const ipHash = ip
        ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)
        : null;
      await admin.from('affiliate_referral_clicks').insert({
        affiliate_id: affiliate.id,
        source: 'link',
        ip_hash: ipHash,
        ua: (request.headers.get('user-agent') || '').slice(0, 300),
      });
    }
  } catch (err) {
    console.error('Affiliate ref click error:', err?.message || err);
  }

  return res;
}

function cookieOpts() {
  return {
    path: '/',
    maxAge: AFF_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: true,
  };
}
