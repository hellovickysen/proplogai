# PropLogAI — Technical Documentation

Comprehensive technical reference for the PropLogAI codebase. Last updated: July 9, 2026 (Onboarding Redesign + R-Multiple Removal + Inline Trade Analysis, post-Phase R).

## 1. Architecture Overview

PropLogAI is a fully serverless Next.js 14 application using the App Router pattern:
- **Server Components** fetch data directly from Supabase on each request
- **Server Actions** (files named actions.js in route directories) handle all mutations
- **Client Components** (marked with 'use client') handle interactivity (forms, modals, animations)
- **Middleware** refreshes auth sessions and protects /dashboard + /admin routes
- **Auto-deploy**: every push to main triggers Vercel deployment (~60s)

### Request Flow
```
User → Vercel Edge (middleware: auth refresh) → Server Component (Supabase queries) → HTML + RSC payload → Client hydration
User action → Server Action (Supabase mutation) → revalidatePath → fresh Server Component render
User → Razorpay hosted checkout (redirect) → Razorpay webhook → /api/razorpay/webhook → Supabase (subscriptions) → subscription-emails
```

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | Server Components + Server Actions |
| Styling | Tailwind CSS + Poppins/JetBrains Mono | Dark theme, violet→cyan gradient accent |
| Database | Supabase PostgreSQL | Row Level Security on all tables |
| Auth | Supabase Auth (@supabase/ssr) | Cookie-based, email+password + Google OAuth |
| Storage | Supabase Storage | 3 public buckets: screenshots, avatars, trophies |
| AI | OpenRouter → Claude 3.5 Haiku | 25s timeout, prompt injection defense |
| Email | Resend (fetch-based) | Coach report + subscription lifecycle emails, HTML-escaped AI content |
| Payments | Razorpay | Hosted checkout (redirect flow), webhooks, subscription lifecycle (Phase R) |
| Analytics | PostHog | CDN snippet, free tier |
| Hosting | Vercel (free tier) | Custom domain: proplogai.com |

## 3. Project Structure

```
proplogai/
├── app/
│   ├── layout.js              # Root layout (fonts, PostHog, Toast)
│   ├── page.js                # Landing page (ISR revalidate=300, LandingNav + LandingFooter)
│   ├── login/page.js          # Auth page (email+password, Google OAuth)
│   ├── onboarding/            # New user onboarding flow
│   ├── about/page.js          # Product-focused About page (Phase R)
│   ├── contact/page.js        # Contact page with email support (Phase R)
│   ├── refund-policy/page.js  # 7-section refund policy (Phase R)
│   ├── (landing)/
│   │   └── pricing/page.js    # Standalone pricing comparison page (Phase R)
│   ├── dashboard/
│   │   ├── layout.js          # Dashboard shell (sidebar, header, nav, subscription fetch + SubscriptionBanner + trial email trigger; GuidedTour removed, OnboardingChecklist rendered instead)
│   │   ├── page.js            # Main dashboard (stats, charts, discipline, BlurGate on share button, OnboardingChecklist)
│   │   ├── trades/            # Trade list, detail, new, edit + actions (BlurGate on CSV export; trade detail page has inline "Analyze this trade" via AnalyzeButton.js + /api/analyze-trade)
│   │   ├── calendar/          # P&L calendar (dual desktop/mobile render, BlurGate on CalendarInsights)
│   │   ├── coach/             # AI coach report + actions (planAccess passed to PropolCoachHub)
│   │   ├── rulebook/          # Setup CRUD (8 defaults) + actions (planAccess + customSetupLimit)
│   │   ├── expenses/          # Expense tracker (3-tab) + actions
│   │   ├── trophies/          # Trophy wall + actions
│   │   ├── referrals/         # Referral dashboard + actions
│   │   ├── settings/          # User settings + actions (BillingTab + subscription data)
│   │   ├── support/           # Support tickets + actions
│   │   ├── notifications/     # Notification list + actions
│   │   └── tools/             # Tool card grid; tools/consistency-calculator/ (Consistency Calculator)
│   ├── admin/                 # Admin panel (overview, users, tickets, AI, revenue) + actions.js (toggleBeta())
│   ├── profile/[code]/        # Public trader profile
│   ├── trade/[shareId]/       # Shared trade journal (24h expiry)
│   ├── trophy/[id]/           # Public trophy page
│   ├── r/[code]/              # Referral redirect
│   ├── auth/callback/         # OAuth + email verification handler
│   ├── privacy/               # Privacy policy (ISR daily, Razorpay data-handling subsection + LandingNav/Footer)
│   ├── terms/                 # Terms of service (ISR daily, sections 11-13 billing/payments/refunds + LandingNav/Footer)
│   ├── tools/                 # Public tools landing (SEO, LandingNav + LandingFooter); tools/consistency-calculator/ (public Consistency Calculator page, LandingNav + LandingFooter)
│   └── api/
│       ├── logo/               # PNG logo for email templates
│       ├── analyze-trade/      # NEW — inline trade analysis API route for the trade detail page, with step-by-step error reporting
│       └── razorpay/           # Razorpay API routes (Phase R)
│           ├── create-subscription/route.js   # Creates Razorpay subscription, returns hosted checkout short_url
│           ├── webhook/route.js                # Verifies + handles Razorpay webhook events
│           ├── callback/route.js               # Post-checkout redirect handler, verifies payment signature
│           └── cancel-subscription/route.js    # Cancels a user's Razorpay subscription
├── components/
│   ├── ui/                    # Skeleton, Toast, EmptyStates, Fab, ConfirmDialog, BetaNotice, GuidedTour (still exists in the codebase but no longer imported/used anywhere — replaced by dashboard/OnboardingChecklist.js), PlanBadge, BetaFeatureWarning, UpgradeCard, BlurGate (Phase R), SubscriptionBanner (Phase R)
│   ├── layout/                # Sidebar, MobileNav, RiskFooter, PostHogProvider
│   ├── trades/                # TradeForm, TradeTable, TradeFilters, DeleteTradeButton, ExportButton, AnalyzeButton (NEW — client component powering inline "Analyze this trade" on the trade detail page, calls /api/analyze-trade)
│   ├── journal/                # JournalForm (screenshot limit notice), JournalSection (passes screenshotLimit), JournalView
│   ├── coach/                  # CoachReport, GenerateReportButton, EmailReportButton, AnalyzeButton, TradeAnalysisTab (upgrade CTA at limit), MonthlyReviewTab (upgrade CTA at limit)
│   ├── calendar/                # CalendarMonth, PnlCalendar, CalendarInsights (10 insight cards + Trade Win gauge, Elite-only via BlurGate)
│   ├── dashboard/               # DisciplineCards, WeeklyScoreRing, AchievementBadges, EquityChart, DashboardShareButton, OnboardingChecklist (NEW — persistent "Train Your AI Coach" dashboard checklist, replaces GuidedTour in the dashboard layout)
│   ├── expenses/                # ExpenseTracker
│   ├── trophies/                # TrophyWall (limit reached opens UpgradeModal)
│   ├── referrals/               # ReferralDashboard, ReferralCapture
│   ├── profile/                 # ProfileTradeList, PublicProfileSettings
│   ├── rulebook/                # RulebookPage (X/3 custom setup badge + limit state)
│   ├── settings/                # SettingsTabs, BillingTab (billing management UI, Phase R)
│   ├── admin/                   # AdminBanButton, AdminTradeList, AdminUserTabs, BetaCountControl
│   ├── onboarding/              # OnboardingFlow (rebuilt as a 4-step wizard: Welcome, Feature Showcase with 8 feature cards, Journal Setup with emotion/confidence picker, Ready screen)
│   ├── landing/                 # LandingMotion (IntersectionObserver animations), CursorGlow, CardGlow, LandingNav (Tools/Blog/Pricing/About links, 14-Day Trial badge, DefaultLogo, centered pill container), CookieBanner, LandingFooter (Lyrafin-style multi-column footer, Phase R)
│   ├── share/                   # ShareButton, ShareCard, ShareModal, ShareJournalButton, SharedScreenshots
│   ├── support/                 # SupportPage (conversation thread, reply form, close with transcript opt-out, multi-select bulk delete)
│   ├── notifications/           # NotificationBell, NotificationList
│   ├── tools/                   # ToolCard, ConsistencyCalculator
│   └── Logo.js                  # Logo + LogoMark components
├── lib/
│   ├── ai.js                   # OpenRouter integration (callOpenRouter, analyzeTradeWithAI, analyzeCoachReport, tradeToText, datasetToText)
│   ├── onboarding.js            # NEW — getOnboardingProgress server-side helper; computes OnboardingChecklist step progress from the DB
│   ├── email.js                # Resend integration (sendCoachReportEmail, sendTicketTranscript, sendTicketResolvedEmail, isEmailConfigured, escHtml)
│   ├── subscription-emails.js  # Razorpay lifecycle emails: trial ending, payment receipt, cancellation, payment failed (Phase R)
│   ├── razorpay.js             # Razorpay SDK wrapper: createSubscription, cancelSubscription, fetchSubscription, verifyWebhookSignature, verifyPaymentSignature (Phase R)
│   ├── stats.js                # computeStats (avgR removed from return value), equitySeries, equityChartData, fmtMoney, fmtMoneyCompact, num, getTradingDate, getTradingMonth — fmtR function removed
│   ├── discipline.js           # computeDisciplineStats, computeWeeklyScore, computeEliteWeekStreak, calculateWeekScore
│   ├── achievements.js          # ACHIEVEMENT_DEFS, computeAchievements
│   ├── notifications.js         # notify, notifyAdmin, TYPES, NOTIFICATION_META
│   ├── quotes.js                 # Random motivational/neutral quotes by P&L range
│   ├── emotions.js               # DEFAULT_EMOTIONS, resolveEmotions
│   ├── security.js               # isDisposableEmail (200+ domains + subdomain check), validatePassword
│   ├── imageUtils.js             # processImageFile (WebP conversion, pdf.js with retry)
│   ├── plans.js                  # PLANS config, FEATURES limits, getUserAccess() (now also returns subscription status), buildAccess(), ELITE_FEATURES list (Phase R)
│   ├── tags.js                   # DEFAULT_TAGS, resolveTags(), MAX_CUSTOM_TAGS
│   └── supabase/
│       ├── client.js            # Browser Supabase client (with env var guard)
│       ├── server.js            # Server Supabase client (with env var guard)
│       └── admin.js             # Service role client + ADMIN_EMAIL from env
├── middleware.js                 # Auth refresh + route protection (/dashboard, /admin)
├── scripts/
│   └── cleanup-orphans.js       # Storage orphan cleanup script
├── next.config.mjs               # CSP headers, HSTS, image remotePatterns, optimizePackageImports
├── tailwind.config.js            # Custom colors (ink, mint, loss), content glob includes .ts/.tsx
└── supabase/migrations/          # SQL files 0001-0034 (includes 0032_clear_r_multiple.sql, 0032_setup_reference_images.sql, 0032_trophy_date.sql, 0033_bad_sl_setup.sql, 0033_drop_r_multiple.sql, 0034_restore_r_multiple.sql)
```

