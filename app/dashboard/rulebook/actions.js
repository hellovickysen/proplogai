"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const MAX_NAME = 60;
const MAX_DIRECTION = 500;
const MAX_DESCRIPTION = 1000;

function sanitize(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '').trim();
}

async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

const DEFAULT_SETUPS = [
  { name: 'Breakout', direction: 'Only trade breakouts after a confirmed candle close above or below a key level. Avoid chasing if price is already extended.', sort_order: 1 },
  { name: 'Pullback', direction: 'Trade with the trend after price pulls back to a valid area and shows continuation confirmation.', sort_order: 2 },
  { name: 'Liquidity Sweep', direction: 'Trade only after price sweeps liquidity and shows rejection or reversal confirmation.', sort_order: 3 },
  { name: 'Support / Resistance', direction: 'Trade around clearly marked levels with confirmation. Avoid random entries in the middle of a range.', sort_order: 4 },
  { name: 'Trend Continuation', direction: 'Enter in the direction of the established trend after a healthy retracement or consolidation breakout.', sort_order: 5 },
  { name: 'Reversal', direction: 'Trade reversals only at major structural levels with multiple confirmations. Higher risk — reduce size.', sort_order: 6 },
  { name: 'Good SL', direction: 'You followed your setup correctly but the market hit your stop loss. This is not a mistake — it is the cost of doing business. Mark this when your process was right and the loss was simply the market doing its thing.', sort_order: 7 },
  { name: 'No Setup', direction: 'Use this when the trade did not follow any planned setup, was emotional, or was taken impulsively.', is_default: true, sort_order: 99 },
];

export async function seedDefaultSetups() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const { count } = await supabase
    .from('setups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (count > 0) return { ok: true, seeded: false };

  const rows = DEFAULT_SETUPS.map((s) => ({
    user_id: user.id,
    name: s.name,
    direction: s.direction,
    is_default: s.is_default || false,
    is_active: true,
    sort_order: s.sort_order,
  }));

  const { error } = await supabase.from('setups').insert(rows);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/rulebook');
  return { ok: true, seeded: true };
}

export async function resetToDefaultSetups() {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  // Delete all existing setups for this user
  await supabase.from('setups').delete().eq('user_id', user.id);

  // Re-insert defaults
  const rows = DEFAULT_SETUPS.map((s) => ({
    user_id: user.id,
    name: s.name,
    direction: s.direction,
    is_default: s.is_default || false,
    is_active: true,
    sort_order: s.sort_order,
  }));

  const { error } = await supabase.from('setups').insert(rows);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/rulebook');
  revalidatePath('/dashboard/trades/new');
  return { ok: true };
}

export async function createSetup(payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const name = sanitize(payload.name, MAX_NAME);
  if (!name) return { error: 'Setup name is required.' };

  const { error } = await supabase.from('setups').insert({
    user_id: user.id,
    name,
    direction: sanitize(payload.direction, MAX_DIRECTION),
    description: sanitize(payload.description, MAX_DESCRIPTION),
    is_active: true,
    sort_order: payload.sort_order || 0,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/rulebook');
  revalidatePath('/dashboard/trades/new');
  return { ok: true };
}

export async function updateSetup(id, payload) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const updates = { updated_at: new Date().toISOString() };
  if (payload.name !== undefined) updates.name = sanitize(payload.name, MAX_NAME);
  if (payload.direction !== undefined) updates.direction = sanitize(payload.direction, MAX_DIRECTION);
  if (payload.description !== undefined) updates.description = sanitize(payload.description, MAX_DESCRIPTION);
  if (payload.is_active !== undefined) updates.is_active = !!payload.is_active;

  const { error } = await supabase.from('setups').update(updates).eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };

  // Cascade: if name changed, update the denormalized setup text on all trades
  // that reference this setup via setup_ids
  if (updates.name) {
    // Fetch all user trades that have setup_ids populated
    const { data: allTrades } = await supabase
      .from('trades')
      .select('id, setup_ids')
      .eq('user_id', user.id)
      .not('setup_ids', 'is', null);

    // Filter in JS — find trades whose setup_ids array includes this setup
    const affectedTrades = (allTrades || []).filter((t) =>
      Array.isArray(t.setup_ids) && t.setup_ids.includes(id)
    );

    if (affectedTrades.length > 0) {
      // Collect all setup IDs referenced across affected trades
      const allSetupIds = [...new Set(affectedTrades.flatMap((t) => t.setup_ids || []))];

      // Fetch current names for all referenced setups (already updated above)
      const { data: setupRows } = await supabase
        .from('setups')
        .select('id, name')
        .in('id', allSetupIds);

      const nameMap = {};
      if (setupRows) {
        setupRows.forEach((s) => { nameMap[s.id] = s.name; });
      }

      // Rebuild the setup text field for each affected trade
      for (const trade of affectedTrades) {
        const names = (trade.setup_ids || [])
          .map((sid) => nameMap[sid])
          .filter(Boolean);
        await supabase
          .from('trades')
          .update({ setup: names.join(', ') })
          .eq('id', trade.id)
          .eq('user_id', user.id);
      }

      // Revalidate trade-related pages so they pick up the new names
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/trades');
      revalidatePath('/dashboard/calendar');
    }
  }

  revalidatePath('/dashboard/rulebook');
  return { ok: true };
}

export async function deleteSetup(id) {
  const { supabase, user } = await getCtx();
  if (!user) return { error: 'Not signed in.' };

  const { data: setup } = await supabase
    .from('setups')
    .select('is_default')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (setup && setup.is_default) return { error: 'Cannot delete the No Setup entry.' };

  const { error } = await supabase.from('setups').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/rulebook');
  return { ok: true };
}
