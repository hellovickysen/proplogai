"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { normalizeCoupon, isValidCoupon } from '@/lib/affiliate';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized.' };
  const admin = createAdminClient();
  if (!admin) return { error: 'Admin client not configured.' };
  return { admin };
}

function parseForm(form) {
  const code = normalizeCoupon(form?.code);
  const label = String(form?.label || '').trim().slice(0, 80) || null;
  const discountPct = Number(form?.discount_pct);
  const offerIdCard = String(form?.razorpay_offer_id || '').trim().slice(0, 120) || null;
  const offerIdUpi = String(form?.razorpay_offer_id_upi || '').trim().slice(0, 120) || null;
  const startsAt = form?.starts_at ? new Date(form.starts_at).toISOString() : null;
  const expiresAt = form?.expires_at ? new Date(form.expires_at).toISOString() : null;
  const maxRedemptions = form?.max_redemptions === '' || form?.max_redemptions == null
    ? null
    : Math.max(1, parseInt(form.max_redemptions, 10) || 0) || null;
  return { code, label, discountPct, offerIdCard, offerIdUpi, startsAt, expiresAt, maxRedemptions };
}

/* ─── Create ───────────────────────────────────────────────── */
export async function createPromo(form) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };

  const { code, label, discountPct, offerIdCard, offerIdUpi, startsAt, expiresAt, maxRedemptions } = parseForm(form);

  if (!isValidCoupon(code)) return { error: 'Code must be 3–20 letters/numbers, no spaces or symbols.' };
  if (!Number.isFinite(discountPct) || discountPct <= 0 || discountPct > 100) {
    return { error: 'Discount % must be between 1 and 100.' };
  }
  if (!offerIdCard && !offerIdUpi) {
    return { error: 'Enter at least one Razorpay Offer Id (Card and/or UPI). Create the offer in the Razorpay Dashboard first.' };
  }
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    return { error: 'Expiry must be after the start date.' };
  }

  // Uniqueness across promo codes AND partner coupons.
  const { data: dupePromo } = await admin.from('promo_codes').select('id').ilike('code', code).maybeSingle();
  if (dupePromo) return { error: 'A promo code with that code already exists.' };
  const { data: dupeCoupon } = await admin.from('affiliate_coupons').select('id').ilike('code', code).maybeSingle();
  if (dupeCoupon) return { error: 'That code is already used by a partner coupon.' };

  const { error: e } = await admin.from('promo_codes').insert({
    code,
    label,
    discount_pct: discountPct,
    razorpay_offer_id: offerIdCard,
    razorpay_offer_id_upi: offerIdUpi,
    active: true,
    starts_at: startsAt,
    expires_at: expiresAt,
    max_redemptions: maxRedemptions,
  });
  if (e) return { error: e.message };

  revalidatePath('/admin/promos');
  return { ok: true };
}

/* ─── Update (code immutable) ──────────────────────────────── */
export async function updatePromo(id, form) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };

  const { label, discountPct, offerIdCard, offerIdUpi, startsAt, expiresAt, maxRedemptions } = parseForm(form);
  if (!Number.isFinite(discountPct) || discountPct <= 0 || discountPct > 100) {
    return { error: 'Discount % must be between 1 and 100.' };
  }
  if (!offerIdCard && !offerIdUpi) {
    return { error: 'Enter at least one Razorpay Offer Id (Card and/or UPI).' };
  }
  if (startsAt && expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
    return { error: 'Expiry must be after the start date.' };
  }

  const { error: e } = await admin
    .from('promo_codes')
    .update({
      label,
      discount_pct: discountPct,
      razorpay_offer_id: offerIdCard,
      razorpay_offer_id_upi: offerIdUpi,
      starts_at: startsAt,
      expires_at: expiresAt,
      max_redemptions: maxRedemptions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (e) return { error: e.message };

  revalidatePath('/admin/promos');
  return { ok: true };
}

/* ─── Toggle active ────────────────────────────────────────── */
export async function togglePromo(id, active) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  const { error: e } = await admin
    .from('promo_codes')
    .update({ active: !!active, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (e) return { error: e.message };
  revalidatePath('/admin/promos');
  return { ok: true };
}

/* ─── Delete ───────────────────────────────────────────────── */
export async function deletePromo(id) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  const { error: e } = await admin.from('promo_codes').delete().eq('id', id);
  if (e) return { error: e.message };
  revalidatePath('/admin/promos');
  return { ok: true };
}