## 4. Database Schema

### Tables (15 total)

**trades** — Core trade log entries
- id, user_id, account_id, pair, direction, entry_price, exit_price, stop_loss, take_profit, lot_size, pnl, r_multiple (column retained but never populated or displayed — see migrations 0032-0034 below), setup (text), setup_id (uuid FK), setup_ids (jsonb array), setup_followed (yes/partial/no), no_setup_reason, timeframe, session, trade_date, opened_at, closed_at, share_id (uuid nullable), shared_until (timestamptz nullable), external_id, source, created_at

**journal_entries** — Trade journals (1:1 with trades via trade_id CASCADE)
- id, user_id, trade_id, note, emotions[], confidence, screenshot_url, screenshot_urls (jsonb), lesson (text, migration 0025), tags (text[], migration 0026), created_at

**ai_insights** — AI analysis results (cached)
- id, user_id, trade_id, type ('trade_analysis'|'coach_report'), summary, mistakes (jsonb), severity, created_at

**user_preferences** — Per-user settings
- id, user_id (UNIQUE), avatar_url, full_name (text, migration 0023), custom_emotions[], custom_setups[], default_confidence, onboarding_complete, share_code, show_calendar, show_trades, show_payouts, show_trophies, calendar_mode, calendar_start, calendar_end, calendar_rolling_days, referral_balance, referred_by, is_beta (boolean, default true, migration 0024), custom_tags (text[], migration 0026), created_at, updated_at

**setups** — Trading rulebook setups
- id, user_id, name, direction, description, is_default, is_active, sort_order, created_at, updated_at

**expenses** — Prop firm expenses
- id, user_id, firm_name, account_type, account_size, purchase_type, account_cost, num_accounts, total_cost, expense_date, notes, created_at

**payouts** — Prop firm payouts
- id, user_id, firm_name, amount, payout_date, notes, created_at

**trophies** — Achievement certificates/screenshots
- id, user_id, title, category, description, file_url, firm_name, is_public, share_id, created_at

**notifications** — In-app notifications (migration 0020)
- id, user_id, type, title, message, is_read, metadata (jsonb), created_at

**referral_codes** — User referral codes
- id, user_id, code (unique), created_at

**referrals** — Referral tracking
- id, referrer_id, referred_user_id (unique), referred_email, status, reward_given, created_at

