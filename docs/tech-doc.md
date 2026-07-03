# PropLogAI — Technical Documentation

Comprehensive technical reference for the PropLogAI codebase. Last updated: July 3, 2026 (Phase L).

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
| Email | Resend (fetch-based) | Coach report emails, HTML-escaped AI content |
| Analytics | PostHog | CDN snippet, free tier |
| Hosting | Vercel (free tier) | Custom domain: proplogai.com |

## 3. Project Structure

```
proplogai/
├── app/
│   ├── layout.js              # Root layout (fonts, PostHog, Toast)
│   ├── page.js                # Landing page (ISR revalidate=300)
│   ├── login/page.js          # Auth page (email+password, Google OAuth)
│   ├── onboarding/            # New user onboarding flow
│   ├── dashboard/
│   │   ├── layout.js          # Dashboard shell (sidebar, header, nav)
│   │   ├── page.js            # Main dashboard (stats, charts, discipline)
│   │   ├── trades/            # Trade list, detail, new, edit + actions
│   │   ├── calendar/          # P&L calendar (dual desktop/mobile render)
│   │   ├── coach/             # AI coach report + actions
│   │   ├── rulebook/          # Setup CRUD (8 defaults) + actions
│   │   ├── expenses/          # Expense tracker (3-tab) + actions
│   │   ├── trophies/          # Trophy wall + actions
│   │   ├── referrals/         # Referral dashboard + actions
│   │   ├── settings/          # User settings + actions
│   │   ├── support/           # Support tickets + actions
│   │   └── notifications/     # Notification list + actions
│   ├── admin/                 # Admin panel (overview, users, tickets, AI, revenue)
│   ├── profile/[code]/        # Public trader profile
│   ├── trade/[shareId]/       # Shared trade journal (24h expiry)
│   ├── trophy/[id]/           # Public trophy page
│   ├── r/[code]/              # Referral redirect
│   ├── auth/callback/         # OAuth + email verification handler
│   ├── privacy/               # Privacy policy (ISR daily)
│   ├── terms/                 # Terms of service (ISR daily)
│   └── api/logo/              # PNG logo for email templates
├── components/
│   ├── ui/                    # Skeleton, Toast, EmptyStates, Fab, ConfirmDialog, BetaNotice, GuidedTour
│   ├── layout/                # Sidebar, MobileNav, RiskFooter, PostHogProvider
│   ├── trades/                # TradeForm, TradeTable, TradeFilters, DeleteTradeButton, ExportButton
│   ├── journal/               # JournalForm, JournalSection, JournalView
│   ├── coach/                 # CoachReport, GenerateReportButton, EmailReportButton, AnalyzeButton
│   ├── calendar/              # CalendarMonth, PnlCalendar
│   ├── dashboard/             # DisciplineCards, WeeklyScoreRing, AchievementBadges, EquityChart, DashboardShareButton
│   ├── expenses/              # ExpenseTracker
│   ├── trophies/              # TrophyWall
│   ├── referrals/             # ReferralDashboard, ReferralCapture
│   ├── profile/               # ProfileTradeList, PublicProfileSettings
│   ├── rulebook/              # RulebookPage
│   ├── settings/              # SettingsTabs
│   ├── admin/                 # AdminBanButton, AdminTradeList, AdminUserTabs, BetaCountControl
│   ├── onboarding/            # OnboardingFlow
│   ├── landing/               # LandingMotion (IntersectionObserver animations), CursorGlow, CardGlow, LandingNav, CookieBanner
│   ├── share/                 # ShareButton, ShareCard, ShareModal, ShareJournalButton, SharedScreenshots
│   ├── support/               # SupportPage, AdminTickets
│   ├── notifications/         # NotificationBell, NotificationList
│   └── Logo.js                # Logo + LogoMark components
├── lib/
│   ├── ai.js                  # OpenRouter integration (callOpenRouter, analyzeTradeWithAI, analyzeCoachReport, tradeToText, datasetToText)
│   ├── email.js               # Resend integration (sendCoachReportEmail, isEmailConfigured, escHtml)
│   ├── stats.js               # computeStats, equitySeries, equityChartData, fmtMoney, fmtR, fmtMoneyCompact, num
│   ├── discipline.js          # computeDisciplineStats, computeWeeklyScore, computeEliteWeekStreak, calculateWeekScore
│   ├── achievements.js        # ACHIEVEMENT_DEFS, computeAchievements
│   ├── notifications.js       # notify, notifyAdmin, TYPES, NOTIFICATION_META
│   ├── quotes.js              # Random motivational/neutral quotes by P&L range
│   ├── emotions.js            # DEFAULT_EMOTIONS, resolveEmotions
│   ├── security.js            # isDisposableEmail (200+ domains + subdomain check), validatePassword
│   ├── imageUtils.js          # processImageFile (WebP conversion, pdf.js with retry)
│   └── supabase/
│       ├── client.js          # Browser Supabase client (with env var guard)
│       ├── server.js          # Server Supabase client (with env var guard)
│       └── admin.js           # Service role client + ADMIN_EMAIL from env
├── middleware.js               # Auth refresh + route protection (/dashboard, /admin)
├── next.config.mjs            # CSP headers, HSTS, image remotePatterns, optimizePackageImports
├── tailwind.config.js         # Custom colors (ink, mint, loss), content glob includes .ts/.tsx
└── supabase/migrations/       # SQL files 0001-0023
```

