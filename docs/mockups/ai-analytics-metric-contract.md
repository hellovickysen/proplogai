# AI Analytics metric contract

Status: authenticated local Analytics contract on `codex/analytics`. This work is isolated and has not been released to production.

The manual Rule Reviews UI was removed at the user's request on 2026-11-14. Its URLs redirect to Analytics, review/backfill buttons are absent, and stale manual-review writes are disabled. Saved evaluations and automatic log-based calculations remain available to the analytics engine.

## Product boundary

AI Analytics explains completed journal history. Discipline and execution-quality metrics measure rule-following behaviour. P&L, win rate, and drawdown are historical outcome context. Profitability never earns a higher Discipline score. Net daily P&L is used only to compare a day with its applicable daily-loss limit; this is a rule-compliance check. Analytics never recommends a day, session, or setup to trade.

## Authoritative records

- Scope every query to the authenticated `user_id`. Analytics shares the dashboard account selection: Basic uses All Accounts regardless of an older saved selection; eligible paid/trial/admin access uses the selected active owned account when set. Missing or failed account reads never widen a selected scope.
- Apply the same scope to the Analytics feed and read-only trade details. Reject foreign trades and trades outside a selected account. Retired review/backfill actions must not write.
- Analytics trade-detail links use the same owned scope and show a read-only journal/screenshots view, with a return link to Analytics. Normal trade editing retains its existing workflow.
- A completed trade has a `trade_date` and a non-null, finite `pnl`. A missing P&L is incomplete, not break-even.
- Classify `pnl > 0` as Win, `pnl < 0` as Loss, and numeric `pnl === 0` as Break-even.
- Use the journal's `trade_date` as the trading calendar date. Do not convert this date-only field through the browser timezone.
- Session is the stored `session` value: Asian, London, New York, or Unassigned when blank.
- A setup occurrence is one setup tag attached to a completed trade. Because a trade can contain up to five setup tags, setup shares are independent and do not need to total 100%.
- Rule evidence combines automatic comparisons with applicable Rulebook versions and any valid saved `trade_rule_evaluations`. Setup-specific adherence comes from `setup_follow_map`. No new manual reviews are available.

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

### Weekday and session display rules

- Calculate P&L in integer currency cents; round monetary averages to two decimal places. A day average divides total weekday P&L by logged trading days. A session-day average divides that session's P&L by dates on which it occurred.
- Session-day counts may add up to more than the weekday's trading-day count because one date can include multiple sessions. Session trade counts and session P&L totals must reconcile with the weekday totals.
- Missing and unsupported session labels belong to Unassigned, so no completed trade is dropped. Unassigned remains visible in totals but is excluded from named-session rankings.
- Empty samples display an em dash for rates and averages. An actual zero or break-even result stays zero, with neutral P&L styling. Average win and average loss are unavailable when there are no trades in the corresponding outcome category.
- Rule-evidence counts include clean, partial, broken, and unknown; all four categories must total the completed trades.

## Discipline evidence

- Setup status is independent of Rulebook status: all green saved setup tags mean fully followed; orange means partially followed; explicit No Setup means not followed. Missing setup evidence stays unknown. Known mixed green/red setup reviews are partial.
- Setup adherence = fully followed trades / trades with known setup status. Partial and not-followed trades remain in that denominator; unknown trades do not.
- Rule adherence = followed logged checks / conclusive logged checks (`followed`, `partial`, `broken`). Every applicable automatic rule is checked for each completed trade. Unknown checks are excluded and their count remains visible. Daily limits therefore appear once per trade in this metric.
- Automatic logged checks cover daily loss, lot/contract size, daily trade limits, numeric no-overtrading limits, and allowed sessions. Unsupported behavioural claims remain unknown. A recovered multi-trade day does not prove that trading stopped at an earlier loss limit.
- Risk consistency = the equal-weight average of available compliance rates for daily loss, lot/contract size, and daily trade count. Daily loss and trade count use one account/day each; lot size uses one trade. Daily loss compares final net daily P&L with the dated limit, so it does not prove intraday stop behaviour. Unknown observations are excluded. Displayed defaults and earliest-known rules are labeled retrospective.
- Post-loss discipline checks the next trade after each loss on the same account and trading date. A follow-up passes only when its setup is fully followed and its lot size respects the applicable maximum, regardless of its P&L. Partial/no setup or an oversized lot is not followed. Missing evidence stays unknown. Stopping after a loss is counted separately and does not enter the percentage. Use unique valid entry timestamps when available; otherwise label saved log order.
- Discipline = 35% Rule adherence + 20% Setup adherence + 20% Risk consistency + 25% Post-loss discipline. Rule and setup evidence are required. Missing components are omitted and available weights rescaled; the score remains provisional when evidence, components, chronology, or historical settings are incomplete.
- Setup-specific adherence = `yes` reviews / known reviews for that individual tag. Do not assign a whole-trade partial/no outcome to a particular unreviewed tag on a multi-tag trade.
- Verified-clean execution requires every applicable evaluation to be followed. Unknown evidence must not silently count as clean. Rulebook status, setup status, and historical profitability remain separate.