**subscriptions** — Plan + billing management (Razorpay, Phase R)
- id, user_id, plan ('basic'/'elite', renamed from 'free'/'pro' in migration 0024), status, stripe_id, renews_at, created_at
- Migration 0031 additions: razorpay_subscription_id, razorpay_payment_id, billing_cycle, trial_ends_at, cancelled_at, last_payment_id, last_payment_at
- Index on razorpay_subscription_id (migration 0031)
- status CHECK constraint (migration 0031) updated to include: created, authenticated, pending, halted, cancelled, completed, expired, paused (in addition to prior active/trialing values)

**site_settings** — Global settings (beta_count, etc.)
- id, key (unique), value (jsonb), updated_at

**support_tickets** — User support tickets
- id, user_id, user_email, category, subject, description, screenshot_url, screenshot_urls (jsonb), status (open/in_progress/resolved), reply_count (int), ticket_number (serial via ticket_number_seq), resolved_at (timestamptz), created_at, updated_at

**ticket_replies** — Conversation thread for support tickets (migration 0027)
- id, ticket_id (CASCADE), user_id, sender_role (user/admin), message, screenshot_urls (jsonb), created_at
- RLS: users can read/insert replies on their own tickets only

### Functions & Triggers
- `increment_referral_balance(target_user_id, amount)` — SECURITY DEFINER, atomic balance update
- `check_referral_reward()` — Trigger function for referral rewards
- `trg_referral_reward` — AFTER INSERT on trades, credits $1 to both users when referred user logs 3rd trade
- `get_user_id_by_email(email)` — Helper for admin notification lookups

### Storage Buckets
- screenshots (public) — Trade chart screenshots
- avatars (public) — User profile photos
- trophies (public) — Achievement certificates

## 5. Key Patterns & Conventions

### Server Components (pages)
```javascript
export const dynamic = 'force-dynamic'; // Most dashboard pages
export default async function PageName() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('table').select('columns')
    .eq('user_id', user.id);  // ALWAYS include
  if (error) return <ErrorState />;
  return <Component data={data} />;
}
```

### Server Actions
```javascript
"use server";
export async function actionName(payload) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };
  // Always .eq('user_id', user.id) on mutations
  await supabase.from('table').update(data).eq('id', id).eq('user_id', user.id);
  revalidatePath('/dashboard/...');
  return { ok: true };
}
```

### Per-Setup Follow Tracking (TradeForm)
```javascript
// Form state includes:
setup_follow_map: { setupId1: 'yes', setupId2: 'no' }  // Per-setup tracking
setup_followed: 'partial'  // Auto-computed overall for DB storage

// computeOverallFollowed: all yes→yes, all no→no, mixed→partial
// Mandatory: all setups must be marked before saving
```

## 6. Security Checklist

1. Every Supabase query includes `.eq('user_id', user.id)` — never rely on RLS alone
2. All mutations verify ownership before update/delete
3. Admin email from `ADMIN_EMAIL` env var, never hardcoded
4. Disposable email blocking with subdomain check (sub.mailinator.com)
5. Password: 8+ chars, uppercase, lowercase, number, special
6. AI prompts: user notes wrapped in <trader_note> tags
7. Email templates: all AI content HTML-escaped via escHtml()
8. CSP: NO 'strict-dynamic' (breaks Next.js 14 without nonce setup)
9. HSTS enabled (max-age=63072000, includeSubDomains, preload)
10. OAuth callback: validates next param, checks exchange errors
11. Image URLs validated (HTTPS only for screenshots/avatars)
12. Referral cookie: encodeURIComponent + SameSite=Lax
13. Code generation: crypto.randomUUID() (not Math.random)
14. Error boundary: hides raw error messages in production
15. Razorpay webhooks: always verify signature via `verifyWebhookSignature` (HMAC SHA256, `RAZORPAY_WEBHOOK_SECRET`) before trusting payload or mutating `subscriptions`
16. Razorpay checkout callback: always verify payment signature via `verifyPaymentSignature` before marking a subscription as paid

## 7. Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon/public key |
| OPENROUTER_API_KEY | OpenRouter API key for AI |

### Optional
| Variable | Description |
|----------|-------------|
| ADMIN_EMAIL | Admin user's email (for admin panel access) |
| OPENROUTER_MODEL | Override AI model slug (default: anthropic/claude-haiku-4.5) |
| NEXT_PUBLIC_POSTHOG_KEY | PostHog analytics key |
| RESEND_API_KEY | Resend email API key |
| RESEND_FROM | Resend sender address |
| SUPABASE_SERVICE_ROLE_KEY | Service role key (admin operations, notifications) |

### Payments (Razorpay — required for billing to function, not yet set as of this writing)
| Variable | Description |
|----------|-------------|
| RAZORPAY_KEY_ID | Razorpay API key ID |
| RAZORPAY_KEY_SECRET | Razorpay API key secret |
| RAZORPAY_WEBHOOK_SECRET | Secret used to verify incoming webhook signatures (HMAC SHA256) |
| RAZORPAY_PLAN_ID_MONTHLY | Razorpay Plan ID for the $9.99/mo Elite monthly plan |
| RAZORPAY_PLAN_ID_YEARLY | Razorpay Plan ID for the $7.99/mo ($95.88/yr) Elite yearly plan |

## 8. Common Pitfalls (Learned the Hard Way)

1. **Never add 'strict-dynamic' to CSP** without implementing nonce-based script loading. Next.js 14 relies on 'unsafe-inline' for its bootstrapping scripts.

2. **Never rewrite entire page files** for targeted fixes. Make surgical edits. The audit agent destroyed two critical pages by rewriting them from scratch.

3. **AbortError handlers must throw, not return.** Returning `{ error: '...' }` from a function that normally returns a string causes type mismatches in callers.

4. **computeStats returns { n, net, winRate, profitFactor }** (avgR removed as part of the r_multiple removal cleanup — see section 14) — not { total, totalPnl }. Always check the actual function signature before using return values.

5. **computeDisciplineStats, computeWeeklyScore, computeEliteWeekStreak all require (trades, journals)** as two arguments. Passing only trades breaks journal-based scoring.

6. **computeAchievements expects a metrics object** like { totalTrades, journalStreak, ... } — not the raw trades array.

7. **DashboardShareButton accepts { data }**, not { stats, trades }. TradeTable accepts { rows }, not { trades }.

8. **ai_insights.summary** is the column name, not "insight". The column "tags" does not exist.

9. **expenses.total_cost** is the column name, not "amount". payouts.payout_date not "date", payouts.notes not "note".

10. **Trade columns are entry_price, exit_price, stop_loss, take_profit** — not sl_price/tp_price.

11. **ISR (revalidate) + cookies()** — cookies() forces dynamic rendering regardless of revalidate setting, but can cause stale JS bundle issues during redeployments.

