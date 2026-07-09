# PropLogAI Codebase Audit Report — Resolution Status

Original audit: June 30, 2026 (commit 6db21e7). ~85 findings across 5 domains.
Audit fixes applied: commits bf5b962, 09bb520, 72728291, bad6839.
Fix recovery session: June 30, 2026 (Phase K) — commits 06702ba through e4263ec.
Phase 2 audit addendum: July 9, 2026 — covering Phases O through S + Onboarding Redesign.

## Resolution Summary

The bulk audit fix commits introduced critical regressions that required emergency recovery. All fixes have been reviewed and verified. Final status:

- CRITICAL (6): ALL RESOLVED
- HIGH (22): ALL RESOLVED (1 had a bug in the fix — corrected)
- MEDIUM (30+): ALL RESOLVED (2 had minor issues — corrected)
- LOW (25+): ALL RESOLVED (1 stale item corrected in Phase 2 addendum)

## CRITICAL Findings — ALL RESOLVED

| ID | Finding | Resolution | Commit |
|----|---------|------------|--------|
| C1 | Admin email hardcoded in public repo | Moved to ADMIN_EMAIL env var | bf5b962 |
| C2 | Middleware swallows auth errors | Catch block now redirects to /login | bf5b962 |
| C3 | /admin routes not protected by middleware | Added /admin to pathname check | bf5b962 |
| C4 | OAuth callback ignores exchange errors | Now checks error, redirects to /login?error=oauth_failed | bf5b962 |
| C5 | Open redirect via unvalidated next param | Validates starts with / and not // | bf5b962 |
| C6 | Missing error handling on all dashboard pages | Added error handling to all 12+ pages | bf5b962 + 06702ba |

NOTE on C6: The bulk commit completely REWROTE dashboard/page.js and coach/page.js instead of adding error handling, introducing 15+ runtime bugs (wrong column names, missing function args, broken props). Commit 06702ba restored both pages to working state with proper error handling.

## HIGH Findings — ALL RESOLVED

| ID | Finding | Resolution | Status |
|----|---------|------------|--------|
| H1-H3 | Missing .eq('user_id') on updates | Added to trades, coach, settings, onboarding actions | CORRECT |
| H4 | Exported server action accepts arbitrary userId | Removed export from checkAndRewardReferral, then removed dead function entirely | CORRECT |
| H5 | Hardcoded IST timezone | Replaced with getTradingDate()/getTradingMonth() (lib/stats.js) globally. Trading day boundary = midnight UTC = 5:30 AM IST. | CORRECT |
| H6 | No fetch timeout on AI calls | Added 25s AbortController timeout (raised to 35s in Phase O for coach reports) | FIXED — original fix returned object instead of throwing, corrected in 0d62aac |
| H7 | Prompt injection via journal notes | Wrapped in <trader_note> tags, system prompt treats as data | CORRECT |
| H8 | HTML email XSS from AI content | HTML-escape all AI fields via escHtml() | CORRECT |
| H9 | Supabase client env var guards missing | Added guards to both client.js and server.js | CORRECT |
| H10 | AchievementBadges Rules of Hooks | Moved early return below all hooks | CORRECT |
| H11 | NotificationBell stale closure | Added typeFilter/excludeTypes to useEffect deps. Post-Phase S: NotificationBell now uses Supabase Realtime subscription + 60s polling fallback. | CORRECT |
| H12 | TradeForm crash on expired session | Added auth error check before upload | CORRECT |
| H13 | CSP allows unsafe-inline + unsafe-eval | Added HSTS header. NOTE: strict-dynamic was added but REMOVED — it blocked all client-side JS | FIXED in 4555c17 |
| H14 | Trophy share page no OG metadata | Added generateMetadata | CORRECT |
| H15 | Referral cookie XSS accessible | encodeURIComponent + SameSite=Lax | CORRECT |
| H16 | Weak random code generation | Replaced Math.random() with crypto.randomUUID() | CORRECT |
| H17 | Admin user count capped at 1000 | Added pagination | CORRECT |
| H18 | notifyAdmin fetches ALL users | Paginated lookup with caching | CORRECT |
| H19 | No loading states on dashboard pages | Added loading.js skeletons to all 11 routes | CORRECT |
| H20 | Password validation inconsistency | Imported validatePassword from lib/security | CORRECT |
| H21 | PnlCalendar uses local time | Switched to UTC getters | CORRECT |
| H22 | capitalizeWords uppercases EVERY letter | Fixed regex to /\b\w/g | CORRECT |

## MEDIUM Findings — ALL RESOLVED

