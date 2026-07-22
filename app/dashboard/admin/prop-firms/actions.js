'use server';

import { createClient } from '@supabase/supabase-js';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function isAdmin(email) {
  return email === process.env.ADMIN_EMAIL;
}

/* ── CRUD Actions ──────────────────────────────────────────── */

export async function getFirms() {
  const db = adminDb();
  const { data, error } = await db
    .from('prop_firms')
    .select('*')
    .order('display_order', { ascending: true });
  if (error) return { error: error.message };
  return { firms: data || [] };
}

export async function addFirm(adminEmail, firm) {
  if (!isAdmin(adminEmail)) return { error: 'Unauthorized' };
  const db = adminDb();

  // Get max display_order
  const { data: existing } = await db
    .from('prop_firms')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order || 0) + 1;

  const slug = firm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const { data, error } = await db
    .from('prop_firms')
    .insert({
      name: firm.name,
      slug,
      profit_target: firm.profit_target || 8,
      daily_drawdown: firm.daily_drawdown || 2,
      overall_drawdown: firm.overall_drawdown || 4,
      min_trading_days: firm.min_trading_days || 5,
      challenge_days: firm.challenge_days || 30,
      max_risk_per_trade: firm.max_risk_per_trade || null,
      consistency_requirement: firm.consistency_requirement || null,
      affiliate_link: firm.affiliate_link || null,
      logo_url: firm.logo_url || null,
      display_order: nextOrder,
      active: true,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { firm: data };
}

export async function updateFirm(adminEmail, id, updates) {
  if (!isAdmin(adminEmail)) return { error: 'Unauthorized' };
  const db = adminDb();

  const { error } = await db
    .from('prop_firms')
    .update(updates)
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteFirm(adminEmail, id) {
  if (!isAdmin(adminEmail)) return { error: 'Unauthorized' };
  const db = adminDb();

  const { error } = await db
    .from('prop_firms')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function reorderFirms(adminEmail, orderedIds) {
  if (!isAdmin(adminEmail)) return { error: 'Unauthorized' };
  const db = adminDb();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .from('prop_firms')
      .update({ display_order: i + 1 })
      .eq('id', orderedIds[i]);
  }

  return { success: true };
}

export async function getLeadStats(adminEmail) {
  if (!isAdmin(adminEmail)) return { error: 'Unauthorized' };
  const db = adminDb();

  const { count: total } = await db
    .from('tool_leads')
    .select('*', { count: 'exact', head: true });

  const { count: verified } = await db
    .from('tool_leads')
    .select('*', { count: 'exact', head: true })
    .eq('verified', true);

  return { total: total || 0, verified: verified || 0 };
}