12. **Vercel deployments take 60-90s** and edge cache propagation can take longer. Users should hard-refresh (Ctrl+Shift+R) after deployments.

13. **Trading day boundary is midnight UTC (= 5:30 AM IST).** Always use `getTradingDate()` or `getTradingMonth()` from `lib/stats.js` for "today" logic. Never use `toLocaleDateString` with a timezone — that was the old IST approach. A trade at 3:00 AM IST belongs to the previous trading day; a trade at 6:00 AM IST starts the new day.

14. **All trade queries need a secondary sort by `created_at`.** Sorting only by `trade_date`/`opened_at` produces unstable ordering for same-day trades — add `.order('created_at', { ascending: true/false })` as a tiebreaker everywhere trades are listed.

15. **subscriptions.plan values are 'basic'/'elite'**, not 'free'/'pro' (renamed in migration 0024). Update any hardcoded plan checks across gating logic, landing page copy, and admin views.

16. **Feature gating must be server-side, not just UI-hidden.** `lib/plans.js`'s `getUserAccess()`/`buildAccess()` must be checked inside server actions (AI analysis, coach report, uploads, exports, etc.) — a hidden button is not a security boundary. Always honor `is_beta` as a bypass for Elite-only gates during the beta period.

17. **Never trust a Razorpay webhook payload without verifying its signature first.** `verifyWebhookSignature(body, signature, secret)` (HMAC SHA256 against `RAZORPAY_WEBHOOK_SECRET`) must pass before any `subscriptions` row is updated from `/api/razorpay/webhook`.

18. **The Razorpay checkout callback route must verify the payment signature** (`verifyPaymentSignature(orderId, paymentId, signature)`) before marking a subscription active — the redirect query params alone are not proof of payment.

19. **`trades.r_multiple` is a DB column that must never be read or written by application code**, even though it still exists in the schema. It was cleared and dropped (migrations 0032/0033) then restored (migration 0034) solely to fix `PostgREST` schema-cache errors on `select(*)` queries from clients still expecting the column. Always use explicit column lists in `.select()` calls on `trades` rather than `select('*')`, both to avoid re-introducing `r_multiple` into payloads and to avoid depending on schema-cache state for correctness.

## 9. Phase L Changes (June 30, 2026 — post-K)

### Landing Nav Redesign (LandingNav.js + CookieBanner.js)
Lyrafin-inspired responsive navigation replacing the old inline nav:
- **Desktop**: Logo left, Sign In (rounded pill with login icon) + Start Free Trial (gradient pill) right
- **Mobile**: Logo left, login arrow icon + hamburger on right → dropdown overlay with Sign In + Start Free Trial, backdrop close, full a11y (aria-label, aria-expanded, aria-modal, role=dialog)
- **Cookie consent**: Fixed bottom bar, localStorage key `pl_cookie_accepted`, brand gradient Accept button + Privacy Policy link
- Files: `components/landing/LandingNav.js`, `components/landing/CookieBanner.js`, modified `app/page.js`

### 1:1 Square P&L Share Card
New Square (1:1) aspect ratio for Twitter/X alongside Story (9:16) and Landscape (16:9):
- 480x480px optimal for Twitter/X feed posts
- ShareCard: `isSquare` variant with tuned spacing/fonts
- ShareModal: 3-option ratio picker with dynamic preview sizing (400x400 in modal)
- Removed Avg R stat chip from both daily/total and trade share cards
- Share button now always visible on dashboard — shows Total P&L when no today trades (type='total' vs type='daily')
- Files: `components/share/ShareCard.js`, `components/share/ShareModal.js`, `components/dashboard/DashboardShareButton.js`

### Full Name Support (Migration 0023)
```sql
-- supabase/migrations/0023_full_name.sql
ALTER TABLE user_preferences ADD COLUMN full_name text;
```
- **Auto-fetch**: Dashboard layout checks `user.user_metadata` for `full_name`/`name` from Google OAuth, auto-saves on first load if empty
- **Settings**: New Full Name card in Profile tab (trimmed, max 100 chars), manual edit overrides auto-fetch
- **Display**: Sidebar avatar initial from full name (falls back to email), full name shown bold above email in expanded sidebar and MobileNav drawer
- **Admin**: Full name shown bold above email in user list, search matches both name and email
- All gracefully handle null/undefined (migration may not be run yet)
- Files: `supabase/migrations/0023_full_name.sql`, `app/dashboard/layout.js`, `app/dashboard/settings/actions.js`, `components/layout/Sidebar.js`, `components/layout/MobileNav.js`, `components/settings/SettingsTabs.js`, `components/admin/AdminUserTabs.js`, `app/admin/users/page.js`

### Guided Tooltip Walkthrough (GuidedTour.js)
7-step in-app walkthrough for new users:
1. Welcome — introduces the dashboard
2. Log a trade — points at + New Trade button
3. Expenses — points at Expenses nav link
4. Share P&L — points at share button
5. Trade journals — points at recent trades section
6. AI Coach — points at AI Coach nav link
7. Finish — encourages first trade, mentions Settings replay

Features:
- Spotlight overlay with violet border highlighting target elements
- Step progress dots with gradient active indicator
- Next/Back/Skip navigation with brand gradient buttons
- Auto-scrolls to target elements
- Auto-triggers for new users (0 trades, tour not completed)
- Skippable with Escape key or Skip button
- Completion stored in localStorage (`pl_tour_complete`)
- Replayable from Settings > Profile > Walkthrough section
- `data-tour` attributes on key UI elements (new-trade, share-btn, recent-trades, nav-expenses, nav-coach)
- Mobile responsive tooltip positioning
- Files: `components/ui/GuidedTour.js` (new), modified `app/dashboard/layout.js`, `app/dashboard/page.js`, `components/layout/Sidebar.js`, `components/settings/SettingsTabs.js`

## 10. Phase M Changes (July 4, 2026 — post-L)

