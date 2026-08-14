/**
 * Analytics Evaluator — deterministic rule cross-checking for trades.
 *
 * Evaluates each trade against the user's active Rulebook rules
 * and persists results in trade_rule_evaluations.
 *
 * This is separate from the discipline programme review system.
 * It runs automatically on trade create/edit and can backfill existing trades.
 */

/**
 * Evaluate a single trade against all applicable Rulebook rules.
 *
 * @param {object} supabase - Supabase client (authenticated)
 * @param {string} userId - The trade owner
 * @param {object} trade - The trade row (must include id, account_id, trade_date, pnl, lot_size, stop_loss, entry_price, exit_price, direction, setup_ids, setup_follow_map, no_setup_reason)
 * @param {object} journal - The journal entry for this trade (emotions, etc.) or null
 * @param {object} [setupNameMap] - Optional map of setup ID to setup name (pre-fetched for batch)
 * @returns {Promise<{ evaluated: number, errors: string[] }>}
 */
export async function evaluateTrade(supabase, userId, trade, journal, setupNameMap) {
  const errors = [];
  const evaluations = [];

  // Fetch the user's Rulebook rules applicable to this trade's account
  const accountId = trade.account_id || null;
  let query = supabase
    .from('rulebook_rules')
    .select('id, rule_key, rule_type, title, value, unit, category, account_id, enabled, metadata')
    .eq('user_id', userId)
    .eq('enabled', true);

  // Get rules: global (account_id IS NULL) plus account-specific
  const { data: rules, error: rulesErr } = await query;
  if (rulesErr) {
    return { evaluated: 0, errors: ['Failed to fetch Rulebook rules: ' + rulesErr.message] };
  }

  // If no setupNameMap provided, fetch user's setups for Bad SL / Good SL detection
  if (!setupNameMap) {
    setupNameMap = {};
    const { data: setups } = await supabase.from('setups').select('id, name').eq('user_id', userId);
    (setups || []).forEach((s) => { setupNameMap[s.id] = s.name; });
  }

  // Filter to applicable rules: global rules OR matching account
  const applicable = (rules || []).filter((r) => {
    if (!r.account_id) return true; // global rule
    return r.account_id === accountId; // account-specific
  });

  // -- Risk Per Trade check --
  const riskRule = applicable.find((r) => r.rule_key === 'risk_per_trade');
  if (riskRule) {
    const ev = evaluateRiskPerTrade(trade, riskRule);
    evaluations.push(ev);
  }

  // -- Daily Loss Limit check --
  const dailyLossRule = applicable.find((r) => r.rule_key === 'daily_loss_limit');
  if (dailyLossRule && trade.trade_date) {
    const ev = await evaluateDailyLossLimit(supabase, userId, trade, dailyLossRule);
    evaluations.push(ev);
  }

  // -- Maximum Lot/Contract Size --
  const maxLotRule = applicable.find((r) => r.rule_key === 'maximum_lot_contract_size');
  if (maxLotRule) {
    const ev = evaluateMaxLotSize(trade, maxLotRule);
    evaluations.push(ev);
  }

  // -- Stop On Profit --
  const stopOnProfitRule = applicable.find((r) => r.rule_key === 'stop_on_profit');
  if (stopOnProfitRule && trade.trade_date) {
    const ev = await evaluateStopOnProfit(supabase, userId, trade, stopOnProfitRule);
    evaluations.push(ev);
  }

  // -- Over-trading (daily trade count limit) --
  const overTradingRule = applicable.find((r) => r.rule_key === 'over_trading_limit');
  if (overTradingRule && trade.trade_date) {
    const ev = await evaluateOverTrading(supabase, userId, trade, overTradingRule);
    evaluations.push(ev);
  }

  // -- No Setup (derived from trade data, not a Rulebook rule) --
  evaluations.push(evaluateNoSetup(trade));

  // -- Bad SL (from setup selection — Bad SL is a setup name, not a boolean field) --
  evaluations.push(evaluateBadSL(trade, setupNameMap));

  // -- Setup Adherence (from setup_follow_map) --
  evaluations.push(evaluateSetupAdherence(trade));

  // -- FOMO (from journal emotions) --
  evaluations.push(evaluateFOMO(trade, journal));

  // Persist evaluations (upsert by trade_id + rule_key)
  let evaluated = 0;
  for (const ev of evaluations) {
    const row = {
      user_id: userId,
      trade_id: trade.id,
      account_id: accountId,
      trade_date: trade.trade_date,
      rule_key: ev.rule_key,
      rule_label: ev.rule_label,
      outcome: ev.outcome,
      evidence: ev.evidence || {},
      rule_snapshot: ev.rule_snapshot || {},
      evaluated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from('trade_rule_evaluations')
      .upsert(row, { onConflict: 'trade_id,rule_key' });

    if (upsertErr) {
      errors.push(ev.rule_key + ': ' + upsertErr.message);
    } else {
      evaluated++;
    }
  }

  return { evaluated, errors };
}

/**
 * Backfill evaluations for all trades of a user in a given account scope.
 */
export async function backfillEvaluations(supabase, userId, accountId) {
  let query = supabase
    .from('trades')
    .select('id, account_id, trade_date, pnl, lot_size, stop_loss, entry_price, exit_price, direction, setup_ids, setup_follow_map, setup_followed, no_setup_reason, session, pair')
    .eq('user_id', userId)
    .order('trade_date', { ascending: true })
    .limit(1000);

  if (accountId) {
    query = query.eq('account_id', accountId);
  }

  const { data: trades, error: tradesErr } = await query;
  if (tradesErr) return { total: 0, evaluated: 0, errors: ['Trade query failed: ' + tradesErr.message + ' (code: ' + (tradesErr.code || 'unknown') + ')'] };

  // Fetch all journals for these trades
  const tradeIds = (trades || []).map((t) => t.id);
  let journals = {};
  if (tradeIds.length > 0) {
    // Paginate journal fetch
    const PAGE = 500;
    for (let i = 0; i < tradeIds.length; i += PAGE) {
      const batch = tradeIds.slice(i, i + PAGE);
      const { data: jEntries } = await supabase
        .from('journal_entries')
        .select('trade_id, emotions')
        .eq('user_id', userId)
        .in('trade_id', batch);
      if (jEntries) {
        jEntries.forEach((j) => { journals[j.trade_id] = j; });
      }
    }
  }

  // Pre-fetch user's setups for Bad SL / Good SL detection
  const setupNameMap = {};
  const { data: setups } = await supabase.from('setups').select('id, name').eq('user_id', userId);
  (setups || []).forEach((s) => { setupNameMap[s.id] = s.name; });

  let totalEvaluated = 0;
  const allErrors = [];

  for (const trade of (trades || [])) {
    const journal = journals[trade.id] || null;
    const result = await evaluateTrade(supabase, userId, trade, journal, setupNameMap);
    totalEvaluated += result.evaluated;
    allErrors.push(...result.errors);
  }

  return { total: (trades || []).length, evaluated: totalEvaluated, errors: allErrors };
}

// ── Individual rule evaluators ──

function evaluateRiskPerTrade(trade, rule) {
  const threshold = parseFloat(rule.value);
  const pnl = Number(trade.pnl);

  if (!Number.isFinite(threshold) || threshold <= 0) {
    return { rule_key: 'risk_per_trade', rule_label: rule.title || 'Risk Per Trade', outcome: 'unknown', evidence: { reason: 'Invalid threshold' }, rule_snapshot: ruleSnapshot(rule) };
  }
  if (!Number.isFinite(pnl)) {
    return { rule_key: 'risk_per_trade', rule_label: rule.title || 'Risk Per Trade', outcome: 'unknown', evidence: { reason: 'No P&L data' }, rule_snapshot: ruleSnapshot(rule) };
  }

  // If loss exceeds the threshold, it's a breach
  const loss = pnl < 0 ? Math.abs(pnl) : 0;
  const broken = loss > threshold;

  return {
    rule_key: 'risk_per_trade',
    rule_label: rule.title || 'Risk Per Trade',
    outcome: broken ? 'broken' : 'followed',
    evidence: { threshold, loss, pnl, unit: rule.unit || '$' },
    rule_snapshot: ruleSnapshot(rule),
  };
}

async function evaluateDailyLossLimit(supabase, userId, trade, rule) {
  const threshold = parseFloat(rule.value);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    return { rule_key: 'daily_loss_limit', rule_label: rule.title || 'Daily Loss Limit', outcome: 'unknown', evidence: { reason: 'Invalid threshold' }, rule_snapshot: ruleSnapshot(rule) };
  }

  // Sum all losses on this trade_date for the same account
  let query = supabase
    .from('trades')
    .select('pnl')
    .eq('user_id', userId)
    .eq('trade_date', trade.trade_date);

  if (trade.account_id) {
    query = query.eq('account_id', trade.account_id);
  }

  const { data: dayTrades } = await query;
  const dayLoss = (dayTrades || []).reduce((sum, t) => {
    const p = Number(t.pnl);
    return sum + (Number.isFinite(p) && p < 0 ? Math.abs(p) : 0);
  }, 0);

  const broken = dayLoss > threshold;

  return {
    rule_key: 'daily_loss_limit',
    rule_label: rule.title || 'Daily Loss Limit',
    outcome: broken ? 'broken' : 'followed',
    evidence: { threshold, dayLoss, tradeDate: trade.trade_date, unit: rule.unit || '$' },
    rule_snapshot: ruleSnapshot(rule),
  };
}

