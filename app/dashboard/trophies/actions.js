"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserAccess } from '@/lib/plans';

function sanitize(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '').trim();
}

function generateShareId() {
  return crypto.randomUUID();
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const VALID_CATEGORIES = ['payout', 'challenge_pass', 'funded', 'other'];

export async function createTrophy(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  // Plan-based trophy limit check
  const access = await getUserAccess(supabase, user);
  const { remaining } = await access.remaining('trophy_uploads', supabase, user.id);
  if (remaining <= 0 && !access.canUse('unlimited_trophies')) {
    return { error: 'Basic plan is limited to 5 trophies. Upgrade to Elite for unlimited uploads.' };
  }

  const title = sanitize(payload.title, 100);
  if (!title) return { error: 'Title is required.' };
  if (!payload.file_url || typeof payload.file_url !== 'string' || !payload.file_url.startsWith('http')) {
    return { error: 'Invalid file URL.' };
  }

  const firmName = sanitize(payload.firm_name, 100);
  if (!firmName) return { error: 'Prop firm name is required.' };

  const { error } = await supabase.from('trophies').insert({
    user_id: user.id,
    title,
    category: VALID_CATEGORIES.includes(payload.category) ? payload.category : 'other',
    description: sanitize(payload.description, 500),
    file_url: payload.file_url,
    firm_name: firmName,
    is_public: false,
    share_id: null,
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/trophies');
  revalidatePath('/dashboard/expenses');
  return { ok: true };
}

export async function deleteTrophy(id) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  // Get file URL to delete from storage
  const { data: trophy } = await supabase
    .from('trophies')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { error } = await supabase.from('trophies').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };

  // Try to delete from storage (best effort)
  if (trophy && trophy.file_url) {
    const path = trophy.file_url.split('/trophies/')[1];
    if (path) {
      await supabase.storage.from('trophies').remove([path]);
    }
  }

  revalidatePath('/dashboard/trophies');
  revalidatePath('/dashboard/expenses');
  return { ok: true };
}

export async function togglePublic(id, isPublic) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const updates = { is_public: !!isPublic };
  if (isPublic) {
    // Generate share_id if making public
    updates.share_id = generateShareId();
  } else {
    updates.share_id = null;
  }

  const { data, error } = await supabase
    .from('trophies')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('share_id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/dashboard/trophies');
  return { ok: true, share_id: data.share_id };
}