## Overview outcome breakdown

The card beside the weekday chart uses only completed trades in the selected account scope and period. Wins, losses, and break-even add up to total completed trades. Average win and average loss divide the corresponding currency-cent totals by only that outcome's trade count; BE is excluded. Profit factor = gross positive P&L / absolute gross negative P&L, shown to two decimals. With no losing trades, show No losses when there are wins, otherwise an em dash; do not invent a finite ratio. An absent average stays unscored. These historical outcomes do not enter the Discipline score.

Average profitable/losing days per month count unique traded calendar dates in the selected scope and period. Combine selected-account P&L in currency cents for each date and classify its final net result as profitable, losing, or BE. Divide outcome-day counts and traded-day counts by calendar months containing at least one completed trade; partial months use only selected logged days. Round the whole-day category averages together using largest remainders, so profitable + losing + BE equals the displayed traded-day average. Label these whole-day averages and show the active-month/sample counts. Unlike Trade Frequency's account/day occurrences, one calendar date counts once in this trader-level monthly KPI. BE stays in the traded-day denominator and appears separately when present. No P&L average is shown in these two monthly count fields. Win days % = actual profitable dates / actual traded dates, including BE in the denominator. Compute it from unrounded selected-period counts, never from the rounded monthly estimates. Missing traded days show an em dash.

The clean-day definition and selected-frequency example live in the collapsed Analytics FAQs. Selecting a frequency row updates that example.

## Rulebook history and effective dates

- Effective trading dates and recorded timestamps use Asia/Kolkata (IST). A date-only effective date stays a date-only value; it is not converted through browser timezone settings.
- Store versions by effective date and recorded timestamp. A later effective change preserves the earlier version for earlier trades; a same-date correction uses the latest recorded revision.
- Future versions are shown as scheduled. Current rule cards use the version effective today, including the dated account override or global fallback. Disabled overrides remain disabled only for their own effective interval.
- Legacy rows are first known snapshots from their latest saved timestamp, not reconstructed changes. Preserve this provenance when appending the first tracked change. Earlier overwritten values cannot be recovered from the restored data.
- Recent history includes records from the last three calendar months in IST; clamp month-end boundaries and exclude future recorded timestamps. Full history remains available in its separate tab.
- A historical check uses the version effective for the trade date. A retrospective comparison uses the earliest known version or a displayed default and remains explicitly labeled; it does not prove the rule existed then.
- Existing saved manual reviews are usable only with matching rule revisions and settings. Same-date revisions invalidate an older review; later effective changes preserve earlier matching reviews. The manual-review write interface is retired.
- Rule writes retain authenticated ownership/account validation and optimistic concurrency checks. This audit adds no schema migration and does not edit existing logs or rules.

## Trade frequency

- Group days by account and logged trade date; group session occurrences by account, date, and normalized saved session. Different accounts never combine into one frequency occurrence.
- Daily outcome percentages describe final net day P&L; green-session rate describes final net session P&L. BE stays in each denominator.
- Average days per active month uses calendar months containing a completed trade, including a partial month as one observed month. The displayed day count rounds to a whole number.
- Compute P&L totals in currency cents; average and median P&L retain cents. Missing outcome groups show an em dash; actual zero P&L remains zero.
- Clean-day and clean-session rates require conclusive statuses for every occurrence in that frequency group. A known breach is conclusive even if other evidence is missing; unknown-only occurrences keep the overall clean rate unscored.
- Days with breach counts known breaches divided by all logged days in the group; a displayed percentage does not imply the remaining days were clean.
- Session ranking compares green-session rates only among groups with at least ten completed occurrences.

