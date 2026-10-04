# AI Analytics metric contract

Status: local mockup contract for `feature/ai-analytics-local`. It does not change a database, API, production route, or public interface.

## Product boundary

AI Analytics explains completed journal history. Discipline and execution-quality metrics measure rule-following behaviour. P&L, win rate, and drawdown are historical outcome context only; they never increase or decrease a Discipline score and never recommend a day, session, or setup to trade.

## Authoritative records

- Scope every query to the authenticated `user_id` and active `account_id`.
- A completed trade has a `trade_date` and a non-null, finite `pnl`. A missing P&L is incomplete, not break-even.
- Classify `pnl > 0` as Win, `pnl < 0` as Loss, and numeric `pnl === 0` as Break-even.
- Use the journal's `trade_date` as the trading calendar date. Do not convert this date-only field through the browser timezone.
- Session is the stored `session` value: Asian, London, New York, or Unassigned when blank.
- A setup occurrence is one setup tag attached to a completed trade. Because a trade can contain up to five setup tags, setup shares are independent and do not need to total 100%.
- Rule evidence comes from `trade_rule_evaluations`; setup-specific adherence comes from `setup_follow_map`.

## Periods

The same selected period must drive Overview and EDGE until the browser session ends. All time is the new-session default.

| Period | Inclusive dates |
| --- | --- |
| All time | No date limit |
| This month | First calendar day of the current month through today |
| This week | Monday through today |
| Last week | Previous Monday through Sunday |
| Last month | First through last calendar day of the previous month |

Period labels such as `This month (Oct)` and `Last month (Sep)` must be generated at runtime. Period boundaries should follow the user's reporting timezone; until a timezone preference exists, PropLogAI's current reporting default is Asia/Kolkata.

## Weekday metrics

All weekday calculations first filter completed trades to the selected period and then group by `trade_date` weekday.

| Metric | Definition | Denominator |
| --- | --- | --- |
| Completed trades | Count of completed trades | None |
| Trading days | Unique `trade_date` values containing at least one completed trade | None |
| Total P&L | Sum of completed-trade P&L | None |
| Average day P&L | Sum of daily P&L / trading days | Trading days |
| Median day P&L | Median of the daily P&L totals | Trading days |
| Green-day rate | Days whose final daily P&L is above zero / trading days | Trading days; BE remains in total |
| Historical trade win rate | Winning trades / completed trades | Completed trades; BE remains in total |
| Average win | Sum of positive trade P&L / winning trades | Winning trades only |
| Average loss | Sum of negative trade P&L / losing trades | Losing trades only |
| Average trades/day | Completed trades / trading days | Trading days |
| 1 / 2 / 3+ trade days | Trading days in each trade-count bucket / trading days | Trading days |
| Most logged setup | Setup tag occurring on the most completed trades | Completed trades carrying that tag |

Ties for most logged setup should sort by setup name so the result is deterministic.

## Session metrics

A session occurrence is one `trade_date + session` group containing at least one completed trade.

| Metric | Definition | Denominator |
| --- | --- | --- |
| Completed trades | Completed trades carrying the session | None |
| Share of weekday | Session completed trades / all completed trades on that weekday | Weekday completed trades |
| Historical trade win rate | Winning session trades / completed session trades | Completed session trades; BE remains in total |
| Average session P&L | Sum of each session occurrence's P&L / session occurrences | Session occurrences, not trades |
| Green-session rate | Session occurrences ending above zero / session occurrences | Session occurrences; BE remains in total |
| Trades/session distribution | Occurrences containing 1, 2, or 3+ trades / session occurrences | Session occurrences |

The weekday session ranking uses historical trade win rate and requires at least 10 completed trades. The per-session frequency comparison uses green-session rate and requires at least 10 session occurrences. These labels must not both be shortened to "win rate" because their denominators differ.

## Discipline evidence

