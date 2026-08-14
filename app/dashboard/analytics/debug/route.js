import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAccountId, getDefaultAccountId } from '@/lib/accounts';

// TEMP diagnostic route (staging only, feature/discipline-system).
// Read-only. Scoped strictly to the signed-in user. DELETE after diagnosis.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, signedIn: false, note: 'Not signed in on this Preview.' });
  }

  const out = {
    ok: true,
    signedIn: true,
    userId: user.id,
    email: user.email,
    builtAt: '2026-08-14-debug-v1',
  };

  // Accounts owned by this user
  const { data: accounts, error: accErr } = await supabase
    .from('accounts')
    .select('id, name, is_primary, is_archived, sort_order, created_at')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  out.accountsError = accErr ? accErr.message : null;
  out.accounts = (accounts || []).map((a) => ({
    id: a.id, name: a.name, is_primary: a.is_primary, is_archived: a.is_archived,
  }));

  // Active + default account resolution
  try { out.activeAccountId = await getActiveAccountId(supabase, user.id); }
  catch (e) { out.activeAccountId = null; out.activeAccountIdError = e.message; }
  try { out.defaultAccountId = await getDefaultAccountId(supabase, user.id); }
  catch (e) { out.defaultAccountId = null; }

  // Trade counts
  const { count: tradeCount, error: tcErr } = await supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  out.tradeCount = tcErr ? null : (tradeCount || 0);
  out.tradeCountError = tcErr ? tcErr.message : null;

  // Per-account trade breakdown
  const { data: acctRows } = await supabase
    .from('trades')
    .select('account_id')
    .eq('user_id', user.id)
    .limit(2000);
  const byAccount = {};
  (acctRows || []).forEach((t) => {
    const k = t.account_id || '__null__';
    byAccount[k] = (byAccount[k] || 0) + 1;
  });
  out.tradeCountByAccount = byAccount;

  // Sample trades (most recent)
  const { data: sampleTrades } = await supabase
    .from('trades')
    .select('id, account_id, trade_date, pair, pnl')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false })
    .limit(5);
  out.sampleTrades = sampleTrades || [];

  // Setups
  const { count: setupCount, error: setupErr } = await supabase
    .from('setups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  out.setupCount = setupErr ? null : (setupCount || 0);

  // Rulebook rules (evaluator input)
  const { count: ruleCount, error: ruleErr } = await supabase
    .from('rulebook_rules')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('enabled', true);
  out.rulebookRulesEnabled = ruleErr ? null : (ruleCount || 0);
  out.rulebookRulesError = ruleErr ? ruleErr.message : null;

  // Evaluations table existence + count
  const { count: evalCount, error: evalErr } = await supabase
    .from('trade_rule_evaluations')
    .select('trade_id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  out.evaluationsTable = evalErr
    ? { exists: false, error: evalErr.message, code: evalErr.code || null }
    : { exists: true, count: evalCount || 0 };

  return NextResponse.json(out);
}