function evaluateMaxLotSize(trade, rule) {
  const threshold = parseFloat(rule.value);
  const lotSize = Number(trade.lot_size);

  if (!Number.isFinite(threshold) || threshold <= 0) {
    return { rule_key: 'max_lot_size', rule_label: rule.title || 'Max Position Size', outcome: 'unknown', evidence: { reason: 'Invalid threshold' }, rule_snapshot: ruleSnapshot(rule) };
  }
  if (!Number.isFinite(lotSize)) {
    return { rule_key: 'max_lot_size', rule_label: rule.title || 'Max Position Size', outcome: 'unknown', evidence: { reason: 'No lot size data' }, rule_snapshot: ruleSnapshot(rule) };
  }

  const broken = lotSize > threshold;
  return {
    rule_key: 'max_lot_size',
    rule_label: rule.title || 'Max Position Size',
    outcome: broken ? 'broken' : 'followed',
    evidence: { threshold, lotSize, unit: rule.unit || 'lots' },
    rule_snapshot: ruleSnapshot(rule),
  };
}

async function evaluateStopOnProfit(supabase, userId, trade, rule) {
  const threshold = parseFloat(rule.value);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    return { rule_key: 'stop_on_profit', rule_label: rule.title || 'Stop On Profit', outcome: 'unknown', evidence: { reason: 'Invalid threshold' }, rule_snapshot: ruleSnapshot(rule) };
  }

  // Sum all P&L on this trade_date before this trade (by created_at or trade order)
  let query = supabase
    .from('trades')
    .select('pnl, created_at')
    .eq('user_id', userId)
    .eq('trade_date', trade.trade_date);

  if (trade.account_id) {
    query = query.eq('account_id', trade.account_id);
  }

  const { data: dayTrades } = await query;
  const sorted = (dayTrades || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Calculate running P&L up to (not including) this trade
  let runningPnl = 0;
  let hitTarget = false;
  for (const t of sorted) {
    if (t === trade || (t.created_at === trade.created_at && Number(t.pnl) === Number(trade.pnl))) break;
    runningPnl += Number(t.pnl) || 0;
    if (runningPnl >= threshold) {
      hitTarget = true;
      break;
    }
  }

  // If profit target was hit before this trade, continuing to trade is a breach
  return {
    rule_key: 'stop_on_profit',
    rule_label: rule.title || 'Stop On Profit',
    outcome: hitTarget ? 'broken' : 'followed',
    evidence: { threshold, runningPnlBeforeTrade: runningPnl, hitTarget, unit: rule.unit || '$' },
    rule_snapshot: ruleSnapshot(rule),
  };
}

