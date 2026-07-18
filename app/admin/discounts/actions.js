"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized.' };
  const admin = createAdminClient();
  if (!admin) return { error: 'Admin client not configured.' };
  return { admin };
}

/**
 * Save the global discount settings into site_settings.
 * Each rate is paired with its Razorpay UPI offer id — the actual charge is
 * enforced by the offer, so the % and the offer id must match.
 */
export async function saveDiscountSettings(form) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };

  const partnerPct = Math.round(Number(form?.partner_trial_pct));
  const defaultPct = Math.round(Number(form?.default_pct));
  const partnerOffer = String(form?.partner_trial_offer_id_upi || '').trim().slice(0, 120);
  const defaultOffer = String(form?.default_offer_id_upi || '').trim().slice(0, 120);

  if (!Number.isFinite(partnerPct) || partnerPct < 30 || partnerPct > 50) {
    return { error: 'Partner (trial) discount must be between 30% and 50%.' };
  }
  if (!Number.isFinite(defaultPct) || defaultPct < 1 || defaultPct > 100) {
    return { error: 'Default (post-trial) discount must be between 1% and 100%.' };
  }

  const now = new Date().toISOString();
  const rows = [
    { key: 'partner_trial_pct', value: String(partnerPct), updated_at: now },
    { key: 'partner_trial_offer_id_upi', value: partnerOffer, updated_at: now },
    { key: 'default_pct', value: String(defaultPct), updated_at: now },
    { key: 'default_offer_id_upi', value: defaultOffer, updated_at: now },
  ];

  const { error: e } = await admin.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (e) return { error: e.message };

  revalidatePath('/admin/discounts');
  return { ok: true };
}