### Trading Day Boundary Fix + Trade Ordering
- Confirmed/hardened trading day boundary: midnight UTC = 5:30 AM IST via `getTradingDate()` / `getTradingMonth()` in `lib/stats.js` (see Pitfall #13)
- Added secondary sort by `created_at` to all trade queries (dashboard, trades list, calendar, export) to stabilize ordering for same-day trades (see Pitfall #14)

### Plan System (Migration 0024 + lib/plans.js)
```sql
-- supabase/migrations/0024_plans_beta.sql
ALTER TABLE user_preferences ADD COLUMN is_beta boolean DEFAULT true;
-- subscriptions.plan values updated: 'free'→'basic', 'pro'→'elite'
```
- Two plans: **Basic** ($0) and **Elite** ($9.99/mo)
- `lib/plans.js`: `PLANS` config object, `FEATURES` limits map, `getUserAccess(user)` resolves a user's effective access, `buildAccess()` composes the access object used by gates
- `is_beta` flag (default true) lets beta users bypass Elite-only gates entirely; toggled per-user via new `app/admin/actions.js` → `toggleBeta()` server action, surfaced in admin panel (BetaCountControl / AdminUserTabs)
- New UI components: `components/ui/PlanBadge.js` (plan indicator), `components/ui/BetaFeatureWarning.js` (inline notice when a beta feature will be gated post-beta), `components/ui/UpgradeCard.js` (upsell CTA shown when a Basic user hits a limit)
- Landing page copy renamed: Free → Basic, Pro → Elite

### Server-Side Feature Gating
All gates enforced inside server actions (never just hidden in the UI), with `is_beta` as a universal bypass:
- AI trade analysis: 3/month on Basic
- AI coach report: 1/month on Basic
- Trophy uploads: 5 on Basic
- Screenshots: 1 per trade on Basic
- Custom setups: 3 on Basic
- CSV export: Elite-only
- Shareable P&L cards: Elite-only
- Email coach report: Elite-only

### Storage Cleanup + Orphan Script
- Deleting a trade, screenshot, or avatar now also removes the associated Supabase Storage object (previously left orphaned files in `screenshots`/`avatars`/`trophies` buckets)
- New `scripts/cleanup-orphans.js` — standalone script to sweep storage buckets for files with no matching DB row and delete them (run manually / via cron, not part of the request path)

### Calendar Insights (components/calendar/CalendarInsights.js)
New insights panel on the P&L calendar:
- **Trade Win gauge**: SVG semi-circle gauge showing win rate
- **10 stat cards** laid out in a 4x2 + 4 grid
- **Month / All-Time toggle** with smart averages that adjust denominator based on the selected range

### Tags System (Migration 0026 + lib/tags.js)
```sql
-- supabase/migrations/0026_tags.sql
ALTER TABLE journal_entries ADD COLUMN tags text[];
ALTER TABLE user_preferences ADD COLUMN custom_tags text[];
```
- `lib/tags.js`: `DEFAULT_TAGS` (news, high impact, low volume, scalp, swing), `resolveTags()` merges default + custom tags for a user, `MAX_CUSTOM_TAGS` = 10
- Tags editable on journal entries, filterable and shown as a column on the Trades page
- Custom tags managed per-user via `user_preferences.custom_tags`, capped at 10

### Journal Entry: Lesson Learned (Migration 0025)
```sql
-- supabase/migrations/0025_lesson.sql
ALTER TABLE journal_entries ADD COLUMN lesson text;
```
- New "Lesson learned" free-text field on journal entries, alongside note/emotions/confidence

### Trade Form & UI Polish
- Removed Take Profit field; Stop Loss marked optional (not required to save)
- "Lot Size" relabeled "Lot / Contract size"
- Risk:Reward ratio now auto-calculated and displayed from entry/stop/exit prices
- M1 timeframe option added
- Custom dark-themed dropdowns replace native `<select>` elements: Timeframe in TradeForm, all filters in TradeFilters
- Styled Long/Short direction badges: SVG trend-line icons in blue (long) / red (short) pill badges
- Portrait screenshots capped at `max-h-80` to prevent oversized previews
- 5MB upload limit standardized across all upload surfaces (screenshots, avatars, trophies)
- Trade count pill badge added to Trades page header
- Dashboard: Avg R stat replaced with Expectancy (average P&L per trade)
- Expense tracker: fixed sort order to flow correctly down columns in the 2-column grid (previously flowed row-first)
- Files: `lib/plans.js` (new), `lib/tags.js` (new), `components/ui/PlanBadge.js` (new), `components/ui/BetaFeatureWarning.js` (new), `components/ui/UpgradeCard.js` (new), `components/calendar/CalendarInsights.js` (new), `app/admin/actions.js` (new), `scripts/cleanup-orphans.js` (new), `supabase/migrations/0024_plans_beta.sql`, `supabase/migrations/0025_lesson.sql`, `supabase/migrations/0026_tags.sql`, modified `lib/stats.js`, `components/trades/TradeForm.js`, `components/trades/TradeFilters.js`, `components/trades/TradeTable.js`, `components/journal/JournalForm.js`, `app/dashboard/page.js`, `app/page.js` (landing), `components/expenses/ExpenseTracker.js`

## 11. Phase N Changes (July 4, 2026 — post-M)

### Ticket System Restructure (Migration 0027)
Complete rewrite of the support ticket system from single `admin_reply` to a full conversation thread:

```sql
-- supabase/migrations/0027_ticket_replies.sql
CREATE TABLE ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('user', 'admin')),
  message text NOT NULL,
  screenshot_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
-- RLS: users read/insert replies on own tickets only
-- Dropped admin_reply column from support_tickets
-- Added reply_count (int) to support_tickets
-- Added user UPDATE and DELETE policies on support_tickets
```

**Multi-reply conversations:**
- Both user and admin can send unlimited replies in a threaded conversation
- Message bubbles styled by sender: violet for user, cyan for admin/support
- Reply count and last-replier indicator on ticket list cards
- Server pages (support/page.js, admin/tickets/page.js) fetch replies via `.in('ticket_id', ticketIds)` and attach to tickets

**Close ticket (both parties):**
- Custom close modal replaces ConfirmDialog — includes "Send transcript to email" checkbox (unchecked by default)
- On close: optionally builds full transcript → emails via Resend → cleans up all screenshots from storage → deletes ticket (CASCADE deletes replies)
- Statuses simplified to `open` and `in_progress` only (close = permanent delete)

**Multi-select bulk delete:**
- "Select" button toggles selection mode with checkboxes on ticket cards
- Bulk action bar with Select All/Deselect All + "Delete X Tickets" button
- ConfirmDialog warns "No transcript emails will be sent"
- `bulkDeleteTickets` server action (both user and admin) — cleans up all storage then deletes
- Admin: Select All applies to currently filtered tickets only

**Notifications (4 new types):**
- `TICKET_USER_REPLIED` — notifies admin when user replies
- `TICKET_CLOSED` — notifies the other party when ticket is closed
- `TICKET_STATUS` — notifies user on status changes
- `TICKET_RESOLVED` — notifies user when admin marks ticket as resolved
- Admin notification types list (`ADMIN_TYPES`) updated in both `app/dashboard/layout.js` and `app/admin/layout.js` to include new types
- `notifyAdmin` calls skipped when user IS admin (`user.email !== ADMIN_EMAIL`) to prevent duplicate notifications
- All ticket notifications include `metadata.link` for click-to-navigate (admin→`/admin/tickets`, user→`/dashboard/support`)

**Transcript email (`lib/email.js`):**
- `sendTicketTranscript(toEmail, ticket, replies)` — dark-themed HTML email with original message + chronological conversation thread, sender role labels, timestamps

### Resolved Status + Ticket Numbers (Migration 0029)

```sql
-- supabase/migrations/0029_ticket_resolved.sql
ALTER TABLE support_tickets ADD COLUMN resolved_at timestamptz;
CREATE SEQUENCE ticket_number_seq START 1;
ALTER TABLE support_tickets ADD COLUMN ticket_number int DEFAULT nextval('ticket_number_seq');
ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_status_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved'));
```

**Resolved status flow:**
- Admin sets status to "resolved" via custom dropdown → sets `resolved_at` timestamp
- User receives notification + resolution email (`sendTicketResolvedEmail`) with ticket number, re-open instructions, 7-day auto-delete notice
- User sees emerald resolved banner on ticket detail with re-open instructions
- User can re-open by replying → status resets to `open`, `resolved_at` cleared
- Resolved tickets auto-delete after 7 days (cleanup runs on page load in both user and admin server pages)
- Resolved tickets do NOT block new ticket creation (`hasOpenTicket` checks only `open`/`in_progress`)

**Ticket numbers:**
- Sequential `ticket_number` via Postgres sequence (`ticket_number_seq`)
- Displayed as `#001`, `#002` on list cards and detail views (both user and admin)
- Used in email subject lines and notifications

**Custom status dropdown (admin):**
- Replaces native `<select>` with dark-themed dropdown matching app style
- Colored status dots (amber=open, cyan=in progress, emerald=resolved)
- Click-outside-close behavior

**One open ticket limit:**
- Server action checks for existing `open`/`in_progress` tickets before creating new one
- UI: disabled "+ New Ticket" button + amber warning banner when user has an open ticket
- Resolved tickets don't count toward this limit

### Real-Time Notifications (Migration 0028)

```sql
-- supabase/migrations/0028_realtime_notifications.sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

- `NotificationBell` subscribes to Supabase Realtime `postgres_changes` INSERT events on `notifications` table
- Bell count increments instantly when new notification arrives (no page refresh needed)
- Dropdown items prepend in real-time if panel is open
- Inline toast notification slides up from bottom-right for 5s on new notification (`RealtimeToast` component)
- Type filtering preserved via `typeFilter`/`excludeTypes` props
- 60s polling kept as fallback if Realtime WebSocket drops
- Channel cleaned up on component unmount
- RLS ensures each user only receives events for their own rows
- Files: `components/notifications/NotificationBell.js`, `supabase/migrations/0028_realtime_notifications.sql`

### WebP Compression Consistency
- `processImageFile()` from `lib/imageUtils.js` (WebP at 0.85 quality, max 2048px) now wired into ALL upload points:
  - Journal screenshots ✅ (already had it)
  - Trophy uploads ✅ (already had it)
  - Support ticket screenshots ✅ (added in Phase N)
  - Avatar uploads ✅ (added in Phase N)
- Files modified: `components/support/SupportPage.js`, `components/settings/SettingsTabs.js`

## 12. Phase Q Changes (July 5, 2026 — post-N)

- Phase Q: Tools Section — /dashboard/tools route with tool card grid, /tools public route for SEO. First tool: Consistency Calculator (components/tools/ConsistencyCalculator.js) with method toggle (largest day/trade), limit presets (15/20/30/custom), real-time calculation, color-coded results, What If simulator, Copy Result, FAQ. Public pages with OG images, sitemap.xml, robots.txt. Nav updated in Sidebar.js + MobileNav.js.

### Components
- `tools/ToolCard.js` — reusable tool card for tools menu
- `tools/ConsistencyCalculator.js` — consistency rule calculator with method toggle, What If simulator, Copy Result, SEO FAQ

## 13. Phase R Changes (July 5, 2026 — post-Q)

Phase R adds full Razorpay payment processing and an end-to-end feature-gating system, replacing the "Stripe planned" placeholder in the tech stack.

### Razorpay Integration Architecture (lib/razorpay.js)
`lib/razorpay.js` wraps the Razorpay Node SDK with the following functions:
- `createSubscription(planId, customerNotify)` — creates a Razorpay subscription against `RAZORPAY_PLAN_ID_MONTHLY` or `RAZORPAY_PLAN_ID_YEARLY`, with a 14-day trial applied via a `start_at` offset
- `cancelSubscription(subscriptionId, cancelAtCycleEnd)` — cancels a subscription (defaults to cancel-at-cycle-end)
- `fetchSubscription(subscriptionId)` — fetches current subscription state from Razorpay
- `verifyWebhookSignature(body, signature, secret)` — HMAC SHA256 verification of incoming webhook payloads against `RAZORPAY_WEBHOOK_SECRET`
- `verifyPaymentSignature(orderId, paymentId, signature)` — verifies payment authenticity on the checkout callback

### Subscription Creation Flow
1. User clicks upgrade in `BillingTab` (Settings) or the `UpgradeModal` (opened from `BlurGate`/limit CTAs)
2. Client calls `POST /api/razorpay/create-subscription`
3. Server creates a Razorpay subscription via `lib/razorpay.js`, applying the 14-day trial and selecting `RAZORPAY_PLAN_ID_MONTHLY` or `RAZORPAY_PLAN_ID_YEARLY` based on billing cycle
4. Route returns the subscription's `short_url` (Razorpay-hosted checkout page)
5. Client redirects the browser to `short_url`

### Callback Flow (app/api/razorpay/callback/route.js)
- After payment on the Razorpay hosted page, Razorpay redirects to `/api/razorpay/callback` with subscription/payment query params
- Route verifies the payment signature via `verifyPaymentSignature` before trusting the params
- Updates the corresponding `subscriptions` row
- Redirects the user back to `/dashboard/settings` with a success/failure query param

### Webhook Flow (app/api/razorpay/webhook/route.js)
- Razorpay POSTs events to `/api/razorpay/webhook`: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.halted`, `payment.failed`, etc.
- Route verifies the signature via `verifyWebhookSignature` against `RAZORPAY_WEBHOOK_SECRET` before processing
- Updates the `subscriptions` table (status, `last_payment_id`, `last_payment_at`, `cancelled_at` as applicable)
- Triggers `lib/subscription-emails.js`: payment receipt on `subscription.charged`, cancellation email on `subscription.cancelled`, payment failed email on `payment.failed`

### Cancellation Flow (app/api/razorpay/cancel-subscription/route.js)
- `BillingTab` calls `POST /api/razorpay/cancel-subscription`
- Route calls `lib/razorpay.js`'s `cancelSubscription()` (cancels at cycle end by default)
- Razorpay's `subscription.cancelled` webhook confirms the cancellation, updates the DB, and sends the cancellation email

### Trial Lifecycle
- `trial_ends_at` is set at subscription creation time (+14 days)
- `app/dashboard/layout.js` checks `trial_ends_at` on each load; when within N days of expiry it renders `SubscriptionBanner` in its "trial expiring" state and triggers the trial-ending email via `lib/subscription-emails.js`
- When `trial_ends_at` has passed without a successful payment, subscription status transitions accordingly and `SubscriptionBanner` shows the "expired" state; `BlurGate` reverts Elite-only features back to locked

### BlurGate Feature-Gating System (components/ui/BlurGate.js)
- Wraps any Elite-only UI element/section
- If the user's plan lacks the feature (per the access map in `lib/plans.js`), renders a blurred/overlaid version of the children plus a click target that opens the co-located `UpgradeModal` (pricing + CTA to start checkout)
- Used on: dashboard share button, CSV export (trades page), `CalendarInsights` (calendar page)
- Limit-reached CTAs in `TradeAnalysisTab`, `MonthlyReviewTab`, `TrophyWall`, and `RulebookPage` open `UpgradeModal` directly instead of blurring, since those are "limit hit" states rather than fully locked features

### Subscription Lifecycle Emails (lib/subscription-emails.js)
Four templates, following the same Resend-based pattern as the existing coach-report/ticket emails in `lib/email.js`:
1. **Trial ending** — sent roughly 2-3 days before `trial_ends_at`
2. **Payment receipt** — sent on successful charge (`subscription.charged` webhook)
3. **Cancellation confirmation** — sent on cancel (`subscription.cancelled` webhook)
4. **Payment failed** — sent on `payment.failed` webhook

### lib/plans.js Updates
- Pricing repriced from INR to USD: Elite $9.99/mo or $7.99/mo billed yearly ($95.88/yr); launch pricing $4.99/mo for the first 100 users; Basic remains $0 forever
- `ai_analysis` limit for Basic reduced from 5/month to 3/month
- New `calendar_insights` gate added (Elite-only)
- New `ELITE_FEATURES` list added, consolidating all Elite-gated feature keys
- `getUserAccess(user)` now also returns subscription status (e.g. `trialing`/`active`/`cancelled`/`expired`) alongside the feature-access flags, so dashboard pages can drive `BlurGate`/limit UI directly off subscription state rather than just plan tier

### Database Migration 0031 (supabase/migrations/0031_razorpay_subscriptions.sql)
```sql
-- supabase/migrations/0031_razorpay_subscriptions.sql
ALTER TABLE subscriptions ADD COLUMN razorpay_subscription_id text;
ALTER TABLE subscriptions ADD COLUMN razorpay_payment_id text;
ALTER TABLE subscriptions ADD COLUMN billing_cycle text;
ALTER TABLE subscriptions ADD COLUMN trial_ends_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN cancelled_at timestamptz;
ALTER TABLE subscriptions ADD COLUMN last_payment_id text;
ALTER TABLE subscriptions ADD COLUMN last_payment_at timestamptz;
CREATE INDEX idx_subscriptions_razorpay_subscription_id ON subscriptions(razorpay_subscription_id);
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'created', 'authenticated', 'pending', 'halted', 'cancelled', 'completed', 'expired', 'paused'));
```

### Pricing & Plan Limits Summary

| Feature | Basic | Elite |
|---------|-------|-------|
| AI trade analysis | 3/mo | 100/mo |
| Propol AI review | 1/mo | 4/mo |
| Trophy uploads | 5 | Unlimited |
| Screenshots/trade | 1 | 10 |
| Custom setups | 3 | Unlimited |
| CSV export | Locked | Full |
| Shareable cards | Locked | Full |
| Email coach | Locked | Full |
| Calendar insights | Locked | Full |
| Price | $0 forever | $9.99/mo or $7.99/mo billed yearly ($95.88/yr) |

- 14-day free trial on all Elite subscriptions
- Launch pricing: $4.99/mo for the first 100 users
- Checkout: Razorpay hosted page (redirect flow)

### New Files
- `lib/razorpay.js`, `lib/subscription-emails.js`
- `components/ui/BlurGate.js`, `components/ui/SubscriptionBanner.js`
- `components/settings/BillingTab.js`, `components/landing/LandingFooter.js`
- `app/api/razorpay/create-subscription/route.js`, `app/api/razorpay/webhook/route.js`, `app/api/razorpay/callback/route.js`, `app/api/razorpay/cancel-subscription/route.js`
- `app/about/page.js`, `app/contact/page.js`, `app/refund-policy/page.js`, `app/(landing)/pricing/page.js`
- `supabase/migrations/0031_razorpay_subscriptions.sql`

### Modified Files
- `lib/plans.js`, `components/ui/BetaFeatureWarning.js`, `components/ui/UpgradeCard.js`, `components/landing/LandingNav.js`
- `components/coach/TradeAnalysisTab.js`, `components/coach/MonthlyReviewTab.js`, `components/trophies/TrophyWall.js`, `components/rulebook/RulebookPage.js`
- `components/journal/JournalForm.js`, `components/journal/JournalSection.js`
- `app/dashboard/layout.js`, `app/dashboard/page.js`, `app/dashboard/trades/page.js`, `app/dashboard/trades/actions.js`, `app/dashboard/trades/[id]/page.js`, `app/dashboard/coach/page.js`, `app/dashboard/calendar/page.js`, `app/dashboard/settings/page.js`, `app/dashboard/rulebook/page.js`
- `app/tools/page.js`, `app/tools/consistency-calculator/page.js`, `app/page.js`, `app/privacy/page.js`, `app/terms/page.js` (3 new sections 11-13 for billing/payments/refunds)

### Related Repos Note
The separate `proplogai-blog` repository (not touched by this change) had its `Header.astro` updated to match the main site nav (Tools, Blog, Pricing, About links + 14-Day Trial badge + centered pill container) and its `Footer.astro` updated to match the new `LandingFooter` (Lyrafin-style). Tracked in that repo's own history, not here.

### Environment Variables (required, not yet configured)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_MONTHLY`, `RAZORPAY_PLAN_ID_YEARLY`

## 14. Onboarding Redesign + R-Multiple Removal + Inline Trade Analysis (July 9, 2026 — post-R)

### Onboarding Redesign

**OnboardingFlow.js (rebuilt as a 4-step wizard)**
The `/onboarding` route wizard was rebuilt with 4 steps:
1. **Welcome** — introduces the product
2. **Feature Showcase** — 8 feature cards highlighting core functionality
3. **Journal Setup** — emotion/confidence picker to prime the user's first journal entry
4. **Ready** — hands off to the dashboard

**GuidedTour.js removed from the dashboard layout**
The 7-step `components/ui/GuidedTour.js` spotlight walkthrough (see Phase L, section 9) is no longer imported or rendered anywhere in the app — `app/dashboard/layout.js` and `app/dashboard/page.js` no longer reference it. The file itself has **not** been deleted from the codebase; it is simply dead code retained for reference. All new-user activation is now driven by `OnboardingChecklist.js`.

**NEW: components/dashboard/OnboardingChecklist.js**
A persistent dashboard checklist positioned as "Train Your AI Coach" rather than a generic product tour. Key mechanics:
- **5 sequential steps**, unlocking one at a time (🔒 locked state shown for steps not yet reachable):
  1. Teach your AI how you trade — create a custom setup
  2. Log your first trade
  3. Tell the story behind your trade — complete a journal entry
  4. Meet your AI Coach — run an AI trade analysis
  5. **BONUS** — celebrate your first trading day by sharing a PnL card
- Numbered step badges (1, 2, 3, 4, 5), replaced with a ✓ once a step is completed
- Shimmer-animated progress bar labeled "AI Learning Progress"
- Per-step celebration toasts fire as each step completes
- An AI preview card is shown after the user's first trade (previewing what AI coaching will look like once they complete step 4)
- Completing all steps triggers a final "AI Coach Activated" celebration screen
- The bonus step (PnL share) is tracked client-side via `localStorage` key `pl_first_share` rather than a DB column
- Steps 1-4 progress is computed server-side (see `lib/onboarding.js` below); only the bonus share step relies on localStorage

**NEW: lib/onboarding.js**
Server-side helper, `getOnboardingProgress(user)` (or equivalent signature), that queries the DB (setups, trades, journal_entries, ai_insights) to compute which of the 5 checklist steps are complete, feeding `OnboardingChecklist.js` on each dashboard render.

**NEW: components/trades/AnalyzeButton.js + app/api/analyze-trade/route.js**
See "Inline Trade Analysis" below — also wired into the OnboardingChecklist's "Meet your AI Coach" step.

**Settings "Replay Walkthrough"**
The Settings > Profile > Walkthrough replay control now resets `OnboardingChecklist` progress (re-locks steps / clears the `pl_first_share` localStorage flag) instead of resetting `GuidedTour`'s `pl_tour_complete` flag.

### R-Multiple Removal

`r_multiple` has been removed from the application layer everywhere it was previously surfaced, while the underlying DB column is retained:

- Removed from the trade form (no input/display)
- Removed from CSV export
- Removed from AI context — `lib/tradeContext.js`'s `avgR` reference removed
- Removed from search results (`lib/search.js` / `/api/search`)
- Removed from the admin trade list (`components/admin/AdminTradeList.js`)
- Removed from all `.select()` queries across 9+ files (trade list, trade detail, dashboard, calendar, exports, etc. now use explicit column lists that omit `r_multiple`)
- `lib/stats.js`: `fmtR` function removed entirely; `avgR` removed from `computeStats()`'s return object (dashboard "Avg R" stat was already replaced by Expectancy in Phase M — this completes the cleanup by removing the underlying computation)

**Database column history (migrations 0032-0034):**
```sql
-- supabase/migrations/0032_clear_r_multiple.sql
-- Clears existing r_multiple values (sets to NULL) ahead of the column drop
UPDATE trades SET r_multiple = NULL;

-- supabase/migrations/0033_drop_r_multiple.sql
-- Drops the column entirely
ALTER TABLE trades DROP COLUMN r_multiple;

-- supabase/migrations/0034_restore_r_multiple.sql
-- Re-adds the column after PostgREST schema cache issues broke select(*) queries
-- referencing the dropped column across cached client connections
ALTER TABLE trades ADD COLUMN r_multiple numeric;
```
The column is re-added purely for `select(*)`/schema-cache compatibility — it is never populated or displayed by the application. Any future code should not read or write `r_multiple`.

**Other July 2026 migrations (not r_multiple related):**
- `0032_setup_reference_images.sql`
- `0032_trophy_date.sql`
- `0033_bad_sl_setup.sql` — seeds the new "Bad SL" default setup (see below)

### Trade Detail Page: Inline Trade Analysis

**NEW: components/trades/AnalyzeButton.js**
Client component rendered on the trade detail page (`/dashboard/trades/[id]`). Replaces the old "Analyze on Trades Page" link (which redirected the user away to run analysis elsewhere) with an inline "Analyze this trade" button that triggers analysis without leaving the page.

**NEW: app/api/analyze-trade/route.js**
API route backing `AnalyzeButton.js`. Runs the same `analyzeTradeWithAI` pipeline used elsewhere (guardrails, rate limiting, `ai_insights` caching) but is structured to report errors step-by-step (e.g., distinguishing "rate limit hit" vs. "AI call failed" vs. "trade not found") back to the client for clearer inline error states, rather than a single generic failure message.

**Explicit column selection**
All `select('*')` calls on the trade detail page (`app/dashboard/trades/[id]/page.js`) have been replaced with explicit column lists — both to drop `r_multiple` from the payload and as a general hardening measure (see Pitfall #19 below).

### DEFAULT_SETUPS: "Bad SL" Added

`app/onboarding/actions.js`'s `DEFAULT_SETUPS` array (seeded for every new user) now includes an 8th named setup, **"Bad SL"**, at `sort_order: 8` — bringing the total default setup count to **9** (including the exclusive "No Setup" option). Seeded via migration `0033_bad_sl_setup.sql` for existing installs; new signups get it automatically from `DEFAULT_SETUPS`.

### New Files
- `lib/onboarding.js`
- `components/dashboard/OnboardingChecklist.js`
- `components/trades/AnalyzeButton.js`
- `app/api/analyze-trade/route.js`
- `supabase/migrations/0032_clear_r_multiple.sql`, `supabase/migrations/0032_setup_reference_images.sql`, `supabase/migrations/0032_trophy_date.sql`, `supabase/migrations/0033_bad_sl_setup.sql`, `supabase/migrations/0033_drop_r_multiple.sql`, `supabase/migrations/0034_restore_r_multiple.sql`

### Modified Files
- `components/onboarding/OnboardingFlow.js` (rebuilt as 4-step wizard)
- `app/dashboard/layout.js`, `app/dashboard/page.js` (GuidedTour removed, OnboardingChecklist added)
- `components/settings/SettingsTabs.js` (Replay Walkthrough now resets OnboardingChecklist)
- `lib/stats.js` (fmtR removed, avgR removed from computeStats), `lib/tradeContext.js` (avgR reference removed), `lib/search.js`
- `app/dashboard/trades/[id]/page.js` (AnalyzeButton added, select('*') replaced with explicit columns), `components/admin/AdminTradeList.js`
- `app/onboarding/actions.js` (Bad SL added to DEFAULT_SETUPS)
- Trade form, CSV export, and the 9+ files with `.select()` queries touching `trades.r_multiple`

### Not Deleted (Dead Code Note)
- `components/ui/GuidedTour.js` still exists in the repository. It is no longer imported or referenced by any route or component — retained as dead code rather than removed in this change.