async function evaluateOverTrading(supabase, userId, trade, rule) {
  const maxTrades = parseInt(rule.value, 10);
  if (!Number.isFinite(maxTrades) || maxTrades <= 0) {
    return { rule_key: 'over_trading', rule_label: rule.title || 'Over-Trading Limit', outcome: 'unknown', evidence: { reason: 'Invalid threshold' }, rule_snapshot: ruleSnapshot(rule) };
  }

  let query = supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('trade_date', trade.trade_date);

  if (trade.account_id) {
    query = query.eq('account_id', trade.account_id);
  }

  const { count } = await query;
  const broken = (count || 0) > maxTrades;

  return {
    rule_key: 'over_trading',
    rule_label: rule.title || 'Over-Trading Limit',
    outcome: broken ? 'broken' : 'followed',
    evidence: { maxTrades, actualCount: count || 0, tradeDate: trade.trade_date },
    rule_snapshot: ruleSnapshot(rule),
  };
}

function evaluateNoSetup(trade) {
  const hasSetup = (Array.isArray(trade.setup_ids) && trade.setup_ids.length > 0) || trade.setup;
  const noSetup = !hasSetup || trade.no_setup_reason;

  return {
    rule_key: 'no_setup',
    rule_label: 'No Setup',
    outcome: noSetup ? 'broken' : 'followed',
    evidence: {
      hasSetup: !!hasSetup,
      noSetupReason: trade.no_setup_reason || null,
    },
    rule_snapshot: {},
  };
}

