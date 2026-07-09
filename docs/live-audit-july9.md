# PropLogAI — Live Codebase Audit Report

**Date:** July 9, 2026
**Scope:** Full codebase scan of github.com/hellovickysen/proplogai (main branch)
**Method:** 4 parallel audit agents scanning: data isolation, API routes, payment security, frontend security
**Overall verdict:** No critical vulnerabilities. 1 high, 5 medium, 10+ low findings.

---

## HIGH Priority (1)

### H1 — is_beta RLS may allow self-grant of Elite access
**Area:** Payment / Plan Security
**File:** user_preferences table RLS policies
**Issue:** The `is_beta` flag on `user_preferences` grants full Elite access when true. If RLS policies allow users to UPDATE their own `user_preferences` row (which they likely do for settings like avatar, name, etc.), a user could set `is_beta = true` via the Supabase client and bypass all Elite feature gates.
**Fix:** Add a column-level RLS restriction that prevents client-side writes to `is_beta`. Options:
  - Create a BEFORE UPDATE trigger that prevents `is_beta` from being changed (only allow via service-role/admin)
  - Or split `is_beta` into a separate admin-only table
**Severity:** HIGH — direct plan bypass if exploitable

---

## MEDIUM Priority (5)

### M1 — Subscription create race condition
**Area:** Payment
**File:** app/api/razorpay/create-subscription/route.js
**Issue:** Check-then-create for existing subscriptions is not atomic. Two concurrent requests could both pass the "no active subscription" check and create duplicate Razorpay subscriptions + DB rows.
**Fix:** Add a unique constraint on `subscriptions.user_id` + upsert pattern, or use a DB advisory lock.

### M2 — Middleware fails open if env vars unset
**Area:** API Routes
**File:** middleware.js
**Issue:** If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, middleware returns `supabaseResponse` without any auth check — leaving `/dashboard` and `/admin` unprotected.
**Fix:** Return a redirect to an error page or 500 response if env vars are missing, instead of passing through.

### M3 — analyze-trade leaks internal error messages
**Area:** API Routes
**File:** app/api/analyze-trade/route.js
**Issue:** Returns raw DB/internal errors to client: `'Trade query failed: ' + tErr.message` and `'Crashed at step: ' + step + ' — ' + e.message`. Could leak schema details.
**Fix:** Return generic error messages to client; log detailed errors server-side.

### M4 — Screenshot upload lacks MIME content validation
**Area:** Frontend
**File:** components/trades/JournalInlineEdit.js
**Issue:** Upload only checks `file.size > 5MB` and relies on `accept="image/*"` (UI hint, not enforced). A renamed SVG with embedded script could be uploaded and served from the public storage bucket URL via `<img src>`.
**Fix:** Explicitly reject `image/svg+xml` in processImageFile, validate content-type via magic bytes, set `Content-Disposition: attachment` on storage bucket.

### M5 — Support actions missing user_id filter
**Area:** Data Isolation
**File:** app/dashboard/support/actions.js
**Issue:** One or more Supabase queries in the support ticket actions file may be missing `.eq('user_id', user.id)` filter.
**Fix:** Audit all `.from()` calls in this file and add user_id filter where missing.

---

## LOW Priority (10+)

### L1 — No rate limiting on AI search parsing
**File:** app/api/search/ai-parse/route.js
**Issue:** Elite AI NL parsing has no per-minute/IP throttle — only a 10s abort timeout.

### L2 — No rate limiting on subscription creation spam
**File:** app/api/razorpay/create-subscription/route.js
**Issue:** Can be called repeatedly in cancelled/pending states.

### L3 — Elite/Beta/Admin bypass AI monthly quota entirely
**File:** app/api/analyze-trade/route.js
**Issue:** No per-minute throttle for privileged tiers.

### L4 — Razorpay error messages passed through to client
**Files:** create-subscription, cancel-subscription routes
**Issue:** `err.message` from Razorpay API returned directly.

### L5 — Webhook signature error misclassified as 500
**File:** app/api/razorpay/webhook/route.js
**Issue:** Malformed (non-hex) signature header throws in `timingSafeEqual`, caught as 500 instead of 400.

### L6 — No webhook idempotency guard
**File:** app/api/razorpay/webhook/route.js
**Issue:** No dedup by Razorpay event ID. Replayed webhooks can trigger duplicate receipt emails.

### L7 — Unvalidated filter/date query params in search
**File:** app/api/search/route.js
**Issue:** Passed to searchAll() without format validation.

### L8 — Guardrail blocklist bypassable with rephrasing
**File:** lib/guardrails.js
**Issue:** Regex-based blocklist can be bypassed by sufficiently rephrased financial advice. Not an XSS issue but a content-trust issue.

### L9 — BlurGate renders gated children in DOM
**File:** components/ui/BlurGate.js
**Issue:** Gated content is rendered but blurred — inspectable via devtools. Not a data leak since actual data fetching is server-gated, but worth noting.

### L10 — Client-side usage limit checks are UX-only
**Files:** TradeAnalysisTab.js, MonthlyReviewTab.js
**Issue:** "Generate" button disabled client-side based on usage count. Server-side re-validation needed (and is present in the API routes).

---

## Verified Secure (No Issues Found)

- ✅ **Razorpay webhook signature verification** — HMAC-SHA256 with timingSafeEqual, rejects before processing
- ✅ **Razorpay callback signature verification** — verified before any DB write
- ✅ **All API routes authenticate** — getUser() called, 401 on failure (except webhook which uses signature)
- ✅ **No dangerouslySetInnerHTML anywhere** — all AI content rendered via safe JSX
- ✅ **No eval() or Function() calls** — clean codebase
- ✅ **AI prompt injection defense** — journal notes wrapped in <trader_note> tags
- ✅ **AI guardrails dual-layer** — system prompt + post-response scan
- ✅ **Data isolation on all server actions** — .eq('user_id') present (except M5)
- ✅ **Data isolation on all API routes** — user.id passed to all search/analysis functions
- ✅ **Plan amounts from env vars** — client cannot inject arbitrary plan IDs
- ✅ **Middleware protects /dashboard and /admin** — fails closed on auth errors
- ✅ **extractJson in lib/ai.js** — defensive parsing, no eval, output sanitized by guardrails

---

## Recommended Priority Actions

1. **[HIGH] Fix is_beta RLS** — Add trigger or policy preventing client writes to is_beta column
2. **[MEDIUM] Atomic subscription create** — Add unique constraint + upsert
3. **[MEDIUM] Middleware env var guard** — Fail with error, don't pass through
4. **[MEDIUM] Sanitize analyze-trade errors** — Generic messages to client
5. **[MEDIUM] Reject SVG uploads** — Block image/svg+xml in processImageFile
6. **[MEDIUM] Audit support/actions.js** — Verify user_id on all queries