All 30+ MEDIUM fixes reviewed and verified correct:
- ShareJournalButton SSR hydration fix (useState for origin)
- WeeklyScoreRing SVG gradient ID collision (useId per instance)
- ConfirmDialog a11y (role, aria-modal, Escape key, auto-focus)
- MobileNav a11y (role, aria-modal, aria-label)
- NotificationBell router.push instead of window.location.href
- TrophyWall alert() replaced with toast
- TradeForm logging in empty catch blocks
- Dashboard layout: filter trades by today instead of all
- Calendar: date range filter on Supabase query
- Landing page: ISR revalidation for beta count
- UTC date fixes in stats.js and trade detail
- imageUtils.js pdf.js load retry + crossOrigin
- security.js subdomain bypass fix
- Error boundary hides raw errors in production
- Auth callback handles email_change OTP type
- next.config.mjs image remotePatterns locked to specific Supabase project
- discipline.js DRY score calculation extraction

Minor corrections applied:
- TradeForm screenshot key: changed from key={url} (breaks with duplicates) to key={url-i} composite
- privacy/terms pages: changed force-dynamic to revalidate=86400 (daily ISR)

## LOW Findings — ALL RESOLVED

All 25+ LOW fixes reviewed and verified correct:
- TradeForm: htmlFor/id on 13 form labels
- TradeTable: sr-only caption + scope=col
- Sidebar: avatar alt text, aria-label/expanded on toggle
- WeeklyScoreRing: aria-hidden on SVG, bg-white/8 → bg-white/10
- ConfirmDialog: loadingLabel prop
- AchievementBadges: auto-remove animate-pulse after 3s
- Screenshot keys: stable composite keys
- select('*') replaced with specific columns on trophies, support, rulebook, expenses (additional select('*') replacements in Phase S — see addendum)
- .ts/.tsx added to tailwind.config.js content glob
- Privacy/Terms: daily ISR for copyright year
- Login: autoComplete attributes, minLength fix
- 404: Go Home as primary CTA
- OG image: Satori-incompatible backgroundClip fixed to solid color
- quotes.js: breakeven trades get neutral quote
- imageUtils.js: crossOrigin for pdf.js CDN
- ai.js: model slug fixed to anthropic/claude-3-5-haiku → **CORRECTION: slug was later rebranded/deprecated by OpenRouter. Current working slug is `anthropic/claude-haiku-4.5` (set in lib/ai.js default model()). The OPENROUTER_MODEL env var can override.**

## Lessons Learned

1. **Never rewrite entire files for targeted fixes.** The audit agent destroyed dashboard/page.js and coach/page.js by rewriting them from scratch instead of surgically adding error handling. This introduced 15+ runtime bugs.

2. **Never add 'strict-dynamic' to CSP without nonce-based setup.** strict-dynamic causes browsers to ignore 'self' and 'unsafe-inline', blocking ALL client-side JavaScript in Next.js 14.

3. **AbortError handlers should throw, not return objects.** Returning { error: '...' } on timeout created a type mismatch — callers expected a string but got an object, causing misleading downstream errors.

4. **Test deployments before confirming.** The CSP fix took several minutes to propagate through Vercel's edge network. Users should hard-refresh (Ctrl+Shift+R) after deployments.

---

# Phase 2 Audit Addendum — July 9, 2026

Covers all code added in Phases O (Propol AI Coach), P (Persona/Streaks), Q (Tools/Razorpay), R (Payment Integration), S (Search/Trade Detail/UI Restructure), and the Onboarding Redesign.

## Payment Security (Phase R) — HIGH PRIORITY

| ID | Area | Finding | Status | Notes |
|----|------|---------|--------|-------|
| P2-1 | Razorpay webhook | Webhook signature verification | ✅ IMPLEMENTED | lib/razorpay.js verifyWebhookSignature() uses HMAC SHA256 with RAZORPAY_WEBHOOK_SECRET. Called in /api/razorpay/webhook/route.js before processing any event. |
| P2-2 | Razorpay callback | Payment signature verification | ✅ IMPLEMENTED | lib/razorpay.js verifyPaymentSignature() verifies paymentId\|subscriptionId against razorpay_signature. Called in /api/razorpay/callback/route.js before marking subscription as paid. |
| P2-3 | Subscription state | Service-role client for webhooks | ✅ CORRECT | Webhook route uses createAdminClient (service-role key) since webhook requests have no user session. Subscription updates use .eq('user_id', ...) from the webhook payload user mapping. |
| P2-4 | Payment API routes | Auth protection | ✅ CORRECT | /api/razorpay/create-subscription and /api/razorpay/cancel-subscription both authenticate via getUser() and reject if no session. /api/razorpay/webhook is intentionally unauthenticated (Razorpay server-to-server) but protected by signature verification. |
| P2-5 | Subscription emails | HTML escaping | ✅ CORRECT | lib/subscription-emails.js templates use template literals for dynamic values (plan name, dates, amounts). No user-generated content is interpolated — values come from trusted server-side subscription data. |
| P2-6 | Env vars exposure | Client-side key leakage | ⚠️ NOTE | RAZORPAY_KEY_ID is NOT prefixed with NEXT_PUBLIC_ (correct — kept server-side). The checkout flow uses a hosted Razorpay page (redirect), not an embedded form, so no client-side key is needed. |

