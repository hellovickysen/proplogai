"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  isValidCoupon,
  normalizeCoupon,
  slugifyUsername,
  getAffiliateStats,
} from '@/lib/affiliate';

const COUPON_EDIT_LOCK_DAYS = 30;

/* ─── Apply to become an affiliate ─────────────────────────── */
export async function submitApplication(form) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in to apply.' };

  const admin = createAdminClient();
  if (!admin) return { error: 'Server not configured. Please try again later.' };

  const name = String(form?.name || '').trim().slice(0, 120);
  const email = String(form?.email || user.email || '').trim().slice(0, 200);
  const socials = String(form?.social_links || '').trim().slice(0, 500);
  const audience = String(form?.audience_size || '').trim().slice(0, 60);

  if (!name) return { error: 'Please enter your name.' };
  if (!socials) return { error: 'Please share at least one social link.' };

  // Already an affiliate?
  const { data: existing } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) {
    return { error: `You have already applied (status: ${existing.status}).` };
  }

  // Duplicate-email detection (fraud prevention)
  const { data: dupe } = await admin
    .from('affiliates')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (dupe) {
    return { error: 'An application with this email already exists.' };
  }

  // Generate a unique candidate referral username (finalized on approval).
  let candidate = slugifyUsername(name || email);
  candidate = await ensureUniqueUsername(admin, candidate);

  const { error } = await admin.from('affiliates').insert({
    user_id: user.id,
    name,
    email,
    social_links: socials,
    audience_size: audience,
    referral_username: candidate,
    status: 'pending',
  });
  if (error) return { error: error.message };

  revalidatePath('/partner/dashboard');
  return { ok: true };
}

/* ─── Create / edit tracking coupon ────────────────────────── */
export async function saveCoupon(rawCode) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const admin = createAdminClient();
  if (!admin) return { error: 'Server not configured.' };

  const { data: aff } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!aff) return { error: 'You are not an affiliate yet.' };
  if (aff.status !== 'approved') return { error: 'Your affiliate account is not approved yet.' };

  const code = normalizeCoupon(rawCode);
  if (!isValidCoupon(code)) {
    return { error: 'Coupon must be 3–20 letters/numbers, no spaces or symbols.' };
  }

  // Uniqueness across all coupons (excluding own current row)
  const { data: taken } = await admin
    .from('affiliate_coupons')
    .select('affiliate_id')
    .ilike('code', code)
    .maybeSingle();
  if (taken && taken.affiliate_id !== aff.id) {
    return { error: 'That coupon code is already taken.' };
  }

  const { data: current } = await admin
    .from('affiliate_coupons')
    .select('id, code, last_edited_at')
    .eq('affiliate_id', aff.id)
    .maybeSingle();

  if (current) {
    if (normalizeCoupon(current.code) === code) return { ok: true }; // no change
    // 30-day edit lock
    const last = current.last_edited_at ? new Date(current.last_edited_at) : null;
    if (last) {
      const days = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (days < COUPON_EDIT_LOCK_DAYS) {
        const wait = Math.ceil(COUPON_EDIT_LOCK_DAYS - days);
        return { error: `You can change your coupon again in ${wait} day(s).` };
      }
    }
    const { error } = await admin
      .from('affiliate_coupons')
      .update({ code, last_edited_at: new Date().toISOString() })
      .eq('id', current.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin
      .from('affiliate_coupons')
      .insert({ affiliate_id: aff.id, code, last_edited_at: new Date().toISOString() });
    if (error) return { error: error.message };
  }

  revalidatePath('/partner/dashboard');
  return { ok: true };
}

/* ─── Request a payout ─────────────────────────────────────── */
export async function requestPayout(method) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const admin = createAdminClient();
  if (!admin) return { error: 'Server not configured.' };

  const { data: aff } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!aff || aff.status !== 'approved') {
    return { error: 'Only approved affiliates can request payouts.' };
  }

  // Prevent duplicate open requests
  const { data: open } = await admin
    .from('affiliate_payout_requests')
    .select('id')
    .eq('affiliate_id', aff.id)
    .in('status', ['requested', 'approved'])
    .maybeSingle();
  if (open) return { error: 'You already have a payout request in progress.' };

  const stats = await getAffiliateStats(admin, aff.id);
  const available = stats.pendingCommission;
  if (available <= 0) return { error: 'You have no commission available to withdraw yet.' };

  const { error } = await admin.from('affiliate_payout_requests').insert({
    affiliate_id: aff.id,
    amount: available,
    method: String(method || '').slice(0, 80) || null,
    status: 'requested',
  });
  if (error) return { error: error.message };

  revalidatePath('/partner/dashboard');
  return { ok: true, amount: available };
}

/* ─── helpers ──────────────────────────────────────────────── */
async function ensureUniqueUsername(admin, base) {
  let candidate = base;
  for (let i = 0; i < 25; i++) {
    const { data } = await admin
      .from('affiliates')
      .select('id')
      .ilike('referral_username', candidate)
      .maybeSingle();
    if (!data) return candidate;
    const suffix = String(Math.floor(Math.random() * 900) + 100);
    candidate = (base.slice(0, 16) + suffix).slice(0, 20);
  }
  return (base.slice(0, 14) + Date.now().toString().slice(-6)).slice(0, 20);
}
