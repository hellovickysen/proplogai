"use server";

import { createClient } from '@/lib/supabase/server';
import { createAdminClient, ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { MAX_COMMISSION_RATE } from '@/lib/affiliate';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildAffiliateApprovedEmail } from '@/lib/subscription-emails';

/** Verify the caller is the admin, return the service-role client. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized.' };
  const admin = createAdminClient();
  if (!admin) return { error: 'Admin client not configured.' };
  return { admin, user };
}

/* ─── Affiliate status actions ─────────────────────────────── */
export async function setAffiliateStatus(affiliateId, status) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
    return { error: 'Invalid status.' };
  }
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'approved') patch.approved_at = new Date().toISOString();

  const { data: row, error: e } = await admin
    .from('affiliates')
    .update(patch)
    .eq('id', affiliateId)
    .select('email, name, referral_username, commission_rate')
    .maybeSingle();
  if (e) return { error: e.message };

  // If suspended/rejected, stop future commissions by marking referrals cancelled.
  if (status === 'suspended' || status === 'rejected') {
    await admin.from('affiliate_referrals').update({ status: 'cancelled' }).eq('affiliate_id', affiliateId);
  }

  // On approval, notify the affiliate (non-blocking; never fails the action).
  if (status === 'approved' && row?.email && isEmailConfigured()) {
    try {
      const { subject, html } = buildAffiliateApprovedEmail({
        name: row.name,
        referralUsername: row.referral_username,
        commissionPct: Math.round((Number(row.commission_rate) || 0.4) * 100),
      });
      await sendEmail({ to: row.email, subject, html });
    } catch (mailErr) {
      console.error('Affiliate approval email error (non-fatal):', mailErr?.message || mailErr);
    }
  }

  revalidatePath('/admin/affiliates');
  return { ok: true };
}

export async function setCommissionRate(affiliateId, ratePercent) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  const pct = Number(ratePercent);
  if (!Number.isFinite(pct) || pct < 0 || pct > MAX_COMMISSION_RATE * 100) {
    return { error: `Rate must be between 0 and ${MAX_COMMISSION_RATE * 100}%.` };
  }
  const { error: e } = await admin
    .from('affiliates')
    .update({ commission_rate: pct / 100, updated_at: new Date().toISOString() })
    .eq('id', affiliateId);
  if (e) return { error: e.message };
  revalidatePath('/admin/affiliates');
  return { ok: true };
}

export async function deleteAffiliate(affiliateId) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  // Cascade removes coupons/clicks/referrals/commissions/payouts.
  const { error: e } = await admin.from('affiliates').delete().eq('id', affiliateId);
  if (e) return { error: e.message };
  revalidatePath('/admin/affiliates');
  return { ok: true };
}

/* ─── Commission ───────────────────────────────────────────── */
export async function revokeCommission(commissionId) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  const { error: e } = await admin
    .from('affiliate_commissions')
    .update({ status: 'reversed' })
    .eq('id', commissionId);
  if (e) return { error: e.message };
  revalidatePath('/admin/affiliates');
  return { ok: true };
}

/* ─── Payout requests ──────────────────────────────────────── */
export async function updatePayoutStatus(payoutId, status) {
  const { admin, error } = await requireAdmin();
  if (error) return { error };
  if (!['requested', 'approved', 'rejected', 'paid'].includes(status)) {
    return { error: 'Invalid status.' };
  }

  const patch = { status };
  if (status === 'paid' || status === 'rejected') patch.processed_at = new Date().toISOString();

  const { data: payout, error: e } = await admin
    .from('affiliate_payout_requests')
    .update(patch)
    .eq('id', payoutId)
    .select('affiliate_id, status')
    .maybeSingle();
  if (e) return { error: e.message };

  // When marked paid, reconcile the affiliate's outstanding commissions to 'paid'.
  if (status === 'paid' && payout?.affiliate_id) {
    await admin
      .from('affiliate_commissions')
      .update({ status: 'paid' })
      .eq('affiliate_id', payout.affiliate_id)
      .in('status', ['pending', 'approved']);
  }
  revalidatePath('/admin/affiliates');
  return { ok: true };
}
