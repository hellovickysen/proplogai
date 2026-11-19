import { resolveAnalyticsSetups } from "@/lib/analytics-setup.mjs";
import { normalizeAnalyticsSession } from "@/lib/analytics-session.mjs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyAccountFilter } from "@/lib/accounts";
import { readAnalyticsAccountScope } from "@/lib/analytics-account-scope.mjs";
import { attachRuleEvidence, withDisplayedRulebookDefaults } from "./rule-evidence.mjs";

export const dynamic = "force-dynamic";

async function readAllPages(makeQuery) {
  const rows = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await makeQuery().range(start, start + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const scope = await readAnalyticsAccountScope(supabase, user);
  if (scope.error) return NextResponse.json({ error: scope.error }, { status: 400 });
  const { activeAccountId } = scope;

  const [
    { data: trades, error: tradesError },
    { data: setups, error: setupsError },
    { data: rules, error: rulesError },
    { data: evaluations, error: evaluationsError },
  ] = await Promise.all([
    readAllPages(() => applyAccountFilter(supabase
      .from("trades")
      .select("id,account_id,trade_date,created_at,pnl,lot_size,opened_at,closed_at,session,setup,setup_id,setup_ids,setup_followed,setup_follow_map,no_setup_reason")
      .eq("user_id", user.id), activeAccountId)
      .order("trade_date", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })),
    supabase
      .from("setups")
      .select("id,name,is_active,sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("rulebook_rules")
      .select("id,account_id,rule_key,category,value,unit,enabled,metadata,created_at,updated_at")
      .eq("user_id", user.id),
    readAllPages(() => applyAccountFilter(supabase
      .from("trade_rule_evaluations")
      .select("trade_id,rule_key,outcome,evidence,rule_snapshot,account_id")
      .eq("user_id", user.id), activeAccountId)
      .order("trade_id", { ascending: true })
      .order("rule_key", { ascending: true })),
  ]);

  // Older local databases may not yet have the optional evaluation table.
  // Other evaluation-query failures must not silently erase rule evidence.
  const evaluationsTableMissing = evaluationsError && ["42P01", "PGRST205"].includes(evaluationsError.code);
  if (tradesError || setupsError || rulesError || (evaluationsError && !evaluationsTableMissing)) {
    return NextResponse.json(
      { error: tradesError?.message || setupsError?.message || rulesError?.message || evaluationsError?.message || "Unable to load analytics data." },
      { status: 400 },
    );
  }

  const setupById = new Map((setups || []).map((setup) => [setup.id, setup.name]));
  const normalizedTrades = (trades || []).map((trade) => {
    const resolvedNames = resolveAnalyticsSetups(trade, setupById);
    const namedFollowMap = Object.fromEntries(
      Object.entries(trade.setup_follow_map || {}).map(([id, status]) => [setupById.get(id) || id, status]),
    );
    // A numeric P&L establishes completion. Opening/closing timestamps do not.
    // The logged trade date, then creation date, only place it in a period.
    const date = trade.trade_date || trade.created_at?.slice(0, 10);
    const timestamp = trade.created_at || `${date}T00:00:00Z`;
    return {
      id: trade.id,
      account_id: trade.account_id,
      trade_date: date,
      created_at: timestamp,
      pnl: trade.pnl,
      lot_size: trade.lot_size,
      opened_at: trade.opened_at,
      closed_at: trade.closed_at,
      session: normalizeAnalyticsSession(trade.session),
      // A blank setup is missing evidence, not an explicit "No Setup" entry.
      setup: resolvedNames[0] || trade.setup || "",
      setupNames: resolvedNames.filter((name) => name !== "No Setup"),
      setup_follow_map: namedFollowMap,
      setup_followed: trade.setup_followed,
      no_setup_reason: trade.no_setup_reason,
      setupFollowed: trade.setup_followed,
      // R-multiple is an outcome, not the amount risked before entry.
      riskR: null,
    };
  });
  const tradesWithEvidence = attachRuleEvidence(normalizedTrades, withDisplayedRulebookDefaults(rules || []), evaluations || []);

  return NextResponse.json(
    {
      source: "authenticated-account",
      accountScope: scope.accountScope,
      evaluationStoreAvailable: !evaluationsTableMissing,
      trades: tradesWithEvidence,
      setupNames: (setups || []).map((setup) => setup.name).filter((name) => name !== "No Setup"),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