## 4. Database Schema

### Tables (14 total)

**trades** — Core trade log entries
- id, user_id, account_id, pair, direction, entry_price, exit_price, stop_loss, take_profit, lot_size, pnl, r_multiple, setup (text), setup_id (uuid FK), setup_ids (jsonb array), setup_followed (yes/partial/no), no_setup_reason, timeframe, session, trade_date, opened_at, closed_at, share_id (uuid nullable), shared_until (timestamptz nullable), external_id, source, created_at

**journal_entries** — Trade journals (1:1 with trades via trade_id CASCADE)
- id, user_id, trade_id, note, emotions[], confidence, screenshot_url, screenshot_urls (jsonb), created_at

**ai_insights** — AI analysis results (cached)
- id, user_id, trade_id, type ('trade_analysis'|'coach_report'), summary, mistakes (jsonb), severity, created_at

**user_preferences** — Per-user settings
- id, user_id (UNIQUE), avatar_url, full_name (text, migration 0023), custom_emotions[], custom_setups[], default_confidence, onboarding_complete, share_code, show_calendar, show_trades, show_payouts, show_trophies, calendar_mode, calendar_start, calendar_end, calendar_rolling_days, referral_balance, referred_by, created_at, updated_at

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

**subscriptions** — Plan management (Stripe planned)
- id, user_id, plan, status, stripe_id, renews_at, created_at

**site_settings** — Global settings (beta_count, etc.)
- id, key (unique), value (jsonb), updated_at

**support_tickets** — User support tickets
- id, user_id, user_email, category, subject, description, screenshot_url, screenshot_urls (jsonb), status, admin_reply, created_at, updated_at

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
| OPENROUTER_MODEL | Override AI model slug (default: anthropic/claude-3-5-haiku) |
| NEXT_PUBLIC_POSTHOG_KEY | PostHog analytics key |
| RESEND_API_KEY | Resend email API key |
| RESEND_FROM | Resend sender address |
| SUPABASE_SERVICE_ROLE_KEY | Service role key (admin operations, notifications) |

## 8. Common Pitfalls (Learned the Hard Way)

1. **Never add 'strict-dynamic' to CSP** without implementing nonce-based script loading. Next.js 14 relies on 'unsafe-inline' for its bootstrapping scripts.

2. **Never rewrite entire page files** for targeted fixes. Make surgical edits. The audit agent destroyed two critical pages by rewriting them from scratch.

3. **AbortError handlers must throw, not return.** Returning `{ error: '...' }` from a function that normally returns a string causes type mismatches in callers.

4. **computeStats returns { n, net, winRate, profitFactor, avgR }** — not { total, totalPnl }. Always check the actual function signature before using return values.

5. **computeDisciplineStats, computeWeeklyScore, computeEliteWeekStreak all require (trades, journals)** as two arguments. Passing only trades breaks journal-based scoring.

6. **computeAchievements expects a metrics object** like { totalTrades, journalStreak, ... } — not the raw trades array.

7. **DashboardShareButton accepts { data }**, not { stats, trades }. TradeTable accepts { rows }, not { trades }.

8. **ai_insights.summary** is the column name, not "insight". The column "tags" does not exist.

9. **expenses.total_cost** is the column name, not "amount". payouts.payout_date not "date", payouts.notes not "note".

10. **Trade columns are entry_price, exit_price, stop_loss, take_profit** — not sl_price/tp_price.

11. **ISR (revalidate) + cookies()** — cookies() forces dynamic rendering regardless of revalidate setting, but can cause stale JS bundle issues during redeployments.

12. **Vercel deployments take 60-90s** and edge cache propagation can take longer. Users should hard-refresh (Ctrl+Shift+R) after deployments.

13. **Trading day boundary is midnight UTC (= 5:30 AM IST).** Always use `getTradingDate()` or `getTradingMonth()` from `lib/stats.js` for "today" logic. Never use `toLocaleDateString` with a timezone — that was the old IST approach. A trade at 3:00 AM IST belongs to the previous trading day; a trade at 6:00 AM IST starts the new day.

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