## AI Security (Phase O) — HIGH PRIORITY

| ID | Area | Finding | Status | Notes |
|----|------|---------|--------|-------|
| P2-7 | Guardrails engine | Hard-block pattern scanning | ✅ IMPLEMENTED | lib/guardrails.js scans every AI response for prohibited patterns (buy/sell/hold/predictions/leverage/sizing). If detected, entire response replaced with safe fallback. |
| P2-8 | Guardrails engine | System prompt injection | ✅ IMPLEMENTED | GUARDRAIL_SYSTEM_PROMPT injected into every AI call. Instructs model to never provide financial advice. Dual-layer: pre-prompt + post-response scan. |
| P2-9 | AI context depth | Data exposure limits | ✅ CORRECT | lib/tradeContext.js getUserTradeContext() respects plan depth limits: Basic 30 trades/30 days, Elite 90 trades. No cross-user data. All queries include .eq('user_id', userId). |
| P2-10 | AI rate limiting | Abuse prevention | ✅ IMPLEMENTED | DB-based rate limiting via ai_insights COUNT queries grouped by month. Basic: 3 analyses/mo + 1 review. Elite: 100/mo + 4 reviews. Enforced in server actions before AI calls. |
| P2-11 | Coach report storage | Data isolation | ✅ CORRECT | Coach reports INSERT into ai_insights with type='coach_report' and user_id. All reads filter by user_id. |
| P2-12 | AI model slug | Correct model | ✅ CORRECTED | Changed from deprecated `anthropic/claude-3-5-haiku` to `anthropic/claude-haiku-4.5`. OPENROUTER_MODEL env var can override. |

## Search Security (Phase S) — MEDIUM PRIORITY

| ID | Area | Finding | Status | Notes |
|----|------|---------|--------|-------|
| P2-13 | Search API | User data isolation | ✅ CORRECT | /api/search/route.js authenticates via getUser(), then passes user.id to all search functions in lib/search.js. Every searchTrades/searchJournal/searchCoach/searchSetups/searchExpenses/searchTrophies call includes .eq('user_id', userId). |
| P2-14 | AI search parsing | Elite-only gating | ✅ CORRECT | /api/search/ai-parse/route.js checks plan access (elite/beta/admin) before calling OpenRouter. Basic users get keyword search only. |
| P2-15 | Search input | Injection prevention | ✅ CORRECT | Search queries are passed directly to Supabase .ilike() which parameterizes them (no raw SQL). AI parse route sends user query in a structured prompt with explicit instruction not to generate SQL. |

## Data Integrity (Phases O-S) — MEDIUM PRIORITY

| ID | Area | Finding | Status | Notes |
|----|------|---------|--------|-------|
| P2-16 | select('*') cleanup | Additional replacements | ✅ DONE | Post-audit: select('*') replaced with explicit column lists in trades/actions.js (analyzeTrade), coach/actions.js (generateCoachReport), trade detail page, and /api/analyze-trade/route.js. This was forced by the r_multiple column drop/re-add saga. |
| P2-17 | r_multiple column | Schema stability | ✅ RESOLVED | Column was dropped (migration 0033) causing PostgREST schema cache crashes, then re-added as empty nullable (migration 0034). Column exists in DB but is never populated or displayed. All select('*') queries on trades table have been replaced with explicit column lists. |
| P2-18 | analyzeTrade journal fetch | Missing user_id filter | ✅ FIXED | Fixed in commit 09318f0: analyzeTrade was fetching journal via .eq('trade_id', tradeId) WITHOUT .eq('user_id', user.id). Now includes user_id filter. |
| P2-19 | Trade detail page | User isolation | ✅ CORRECT | app/dashboard/trades/[id]/page.js fetches trade, journal, and ai_insight all with .eq('user_id', user.id). |
| P2-20 | Habit tracking | DB tables present but unwired | ⚠️ NOTE | habits and habit_logs tables (migration 0030) exist in DB with RLS. The UI was built then REMOVED per user request (commit 6f56f2b). Backend actions (habit-actions.js) still exist but are not called from any UI. Tables are harmless but could be cleaned up. |