## Setup Quality

- Results: Wins / Losses / Break-even from completed-trade P&L.
- Historical win rate: wins / completed trades, with BE in the denominator.
- Average win and average loss exclude BE trades, retain account-currency cents, and show an em dash when there are no trades in that outcome category.
- Longest streaks use recorded close order when all timestamps are valid and unique. Otherwise use `trade_date`, then `created_at`, then `id`, and label the result Saved log order. BE interrupts both streaks.
- Historical mix per 10 uses largest-remainder rounding and always totals 10.
- Execution quality: `60% setup adherence + 40% verified clean-trade rate`.
- Grades: A+ 90-100, A 80-89, B 70-79, C 60-69, D below 60.
- Sample confidence: Provisional below 10 trades, Developing at 10-29, Established at 30+. Default evidence ranking orders these sample groups first, then execution quality and trade count; it does not use P&L.
- A multi-tag trade counts once in every matching setup row, so setup row totals can overlap. Deduplicate repeated tags and support the legacy single setup ID.
- Use the individual setup review when present. A whole-trade partial/no result cannot identify which unreviewed tag failed on a multi-tag trade; keep those tags unscored. A whole-trade yes can establish that all its tags were followed.

Execution quality and historical win rate answer different questions. Quality describes rule consistency; win rate describes past outcomes.

## Current local adapter output

The isolated adapter returns one period payload containing:

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

## Local validation and remaining limitations

The local account-backed adapter handles date-only IST reporting periods, null P&L, account/date/session grouping, cents for displayed monetary aggregates, unknown evidence, individual setup tags, and separate trade/session denominators. These checks do not establish that older production analytics helpers or production deployment have changed.

The restored data contains no dated numeric daily-loss, lot-size, or trade-count rules. The displayed Rulebook defaults are therefore retrospective comparisons, not proof that these personal limits applied historically. Legacy saved rules retain only their first-known snapshots; overwritten values cannot be reconstructed. Missing lot size and behavioural evidence remain unscored.

See `ai-analytics-local-qa-2026-11-14.md` for the latest local reconciliation and browser checks.

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


## Monthly and weekly performance chart

Overview defaults to Monthly net P&L, using completed trades in the selected Analytics period and account scope. Results sum logged P&L in integer currency cents; no pips are inferred. Multiple years are selectable. Monthly bars retain the observed range for the selected year, with unlogged gaps explicitly empty. Month choices cover January–December even outside that observed range. The always-visible month selector includes All months and every calendar month. All months shows the monthly view; selecting a particular month opens its weekly breakdown. Clicking a month or choosing Weekly shows Monday–Sunday calendar weeks clipped to that month, including empty weeks. Weekly counts and P&L must sum exactly to their month. Trade timestamps do not determine completion.

The share dialog previews Light or Dark artwork locally. Download PNG exports the same chart data, period and account scope; device sharing is invoked only by the user's Share image click. No public link, upload, notes, screenshots or remote storage write is created. Account context is XML-escaped. The image uses a self-contained SVG rasterized locally, without an external rendering library or CDN dependency.

## EDGE performance table

EDGE > Performance is a separate monthly/weekly table; the Overview chart stays in Overview. The table shares the Analytics period and account scope. Monthly rows use the selected year; selecting a month opens its clipped calendar weeks. Columns show completed trades (with W/L/BE counts), historical win rate, net P&L and win days %. Win rate includes BE trades in its denominator. Win days sums all selected-account P&L on each calendar date in currency cents, counts the date once, then divides profitable dates by all traded dates including BE. Totals use the underlying counts, not averages of row percentages. No-trade rates/P&L display a dash; logged break-even displays zero. The period column stays visible during horizontal scrolling.

Performance row Details expand below the selected month/week. Average winning trade = gross winning-trade P&L / winning trade count; average losing trade = negative absolute gross loss / losing trade count. Break-even trades are excluded from these averages. Profit factor = gross profit / absolute gross loss; loss-only samples show 0.00, wins without losses show No losses, and no win/loss observations show a dash. Details also show profitable, losing and break-even traded-date counts, using the same unique-date aggregation as Win days %. Switching interval/year/month closes the expanded row; shared filters recalculate the displayed row directly from their selected data.
