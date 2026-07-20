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
 * Rates: partner_pct, trial_auto_pct. Offer slots (Razorpay UPI): the offer for
 * the partner rate, the offer for partner + trial (in-trial), and the offer for
 * the trial auto-bonus alone. The % must match the % the offer was created at.
 */
export async function saveDiscountSettings(form) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };

  const partnerPct = Math.round(Number(form?.partner_pct));
  const trialAutoPct = Math.round(Number(form?.trial_auto_pct));
  const partnerOffer = String(form?.partner_offer_upi || '').trim().slice(0, 120);
  const partnerTrialOffer = String(form?.partner_trial_offer_upi || '').trim().slice(0, 120);
  const trialAutoOffer = String(form?.trial_auto_offer_upi || '').trim().slice(0, 120);

  if (!Number.isFinite(partnerPct) || partnerPct < 1 || partnerPct > 100) {
    return { error: 'Partner discount must be between 1% and 100%.' };
  }
  if (!Number.isFinite(trialAutoPct) || trialAutoPct < 0 || trialAutoPct > 100) {
    return { error: 'Trial auto-discount must be between 0% and 100%.' };
  }

  const now = new Date().toISOString();
  const rows = [
    { key: 'partner_pct', value: String(partnerPct), updated_at: now },
    { key: 'trial_auto_pct', value: String(trialAutoPct), updated_at: now },
    { key: 'partner_offer_upi', value: partnerOffer, updated_at: now },
    { key: 'partner_trial_offer_upi', value: partnerTrialOffer, updated_at: now },
    { key: 'trial_auto_offer_upi', value: trialAutoOffer, updated_at: now },
  ];

  const { error: e } = await admin.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (e) return { error: e.message };

  revalidatePath('/admin/discounts');
  return { ok: true };
}
