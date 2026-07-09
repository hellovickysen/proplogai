# PropLogAI — Developer Handover Guide

## 1. Read This First

PropLogAI is an AI-powered trading journal SaaS for Indian prop traders. It helps traders log trades (manual + screenshot OCR), get AI coaching from "Propol" (Claude Haiku 4.5 via OpenRouter), track performance stats, and improve discipline through behavioral pattern recognition.

**Repository:** [github.com/hellovickysen/proplogai](https://github.com/hellovickysen/proplogai) — `main` branch

**Stack:** Next.js 14 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind CSS + OpenRouter AI

**Deployment:** Vercel auto-deploys on every push to `main`. Deploys take ~60 seconds. There is no staging environment — `main` is production.

**Three documents you must read:**
1. **system-prompt.md** — Product context, user persona, feature specs, AI coaching rules
2. **tech-doc.md** — Technical reference: database schema, API routes, component tree, auth flow
3. **This file (handover-guide.md)** — Hard-won lessons, anti-patterns, safe editing workflow

---

## 2. Critical Errors Encountered & How They Were Solved

### a) PostgREST Schema Cache Crash

**What happened:** Dropping a Supabase column (`r_multiple`) while code still used `select('*')` caused runtime crashes on every page querying that table.

**Why:** PostgREST caches the database schema. After the column was dropped, PostgREST still expected it to exist. The Vercel build succeeded (no compile-time SQL validation), but every request that hit that table crashed at runtime.

**How it was fixed:** Re-added the column as an empty nullable column (migration 0034) to restore schema compatibility.

**Lesson:** NEVER drop columns that appear in `select('*')` queries. Either replace ALL `select('*')` calls with explicit column lists first and deploy that change, or keep the column empty. After any DDL change, run `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor.

---

### b) Stale File Revert Disaster

**What happened:** When reverting a change, the agent used a cached version of `layout.js` fetched from `raw.githubusercontent.com` instead of fetching the exact file from the correct git commit. The "reverted" file was from an old version missing `SearchBar`, `LiveClock`, `QuickActions`, and `HeaderAvatar` components — completely breaking the dashboard layout.

**Why:** `raw.githubusercontent.com` serves cached content and does not guarantee the latest version of a file. The URL does not pin to a specific commit.

**How it was fixed:** Fetched the file at the exact parent commit SHA using the GitHub API (`get_file_contents` with the `ref` parameter).

**Lesson:** ALWAYS fetch files from a specific git commit SHA, never from `raw.githubusercontent.com` (which can serve cached/stale content). Use `github__get_file_contents` with the `ref` parameter set to the exact commit before your changes.

---

### c) Vercel Silent Build Failures

**What happened:** When a push causes a build error, Vercel silently keeps serving the LAST successful build. The agent has no access to Vercel build logs. Symptoms: pushed code appears on GitHub but the live site shows old content.

**Why:** Vercel's default behavior is to keep the last working deployment active if a new build fails. There is no webhook or API notification of build failure available to the agent.

**Common causes:**
- Adjacent JSX root elements without a fragment wrapper
- Unused or duplicate imports
- Client/server import violations

**How it was fixed:** Verify by checking if a brand-new route 404s — if it does, NONE of the recent commits deployed. Ask the user to paste the Vercel build log error.

**Lesson:** Never assume a push deployed successfully. Verify after ~90 seconds. If changes do not appear, suspect a silent build failure.

---

### d) Server Components Render Crash from Direct Server Action Import

**What happened:** Importing a mutating server action directly into a client component caused opaque "Server Components render" errors in production.

**Why:** Next.js App Router has strict boundaries between server and client components. Direct imports of server actions into client components can cause serialization failures that only surface in production builds.

**How it was fixed:** Wrapped the server action in a fetch-based API route (e.g., `/api/analyze-trade/route.js`) and had the client component fetch that endpoint instead, then call `window.location.reload()`.

**Lesson:** Prefer API route wrappers over direct server action imports for client-triggered mutations.

---

### e) JSX Root Element Build Failure

**What happened:** Adding a sibling component (like a footer) to a page's return statement without wrapping in a fragment (`<>...</>`) caused a Next.js build failure. Vercel silently served stale content.

**Why:** JSX requires a single root element. Adjacent elements without a wrapper are a syntax error that the build catches but Vercel does not surface to the agent.

**Lesson:** Always verify the return statement has a single root element or fragment wrapper after inserting sibling components.

---

### f) AI JSON Truncation

**What happened:** Large nested JSON schemas in AI prompts got truncated mid-response even at 3000 `max_tokens`, causing `JSON.parse` failures.

**Why:** Deeply nested JSON schemas with verbose descriptions consume significant token budget in the AI response. The model runs out of output tokens before completing the JSON.

**How it was fixed:** Simplified the JSON schema (merged redundant keys, shortened descriptions, capped arrays to "max 3-4 items"), and made `extractJson()` resilient (strips markdown code fences, repairs truncated JSON by closing open strings/arrays/objects).

**Lesson:** Prefer compact JSON schemas over deeply nested ones. Build resilient JSON parsing that handles truncation.

---

### g) Infinity Serialization Crash

**What happened:** Passing `Infinity` (from plan limits for unlimited features) as a prop from a Server Component to a Client Component silently crashed the page.

**Why:** Next.js serializes props as JSON when crossing the server/client boundary. `JSON.stringify(Infinity)` produces `null`, which causes downstream failures.

**How it was fixed:** Convert `Infinity` to sentinel value `-1` before passing as props; client code treats `-1` as unlimited.

**Lesson:** Next.js cannot serialize `Infinity` as JSON. Use sentinel values for unlimited quantities.

---

### h) Dangling Operator Build Failure

**What happened:** When removing a term from a multi-line string concatenation (e.g., removing `' R=' + t.r_multiple`), a dangling `+` operator was left at the end of the previous line, causing an "Expression expected" build error.

**Why:** Partial edits to multi-line expressions can leave syntactically invalid trailing operators.

**Lesson:** After any concatenation edit, verify the expression terminates cleanly with no dangling operators.

---

### i) computeStats Field Removal Cascade

**What happened:** Removing `avgR` from `computeStats`' return value broke `lib/tradeContext.js` which still referenced it, causing `ReferenceError` on every AI call.

**Why:** Shared helper functions are consumed by multiple files. Removing a field from the return value without updating all consumers causes runtime errors.

**Lesson:** When removing a field from a shared helper's return value, grep the ENTIRE codebase for every reference before shipping.

---

### j) processImageFile Return Value

**What happened:** `processImageFile` returns a wrapper object `{ file, preview, error }`, NOT a raw File. Passing the wrapper directly to Supabase upload caused silent "Upload failed" errors.

**Why:** The function wraps the processed file in an object that includes error state and preview URL. Supabase expects a raw `File` or `Blob`.

**Lesson:** Always use `processed.file` and check `processed.error` first.

---

### k) Supabase Storage Path RLS

**What happened:** Uploads to the `screenshots` bucket failed silently when the storage path was not prefixed with the user's ID.

**Why:** The bucket's Row Level Security (RLS) policies require that upload paths begin with the authenticated user's ID.

**Lesson:** All uploads MUST use a path prefixed with the user's ID (e.g., `userId/tradeId/filename.webp`).

---

### l) HTML Entities in JSX

**What happened:** HTML entities like `&#10003;` rendered as LITERAL TEXT inside JSX curly-brace expressions instead of the intended character.

**Why:** JSX expressions (`{}`) treat content as JavaScript strings. HTML entities are only interpreted as markup between JSX tags, not inside expressions.

**How it was fixed:** Use actual Unicode characters (`'✓'`) inside expressions.

**Lesson:** Never use HTML entities inside JSX expressions. Use Unicode characters or String.fromCodePoint() instead.

---

## 3. Anti-Patterns — What NOT To Do

1. **DO NOT make global CSS changes** (`globals.css` html/body overflow-x, width, max-width) to fix a page-scoped bug — it breaks other pages (calendar shrank, sidebar sticky broke). Fix the specific element.

2. **DO NOT add `overflow-x: hidden` to html/body** — it breaks `position: sticky` on the Sidebar.

3. **DO NOT add `'strict-dynamic'` to CSP** — Next.js 14 does not use nonce-based CSP. `strict-dynamic` blocks ALL client-side JS.

4. **DO NOT rewrite entire page files for targeted fixes** — surgical edits only. A prior audit agent destroyed `dashboard/page.js` and `coach/page.js` by rewriting them.

5. **DO NOT use `select('*')` on tables where columns might be dropped** — use explicit column lists.

6. **DO NOT drop Supabase columns without first removing ALL code references and deploying that change.** Ship code first, then run the DROP migration.

7. **DO NOT rely on RLS alone for data isolation** — EVERY authenticated Supabase query MUST include `.eq('user_id', user.id)`.

8. **DO NOT fire-and-forget async calls on Vercel serverless** — always `await`. Vercel kills background promises after the response is sent.

9. **DO NOT pass `Infinity` as props from Server to Client components** — convert to `-1` sentinel.

10. **DO NOT use `raw.githubusercontent.com` for fetching "current" file content** — it serves cached versions. Use the GitHub API with a specific commit ref.

11. **DO NOT push binary files via GitHub MCP (`github__push_files`)** — it stores raw base64 TEXT, not decoded binary. Images will be broken.

12. **DO NOT hardcode admin email** — use `ADMIN_EMAIL` env var.

13. **DO NOT show estimated profit figures prominently in AI output** — reads as a promise of returns, legally risky.

14. **DO NOT use font sizes below `text-xs` (12px) for body/labels or `text-[10px]` for mono micro-labels on the dark theme** — becomes unreadable.

15. **DO NOT use text opacity below `text-white/35` for the faintest micro-labels** — invisible on dark background.

16. **DO NOT relocate or restyle working UI unless explicitly asked** — prefer minimal surgical edits.

17. **DO NOT add new features without plan approval** — always present plan in Thread Context Doc and get explicit approve/request-changes confirmation via AskQuestion BEFORE executing.

18. **DO NOT assume a push deployed** — Vercel may have failed silently. Verify after ~90 seconds.

---

## 4. Current Dashboard Layout Architecture

```
<div class="flex min-h-screen">
  <Sidebar email fullName avatarUrl planAccess credits />     <- Desktop only, collapsible (60px rail / 200px expanded)
  <div class="flex min-w-0 flex-1 flex-col">
    <header>                                                    <- Top bar
      <MobileNav ... />                                         <- Mobile hamburger (sm:hidden)
      <Logo />                                                  <- Mobile logo (sm:hidden)
      <Today P&L chip />                                        <- Desktop only (hidden sm:flex)
      <SearchBar planAccess />                                  <- Desktop only, centered
      <LiveClock />                                             <- Live local time
      <NotificationBell initialCount excludeTypes />
      <Today P&L chip />                                        <- Mobile only (flex sm:hidden)
      <HeaderAvatar ... />                                      <- Desktop only avatar dropdown
    </header>
    <main>
      <SubscriptionBanner />
      {children}                                                <- Page content
    </main>
    <RiskFooter />                                              <- Disclaimer footer
  </div>
  <QuickActions />                                              <- Floating FAB bottom-right (6 actions)
</div>
```

**Key components NOT in layout but used across pages:**
- `BlurGate` + `UpgradeModal` — Elite feature gating
- `ConfirmDialog` — delete confirmations
- `OnboardingChecklist` — "Train Your AI Coach" (replaces GuidedTour)
- Toast notifications — via toast system

---

## 5. Development Workflow — Safe Editing Pattern

Step-by-step process that works reliably:

1. **Plan first** — Write plan in Thread Context Doc, get explicit user approval via AskQuestion before touching code.

2. **Fetch current file from correct git commit** — Use `github__get_file_contents` with branch `"main"` (or a specific SHA). NEVER rely on cached URLs.

3. **Make surgical edits** — Only change what is needed. Do not rewrite entire files.

4. **Write files locally** — Save to `/tmp/proplogai-build/`.

5. **Build push payload** — Use Node.js to read files and create JSON payload. Write to `/tmp/proplogai-build/push.json`.

6. **Push via paramsFile** — `github__push_files` with `paramsFile` pointing to the JSON (avoids token truncation on large files). The JSON key for commit message MUST be `message` (not `commit_message`).

7. **Verify deployment** — Tell user to hard refresh (Ctrl+Shift+R). If change does not appear after ~90 seconds, the build may have failed.

8. **For reverts** — ALWAYS get the file from the exact commit before your changes using `github__get_file_contents` with `ref` parameter. Never reconstruct from memory.

**Key gotchas:**
- `github__push_files` requires key `message` not `commit_message`
- For large files, ALWAYS use `paramsFile` (write JSON to disk, pass path) — inline params get token-truncated
- After pushing a file that adds a new import, verify on `raw.githubusercontent.com` that the import line actually exists
- Vercel auto-deploys ~60 seconds after push. Build failures are SILENT — old deploy keeps serving.

---

## 6. Supabase & Database Rules

- All queries MUST include `.eq('user_id', user.id)` — even secondary fetches (journal_entries, ai_insights for a trade)
- Migrations go in `supabase/migrations/` as SQL files — user runs them MANUALLY in SQL Editor
- Write migrations idempotent: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP COLUMN IF EXISTS`
- Wrap `CREATE POLICY` in `DO $$ BEGIN IF NOT EXISTS ... END IF; END $$;` (there is no `CREATE POLICY IF NOT EXISTS` in Postgres)
- After any DDL (column drop/rename), run `NOTIFY pgrst, 'reload schema';` in SQL Editor
- Use PostgreSQL triggers for cross-user operations (referral rewards) — JS-based approaches fail on serverless
- Trading day boundary: midnight UTC = 5:30 AM IST. Use `getTradingDate()` / `getTradingMonth()` from `lib/stats.js`
- Trade queries must sort by `trade_date DESC, created_at DESC` (so same-day trades appear newest first)

**Storage buckets (all public):** screenshots, avatars, trophies
- Upload paths MUST be prefixed with user ID (e.g., `userId/tradeId/filename.webp`)
- All uploads go through `processImageFile()` for WebP conversion at quality 0.85
- Deleting a DB row does NOT auto-delete storage files — must call `supabase.storage.from(bucket).remove([path])`

---

## 7. AI Integration Details

- **Provider:** OpenRouter -> Claude Haiku 4.5 (slug: `anthropic/claude-haiku-4.5`)
- **Coach name:** "Propol" — used in all UI references
- NEVER gives financial advice — educational/behavioral coaching only
- **Dual-layer guardrails:** system prompt instructions + post-response scan (`lib/guardrails.js`)
- **Hard-block terms:** buy, sell, hold, entry, exit, TP, SL, position sizing, leverage, predictions
- User notes wrapped in `<trader_note>` tags for prompt injection defense
- **Rate limits:** Basic 3 analyses/mo + 1 review; Elite 100/mo + 4 reviews
- **Context depth:** Basic 30 trades; Elite 90 trades (`lib/tradeContext.js`)
- **Timeout:** 25 seconds via AbortController
- AI insights stored in `ai_insights` table: `summary` = plain text, `mistakes` = structured JSON object
- When rendering AI analysis, read from `aiInsight.mistakes` (jsonb), NOT by `JSON.parse(aiInsight.summary)`
- Prefer compact JSON schemas — deeply nested structures truncate. `extractJson()` strips code fences and repairs truncated JSON.
- Coach reports INSERT (not UPDATE) for history tracking
- **Copy rules:** avoid "You should" -> use "Your journal suggests"; avoid "Always" -> use "Historically"; never show estimated profit figures prominently

---

## 8. UI/UX Design Principles (User Preferences)

These are the user's (Varun Sen, founder) strong preferences accumulated over months:

- **Visual-first, low-text density** — icons + short one-liners over paragraphs, dashboard-style widgets over text-heavy cards
- **Consolidate buttons** — merge related buttons into single dropdown (e.g., one Share button -> P&L Card + Journal Link)
- **Always-visible controls** — persistent search bar (not Cmd+K only), floating FAB, in-page lightbox (not new tabs)
- **Mobile-compact scoped to mobile only** — use responsive classes (base=compact, sm:=original). Never shrink desktop.
- **Plain English AI copy** — "Stick to your planned stop-loss" not "Stop-loss size discipline". Like explaining to a friend.
- **Dark theme readability floor** — minimum `text-xs` (12px) body, `text-[10px]` mono micro-labels, `text-white/35` minimum opacity
- **Plan before execute** — always present plan and get approval before multi-file changes
- **When a bug report is ambiguous** — ask clarifying questions with concrete options before diagnosing
- **Don't over-correct** — if a feature is reported as broken, build the missing capability rather than removing the element entirely
- **Onboarding = "Train Your AI Coach"** narrative, not a settings checklist

---

## 9. Design System Quick Reference

| Element | Value |
|---|---|
| Background (primary) | `#07070b` |
| Background (secondary) | `#0b0b14` |
| Background (calendar) | `#12121a` |
| Font (display/body) | Poppins |
| Font (mono) | JetBrains Mono |
| Gradient accent | `linear-gradient(120deg, #a78bfa, #22d3ee)` (violet to cyan) |
| Profit color | `#34d399` (emerald-400) |
| Loss color | `#f87171` (red-400) |
| Accent color | `#fbbf24` (amber-400) |
| Cards | `rounded-2xl border border-white/10 bg-white/[0.03] p-5` |
| Buttons (primary) | gradient bg, `text-[#08080f]`, `rounded-xl` |
| Labels | `font-mono text-xs uppercase tracking-wider text-white/55` |
| Direction: Long | blue pill with SVG up-trend icon |
| Direction: Short | red pill with SVG down-trend icon |

---

## 10. Environment Variables

**Required (already set in Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`

**Optional (already set):**
- `OPENROUTER_MODEL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`

**Payment (NOT yet configured — needed for Razorpay go-live):**
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PLAN_ID_MONTHLY`
- `RAZORPAY_PLAN_ID_YEARLY`

---

## 11. Subscription & Plan System

- **Basic** ($0) vs **Elite** ($9.99/mo or $7.99/mo yearly, 14-day free trial)
- `is_beta` flag on `user_preferences` bypasses all gates (admin-toggleable)
- Admin (`ADMIN_EMAIL`) has unrestricted access
- Plan logic centralized in `lib/plans.js` (`PLANS`, `FEATURES`, `getUserAccess`, `buildAccess`)
- Feature gating: `BlurGate` component for UI, server-side checks in actions
- Razorpay hosted checkout flow (redirect, not embedded)
- Subscription lifecycle emails in `lib/subscription-emails.js`

---

## 12. Key File Locations

| Purpose | Path |
|---|---|
| Dashboard layout | `app/dashboard/layout.js` (THE critical file — header, sidebar, notifications, subscriptions) |
| Trade form | `components/trades/TradeForm.js` |
| AI engine | `lib/ai.js` (`analyzeTrade`, `generateCoachReport`) |
| Guardrails | `lib/guardrails.js` |
| Trade context for AI | `lib/tradeContext.js` |
| Plan/feature gating | `lib/plans.js` |
| Stats computation | `lib/stats.js` (`computeStats`, `getTradingDate`) |
| Persona engine | `lib/persona.js` |
| Search | `lib/search.js` + `app/api/search/route.js` |
| Onboarding | `lib/onboarding.js` + `components/dashboard/OnboardingChecklist.js` |
| Payment | `lib/razorpay.js` + `app/api/razorpay/*/route.js` |
| Image processing | `lib/imageUtils.js` (`processImageFile`) |
| Sidebar | `components/layout/Sidebar.js` |
| Mobile nav | `components/layout/MobileNav.js` |
| Header: SearchBar | `components/layout/SearchBar.js` |
| Header: LiveClock | `components/layout/LiveClock.js` |
| Header: HeaderAvatar | `components/layout/HeaderAvatar.js` |
| Header: NotificationBell | `components/layout/NotificationBell.js` |
| FAB | `components/layout/QuickActions.js` |
| Coach hub | `components/coach/PropolCoachHub.js` (4 tabs) |
| Expense tracker | `components/expenses/ExpenseTracker.js` (60KB+ single file with FirmDashboard sub-component) |

---

## 13. Remaining Roadmap

1. **Telegram bot** — log trades from chat
2. **Cross-user pattern intelligence** — anonymized aggregate insights
3. **Set Razorpay production env vars** and go live with billing
4. **Tier 3 "Ask Propol" search summary**
5. **Mobile sticky bottom navigation bar** — fixed bottom nav for quick mobile access

---

## 14. Quick Checklist Before Any Code Change

- [ ] Did I fetch the CURRENT file from the correct git commit (not a cached URL)?
- [ ] Did I present a plan and get user approval?
- [ ] Does every Supabase query include `.eq('user_id', user.id)`?
- [ ] Did I check for `Infinity` values being passed as props?
- [ ] After removing a shared helper field, did I grep for all references?
- [ ] Does the JSX return have a single root element or fragment?
- [ ] Am I using `paramsFile` for large GitHub pushes?
- [ ] Did I tell the user to hard refresh after deploy?
- [ ] If I dropped a column, did I ship the code removal FIRST?