- `Not followed`: at least one applicable rule evaluation is `broken`.
- `Verified clean`: at least one applicable evaluation exists, every applicable evaluation is `followed`, and none is `unknown`.
- `Insufficient evidence`: no applicable evaluation exists or at least one applicable evaluation is `unknown` without a break.
- Rule adherence: verified-clean trades / trades with conclusive rule evidence.
- Setup adherence on the overview: trades with conclusive setup evidence that followed all logged setup rules / trades with conclusive setup evidence.
- Setup-specific adherence: `yes` values / known values for that setup in `setup_follow_map`; `partial` and `no` are not followed, and missing values are unknown.
- Post-loss discipline: conclusive, verified-clean trades immediately following a completed losing trade / conclusive post-loss trades.
- Risk consistency remains a process metric calculated from valid risk observations and does not use P&L.

Unknown evidence must not silently count as clean. The current production helper treats any trade without a recorded break as clean; integration should add the third evidence state before the mockup replaces production analytics.

## Setup Quality

- Results: Wins / Losses / Break-even from completed-trade P&L.
- Historical win rate: wins / completed trades, with BE in the denominator.
- Average win and average loss exclude BE trades.
- Longest streaks follow chronological close order; until a reliable close timestamp is present for every imported trade, use `trade_date`, then `created_at`, then `id` as a stable fallback. BE interrupts both streaks.
- Historical mix per 10 uses largest-remainder rounding and always totals 10.
- Execution quality: `60% setup adherence + 40% verified clean-trade rate`.
- Grades: A+ 90-100, A 80-89, B 70-79, C 60-69, D below 60.
- Sample confidence: Provisional below 10 trades, Developing at 10-29, Established at 30+.

Execution quality and historical win rate answer different questions. Quality describes rule consistency; win rate describes past outcomes.

## Required local adapter output

The future isolated adapter should return one period payload containing:

```text
period
  totals and comparison deltas
  discipline dimensions and evidence coverage
  setup rows
  day-frequency rows
  session-frequency rows
  weekdays
    daily outcome aggregates
    trade-count distribution
    setup occurrences
    sessions with trade and occurrence aggregates
```

All visible values should be derived from this single payload so totals and drill-downs cannot disagree.

## Current implementation gaps found by the audit

1. The mockup previously scaled average P&L down with period length. The mock now uses a separate P&L variation factor; totals scale from average P&L and trading-day count.
2. Production `getDateRange` uses UTC calendar boundaries despite its Asia/Kolkata comment and does not expose Last month.
3. Production weekday `avgPnl` currently divides weekday P&L by trades, which is average trade P&L, not the mockup's average day P&L.
4. Production day/session heatmap stores only P&L and trade count. It needs wins, BE, unique occurrences, and session occurrence outcomes.
5. Production setup aggregation counts every setup tag, which is correct for occurrences, but the UI must not imply those shares sum to 100%.
6. Production outcome code commonly uses `Number(pnl)`, which converts null to zero. Completion must be checked before numeric conversion.
7. Production clean-trade logic treats unknown or missing evaluations as clean. The adapter needs explicit insufficient-evidence handling.
8. Mock session-frequency rows currently say historical win rate. Integration should label the occurrence result as green-session rate.

## Validation cases

- Missing P&L is excluded; numeric zero is BE.
- A day with `+$100` and `-$100` is BE, not green.
- A session with two trades is one session occurrence.
- Average day P&L does not shrink merely because a shorter period is selected.
- Weekday and session shares use the documented denominator and handle empty samples.
- Setup multi-tags do not inflate completed-trade totals.
- Unknown rule evidence is neither clean nor not-followed.
- All result counts equal completed trades and all mix-per-10 values total exactly 10.
- Ranking is suppressed below its documented sample threshold.
- Overview, EDGE, and row explanations show the same value for the same metric and period.

## Preview release boundary

The fixture-backed route remains a restricted product preview, not live user analytics.

- Local development can open `/ai-analytics-mockup` without production credentials.
- Production is disabled unless `AI_ANALYTICS_PREVIEW_ENABLED=true`.
- Production also requires `AI_ANALYTICS_PREVIEW_USER_IDS` to contain the authenticated Supabase user ID. Use a comma-separated list when more than one reviewer is authorized.
- The access check fails closed: a disabled flag, empty allowlist, or non-matching account returns 404.
- Logged-out visitors are redirected to login only after the preview is explicitly enabled and configured.
- The route stays `noindex, nofollow` while it uses fixtures and temporary Coach Me progress.