## New Components Security Review (Phases R-S)

| ID | Component | Finding | Status | Notes |
|----|-----------|---------|--------|-------|
| P2-21 | BlurGate / UpgradeModal | Feature gating bypass | ✅ CORRECT | BlurGate is UI-only (blur overlay). Actual limits enforced server-side in actions (analyzeTrade, generateCoachReport check ai_insights count). Users cannot bypass by removing the blur client-side. |
| P2-22 | QuickActions FAB | Navigation only | ✅ SAFE | Links to existing authenticated routes. No data mutations. |
| P2-23 | HeaderAvatar dropdown | Admin panel link | ✅ CORRECT | Admin panel link only shown when isAdmin=true (server-computed). /admin route protected by middleware. |
| P2-24 | OnboardingChecklist | localStorage usage | ✅ ACCEPTABLE | Bonus step (share PnL card) tracked via localStorage key `pl_first_share`. Non-sensitive — only tracks whether the user has shared once. Checklist progress (steps 1-4) computed server-side from DB. |
| P2-25 | AnalyzeButton | API route pattern | ✅ CORRECT | Uses fetch to /api/analyze-trade (POST) instead of direct server action import (which caused SSR crashes). API route authenticates, checks plan limits, and performs analysis with full error reporting. |
| P2-26 | JournalInlineEdit | File upload security | ✅ CORRECT | Uses processImageFile() for WebP conversion (5MB limit). Uploads to screenshots bucket with userId/tradeId/ path prefix (required by RLS). Ownership verified via .eq('user_id', user.id) on all updates. |
| P2-27 | SearchBar | Cmd+K keyboard shortcut | ✅ SAFE | Client-side focus shortcut only. Search itself goes through authenticated API route. |
| P2-28 | SubscriptionBanner | Subscription data display | ✅ CORRECT | Receives subscription data from server-side layout fetch. No client-side subscription queries. |

## Public Pages Security (Phase R)

| ID | Page | Finding | Status | Notes |
|----|------|---------|--------|-------|
| P2-29 | /pricing | Static page | ✅ SAFE | No user data, no API calls. Static plan comparison. |
| P2-30 | /about | Static page | ✅ SAFE | Product-focused. No user data. |
| P2-31 | /contact | Static page | ✅ SAFE | Email address display only. No forms submitting to backend. |
| P2-32 | /refund-policy | Static page | ✅ SAFE | Legal text only. |
| P2-33 | /tools, /tools/consistency-calculator | Public tool | ✅ SAFE | Client-side calculator with no backend calls. No auth required. Inputs are not sent to any server. |

## Phase 2 Addendum Summary

- **Total new findings reviewed:** 33
- **Security issues found:** 0 new critical/high issues
- **Corrections to original audit:** 1 (AI model slug update)
- **Notes/recommendations:** 2 (env var exposure check, orphaned habit tables)
- **All payment security patterns:** Verified correct (webhook signatures, callback verification, server-side keys, service-role client)
- **All AI guardrails:** Verified correct (dual-layer, hard-block, prompt injection defense)
- **All data isolation:** Verified correct (.eq('user_id') on all queries, server-side gating)

## Updated Lessons Learned (Phase 2)

5. **Never drop Supabase columns without replacing all select('*') first.** Dropping r_multiple caused PostgREST schema cache crashes on every trades query. Ship code removing references first, deploy, then run DROP migration. Or better: keep the column empty.

6. **Always fetch files from exact git commit SHA for reverts.** Using raw.githubusercontent.com serves cached content. Use github__get_file_contents with the `ref` parameter. A stale-file revert broke the entire dashboard layout (missing SearchBar, LiveClock, QuickActions, HeaderAvatar).

7. **Vercel silently serves old deploys on build failure.** The agent has no access to build logs. If a push doesn't appear live after ~90s, check if a brand-new route 404s — if so, the build failed and NO recent commits deployed.

8. **Server action imports in client components can cause opaque SSR crashes.** Wrap mutating server actions in API routes (fetch-based) for client component consumption. Example: /api/analyze-trade wraps analyzeTrade.

9. **Infinity cannot be serialized as Next.js Server→Client props.** Plan limits returning Infinity for unlimited features must be converted to a sentinel (-1) before passing to client components.

10. **processImageFile() returns { file, preview, error }, not a raw File.** Pass .file to Supabase upload. Passing the wrapper object causes silent upload failures.