function evaluateBadSL(trade, setupNameMap) {
  // Bad SL and Good SL are setup names, not boolean fields.
  // Check if any of the trade's setup_ids correspond to a setup named "Bad SL".
  const setupIds = Array.isArray(trade.setup_ids) ? trade.setup_ids : [];
  const hasBadSl = setupIds.some((id) => {
    const name = setupNameMap && setupNameMap[id];
    return name && name.toLowerCase() === 'bad sl';
  });
  const hasGoodSl = setupIds.some((id) => {
    const name = setupNameMap && setupNameMap[id];
    return name && name.toLowerCase() === 'good sl';
  });

  // If neither Good SL nor Bad SL is selected, outcome is unknown
  if (!hasBadSl && !hasGoodSl) {
    return {
      rule_key: 'bad_sl',
      rule_label: 'Bad Stop Loss',
      outcome: 'unknown',
      evidence: { reason: 'No SL quality marker selected' },
      rule_snapshot: {},
    };
  }

  return {
    rule_key: 'bad_sl',
    rule_label: 'Bad Stop Loss',
    outcome: hasBadSl ? 'broken' : 'followed',
    evidence: { hasBadSl, hasGoodSl },
    rule_snapshot: {},
  };
}

function evaluateSetupAdherence(trade) {
  const followMap = trade.setup_follow_map;
  if (!followMap || typeof followMap !== 'object' || Object.keys(followMap).length === 0) {
    return {
      rule_key: 'setup_adherence',
      rule_label: 'Setup Adherence',
      outcome: 'unknown',
      evidence: { reason: 'No setup follow data' },
      rule_snapshot: {},
    };
  }

  const values = Object.values(followMap);
  const hasNo = values.some((v) => v === 'no');
  const hasPartial = values.some((v) => v === 'partial');

  return {
    rule_key: 'setup_adherence',
    rule_label: 'Setup Adherence',
    outcome: hasNo ? 'broken' : (hasPartial ? 'broken' : 'followed'),
    evidence: {
      followMap,
      totalSetups: values.length,
      followed: values.filter((v) => v === 'yes').length,
      partial: values.filter((v) => v === 'partial').length,
      notFollowed: values.filter((v) => v === 'no').length,
    },
    rule_snapshot: {},
  };
}

function evaluateFOMO(trade, journal) {
  const emotions = journal && Array.isArray(journal.emotions) ? journal.emotions : [];
  const hasFomo = emotions.some((e) => e && e.toLowerCase() === 'fomo');

  if (emotions.length === 0) {
    return {
      rule_key: 'fomo',
      rule_label: 'FOMO Trading',
      outcome: 'unknown',
      evidence: { reason: 'No emotions logged' },
      rule_snapshot: {},
    };
  }

  return {
    rule_key: 'fomo',
    rule_label: 'FOMO Trading',
    outcome: hasFomo ? 'broken' : 'followed',
    evidence: { emotions, hasFomo },
    rule_snapshot: {},
  };
}

function ruleSnapshot(rule) {
  return {
    id: rule.id,
    rule_key: rule.rule_key,
    title: rule.title,
    value: rule.value,
    unit: rule.unit,
    category: rule.category,
  };
}
