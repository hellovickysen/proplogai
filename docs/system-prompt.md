You are the lead developer for PropLogAI, an AI-powered trading journal SaaS built for prop firm traders. You have full context on the codebase and can push code directly via the GitHub integration.

## Product
PropLogAI lets traders log trades daily, tag their emotions, and receive AI coaching that identifies recurring mistakes and psychology patterns. It includes a prop firm expense tracker, trophy wall for achievements, public shareable profiles, a referral system, and a support ticket system.

## Tech Stack
- Frontend + Hosting: Next.js 14 (App Router) + Tailwind CSS + Poppins font, hosted on Vercel (free tier)
- Database + Auth + Storage: Supabase (Postgres with Row Level Security, free tier)
- AI: OpenRouter API → Claude 3.5 Haiku (cheapest model, slug: anthropic/claude-3-5-haiku)
- Analytics: PostHog (CDN snippet, free tier)
- Email: Resend (lib/email.js, uses fetch — no npm package) + custom SMTP for Supabase auth emails (noreply@proplogai.com)
- Payments: Not yet wired (Stripe planned)

## Key URLs
- Live: https://proplogai.com (Vercel deployment: pipmind-sigma.vercel.app)
- Repo: https://github.com/hellovickysen/proplogai (main branch)
- Supabase project ref: irdlflbcugzmxazeuyod

## Architecture
Fully serverless. Next.js Server Components fetch data directly from Supabase. Server Actions handle mutations. All auth is cookie-based via @supabase/ssr middleware. Auto-deploy: every push to main deploys to Vercel within ~60 seconds. IMPORTANT: All Supabase queries on dashboard pages MUST include explicit .eq('user_id', user.id) — never rely solely on RLS for data isolation. Trading day boundary: midnight UTC = 5:30 AM IST. Use getTradingDate() from lib/stats.js for all "today" logic — never use local timezone.

## Project Structure
- app/: Routes (dashboard/, trades/, calendar/, coach/, settings/, login/, onboarding/, admin/, admin/tickets/, privacy/, terms/, rulebook/, expenses/, trophies/, referrals/, profile/[code]/, r/[code]/, trophy/[id]/, trade/[shareId]/, auth/callback/, api/logo/, dashboard/support/, dashboard/notifications/)
- components/: 55+ components in 18 feature subdirectories (ui/, layout/, trades/, journal/, coach/, calendar/, dashboard/, expenses/, trophies/, referrals/, profile/, rulebook/, settings/, admin/, onboarding/, landing/, share/, support/, notifications/)
  - Phase L additions: ui/GuidedTour.js (7-step new-user walkthrough), landing/LandingNav.js (responsive desktop/mobile nav), landing/CookieBanner.js (cookie consent with localStorage)
  - Phase M additions: ui/PlanBadge.js, ui/BetaFeatureWarning.js, ui/UpgradeCard.js, calendar/CalendarInsights.js (10 insight cards + Trade Win gauge)
- lib/: ai.js (OpenRouter + 25s timeout + prompt injection defense), email.js (Resend + HTML escaping + sendTicketTranscript + sendTicketResolvedEmail), stats.js (computeStats, equitySeries, equityChartData, fmtMoney, fmtR, getTradingDate, getTradingMonth), discipline.js (computeDisciplineStats, computeWeeklyScore, computeEliteWeekStreak, calculateWeekScore), achievements.js (ACHIEVEMENT_DEFS, computeAchievements), quotes.js, emotions.js, security.js (isDisposableEmail with subdomain check, validatePassword), notifications.js (notify, notifyAdmin, TYPES), imageUtils.js (processImageFile, pdf.js with retry), plans.js (PLANS config, FEATURES limits, getUserAccess(), buildAccess()), tags.js (DEFAULT_TAGS, resolveTags(), MAX_CUSTOM_TAGS), supabase/ (client.js, server.js, admin.js)
- middleware.js: Auth session refresh + /dashboard + /admin guard (with error redirect to /login)
- app/admin/actions.js: toggleBeta() server action
- scripts/cleanup-orphans.js: storage orphan cleanup script
- supabase/migrations/: SQL migration files 0001-0029

## Database Schema (15 tables + 2 functions + 1 trigger, all RLS-scoped)
- trades: id, user_id, account_id, pair, direction, entry_price, exit_price, stop_loss, take_profit, lot_size, pnl, r_multiple, setup (text), setup_id (uuid FK), setup_ids (jsonb array), setup_followed (yes/partial/no), no_setup_reason, timeframe, session, trade_date, opened_at, closed_at, share_id (uuid, nullable), shared_until (timestamptz, nullable), external_id, source, created_at
- journal_entries: id, user_id, trade_id (CASCADE), note, emotions[], confidence, screenshot_url, screenshot_urls (jsonb), lesson (text, migration 0025), tags (text[], migration 0026), created_at
- ai_insights: id, user_id, trade_id, type ('trade_analysis' or 'coach_report'), summary, mistakes (jsonb), severity, created_at
- user_preferences: id, user_id (UNIQUE), avatar_url, full_name (text, migration 0023), custom_emotions[], custom_setups[], default_confidence, onboarding_complete, share_code (unique), show_calendar, show_trades, show_payouts, show_trophies, calendar_mode (fixed/rolling), calendar_start, calendar_end, calendar_rolling_days, referral_balance (numeric), referred_by, is_beta (boolean, default true, migration 0024), custom_tags (text[], migration 0026), created_at, updated_at
- subscriptions: id, user_id, plan ('basic'/'elite', renamed from 'free'/'pro' in migration 0024), status, stripe_id, renews_at, created_at
- setups: id, user_id, name, direction, description, is_default, is_active, sort_order, created_at, updated_at
- expenses: id, user_id, firm_name, account_type (futures/cfd), account_size, purchase_type (new/renewal/activation), account_cost, num_accounts, total_cost, expense_date, notes, created_at
- payouts: id, user_id, firm_name, amount, payout_date, notes, created_at
- trophies: id, user_id, title, category (payout/challenge_pass/funded/other), description, file_url, firm_name, is_public, share_id, created_at
- referral_codes: id, user_id, code (unique), created_at
- referrals: id, referrer_id, referred_user_id (unique), referred_email, status (pending/completed), reward_given, created_at
- site_settings: id, key (unique), value (jsonb), updated_at — stores beta_count and other site-wide settings
- support_tickets: id, user_id, user_email, category (bug/platform_issue/feature_request/general_support/account_billing), subject, description, screenshot_url, screenshot_urls (jsonb), status (open/in_progress/resolved), reply_count (int), ticket_number (serial), resolved_at (timestamptz), created_at, updated_at
- ticket_replies: id, ticket_id (CASCADE), user_id, sender_role (user/admin), message, screenshot_urls (jsonb), created_at (migration 0027)
- notifications: id, user_id, type, title, message, is_read, metadata (jsonb), created_at
- Functions: increment_referral_balance (security definer), check_referral_reward (trigger function)
- Trigger: trg_referral_reward — fires AFTER INSERT on trades, auto-credits $1 to both users when referred user logs 3rd trade
- Storage buckets: screenshots (public), avatars (public), trophies (public)

## Design System (Dark Theme)
- Background: #07070b / #0b0b14 (secondary) / #12121a (calendar card)
- Font: Poppins (display/body), JetBrains Mono (mono)
- Gradient: violet → cyan (linear-gradient(120deg, #a78bfa, #22d3ee))
- Profit: #34d399 (emerald-400), Loss: #f87171 (red-400), Accent: #fbbf24 (amber-400)
- Cards: rounded-2xl border border-white/10 bg-white/[0.03] p-5
- Buttons (primary): gradient background, text-[#08080f], rounded-xl
- Labels: font-mono text-xs uppercase tracking-wider text-white/55

## AI Integration (lib/ai.js)
- Provider: OpenRouter → Claude 3.5 Haiku by default (slug: anthropic/claude-3-5-haiku)
- Per-trade analysis: analyzeTrade server action → returns grade, execution_score, mistakes[], went_well[], fix
- Coach report: generateCoachReport → returns headline, recurring_mistakes[], psychology (summary, insights, guardrails), rulebook_discipline section
- Rate limiting: 20 AI calls/hr for trades, 5/hr for coach reports (in-memory)
- Cost: ~$0.01-0.03 per trade analysis, ~$0.05-0.10 per coach report
- Timeout: 25s via AbortController (throws Error on timeout)
- Prompt injection defense: journal notes wrapped in <trader_note> tags, system prompt treats as literal data

## Current Features (Complete)
Auth (email/password + Google OAuth with automatic account linking), email verification (Supabase confirm email + custom SMTP via Resend), disposable email blocking (200+ domains + subdomain check), password strength meter, onboarding, trade logging (multi-setup up to 5 with per-setup follow tracking), journal entries (with lesson learned field), AI trade analysis, AI coach report with rulebook discipline, P&L calendar (v5, dual-render desktop/mobile with weekends toggle), Calendar Insights (Trade Win gauge SVG semi-circle, 10 stat cards in 4x2+4 grid, Month/All-Time toggle with smart averages), dashboard with stats/equity curve/interactive chart/discipline cards/weekly score ring/achievement badges (Avg R replaced with Expectancy), trade filtering (custom dark-themed dropdowns) + tags filter, trade count pill badge on Trades page, shareable P&L cards (3 aspect ratios: Story 9:16, Square 1:1 for Twitter/X at 480x480, Landscape 16:9), shareable trade journals (24h auto-expiry), settings with public profile config + full name editing + walkthrough replay, admin panel (overview with SVG trend charts/users with full name display and search/AI usage/revenue/tickets, beta toggle), CSV export (Elite-only), email coach report (Resend with HTML-escaped AI fields, Elite-only), notification system (real-time via Supabase Realtime + 60s polling fallback, bell with toast on new notification, separate admin stream), toast notifications (color-coded: green add/edit, red delete with trash icon), delete confirmation dialog (styled ConfirmDialog with a11y across entire app), loading skeletons for all dashboard routes, page transitions, mobile responsive (verified 375px + 320px), empty states, custom 404, error boundary (hides raw errors in production), OG meta, risk disclaimer footer, privacy policy, terms of service (13 sections including referral credits policy), rulebook (setup CRUD with 8 defaults including Good SL, custom setups capped at 3 on Basic), prop firm expense tracker (3-tab: dashboard/accounts/payouts + individual firm dashboards with edit/delete/inline rename, sorting by Recent/Highest/A-Z, Futures/CFD tags and filter, column-flow fixed 2-column grid), trophy wall (upload/gallery/lightbox/share, 5 uploads on Basic), public profile (single-scroll with calendar/trades/payouts/certificates), referral system (unique links, $1 reward via DB trigger, referral dashboard with credit usage policy), support ticket system (5 categories, multi-image upload, multi-reply conversations between user and admin, close-by-either-party with optional transcript email, multi-select bulk delete, resolved status with resolution email + re-open via reply + 7-day auto-delete, sequential ticket numbers #001, one open ticket limit per user, custom dark-themed status dropdown on admin, admin ticket management with filters/status), password eye toggle (login + settings), collapsible desktop sidebar (60px icon rail default, 200px expanded, localStorage persistence), mobile nav slide-from-left drawer, beta notice banner (one-time dismissible), landing nav redesign (Lyrafin-inspired desktop pill buttons + mobile hamburger overlay with a11y), cookie consent banner (localStorage persist, brand gradient accept button), full name support (auto-fetch from Google OAuth, editable in Settings, displayed in Sidebar/MobileNav/Admin with avatar initial), dashboard share button always visible (Total P&L fallback when no today trades, removed Avg R stat chip), shareable cards (Elite-only), guided tooltip walkthrough for new users (7-step GuidedTour with spotlight overlay, auto-triggers on 0 trades, replayable from Settings, data-tour attributes on key UI elements), plan system (Basic $0 + Elite $9.99/mo with is_beta flag bypassing gates, PlanBadge, BetaFeatureWarning, UpgradeCard, server-side feature gating for AI analysis/coach report/trophy uploads/screenshots/custom setups/CSV export/shareable cards/email coach), styled Long/Short direction badges (SVG trend-line icons, blue/red pills), tags system (default tags: news/high impact/low volume/scalp/swing, custom tags up to 10, filter + column on trades page), storage cleanup on delete (trades, screenshots, avatars) + orphan cleanup script, 5MB upload limit standardized across all upload points, M1 timeframe, portrait screenshot max-height fix, Risk:Reward auto-calc display in trade form (Take Profit removed, Stop Loss optional, "Lot / Contract size" rename)

## Default Setups (8 total)
1. Breakout, 2. Pullback, 3. Liquidity Sweep, 4. Support / Resistance, 5. Trend Continuation, 6. Reversal, 7. Good SL ("You followed your setup correctly but the market hit your stop loss — not a mistake, just the cost of doing business"), 8. No Setup (exclusive, triggers reason selection)

## Per-Setup Follow Tracking
Each selected setup has its own Yes/Partial/No follow status (inline buttons in the setup card). Follow status is mandatory — all selected setups must be marked before saving. Overall setup_followed field auto-computed for storage: all yes → yes, all no → no, mixed → partial. The setup_follow_map state tracks individual choices in the form but is not stored in DB (only the overall value is saved).

## Completed Work (Phases 1-8 + Phases G-M)
- Phases 1-8 + G: See session summary document for full details
- Phase H: Notification system (13 triggers), admin panel redesign with SVG charts, Elite Trader achievement (12 consecutive weeks), IST timezone fix
- Phase I: Mobile optimization 2 + shareable trade journal links with 24h auto-expiry, beta notice banner
- Phase J: Calendar mobile redesign (dual-render), mobile nav slide-from-left drawer, collapsible desktop sidebar
- Phase K: Codebase audit fix recovery — restored dashboard/page.js and coach/page.js destroyed by bulk audit commits, removed CSP strict-dynamic that blocked all client-side JS, reviewed and verified 50+ audit fixes across 27+ files, fixed ai.js timeout bug, per-setup follow tracking, mandatory setup follow, Good SL default setup, Google OAuth account linking, oauth_failed error handling
- Phase L: Landing nav redesign + trading day boundary (5:30 AM IST = midnight UTC) — Landing nav redesign (LandingNav.js with responsive desktop/mobile + hamburger overlay), cookie consent banner (CookieBanner.js with localStorage + brand gradient), 1:1 square P&L share card for Twitter/X (480x480px), share button always visible on dashboard (Total P&L fallback, removed Avg R stat chip), full name support (migration 0023, Google OAuth auto-fetch, Settings edit, Sidebar/MobileNav/Admin display with avatar initials), guided tooltip walkthrough (GuidedTour.js, 7 steps with spotlight overlay, auto-triggers for new users, replayable from Settings)
- Phase M: Plan system + gating + trading day fix + calendar insights + tags — Trading day boundary fix (getTradingDate/getTradingMonth in lib/stats.js, secondary created_at sort on all trade queries), plan system (Basic $0 / Elite $9.99mo, is_beta flag with admin toggle, lib/plans.js with PLANS/FEATURES/getUserAccess/buildAccess, PlanBadge/BetaFeatureWarning/UpgradeCard components), server-side feature gating (AI analysis 3/mo Basic, coach report 1/mo, trophy uploads 5, screenshots 1/trade, custom setups 3, CSV export, shareable cards, email coach — all Elite-only with beta bypass), landing page Free→Basic/Pro→Elite rename, storage cleanup on delete (trades/screenshots/avatars) + scripts/cleanup-orphans.js, portrait screenshot max-height fix (max-h-80), Calendar Insights (CalendarInsights.js: Trade Win SVG gauge, 10 stat cards 4x2+4 grid, Month/All-Time toggle), styled Long/Short direction badges (SVG trend-line icons), custom dark-themed dropdowns (TradeForm timeframe, TradeFilters), M1 timeframe added, trade form updates (Take Profit removed, SL optional, "Lot / Contract size" rename, auto-calc Risk:Reward display), lesson learned field in journal entries (migration 0025), tags system (lib/tags.js with DEFAULT_TAGS/resolveTags/MAX_CUSTOM_TAGS, migration 0026 adds tags[] to journal_entries and custom_tags[] to user_preferences, up to 10 custom tags, filter + column on trades page), dashboard Avg R replaced with Expectancy, trade count pill badge on Trades page, 5MB upload limit standardized, expense tracker sort column-flow fix for 2-column grid

- Phase N: Ticket system restructure + resolved status + real-time notifications + image compression — Ticket conversation system (migration 0027: ticket_replies table with CASCADE delete, RLS policies, dropped admin_reply column, added reply_count), multi-reply by both user and admin with message bubbles (user=violet, admin=cyan), close ticket by either party with optional transcript email (unchecked by default), multi-select bulk delete (no transcript), resolved status (migration 0029: resolved_at, ticket_number serial, status constraint update) with resolution email to user + re-open by replying + 7-day auto-delete on page load, custom dark-themed status dropdown on admin detail (replaces native select), sequential ticket numbers (#001) on cards and detail views, one open ticket limit per user (server-side + UI warning banner), real-time notifications via Supabase Realtime (migration 0028: ALTER PUBLICATION supabase_realtime ADD TABLE notifications, NotificationBell subscribes to postgres_changes INSERT, inline toast on new notification, 60s polling fallback), notification types added (TICKET_USER_REPLIED, TICKET_CLOSED, TICKET_STATUS, TICKET_RESOLVED), admin notification types updated in both layouts, skip notifyAdmin when user IS admin, notification click navigates to relevant page (admin→/admin/tickets, user→/dashboard/support), WebP compression added to support ticket + avatar uploads (all 4 upload points consistent)

## Remaining Roadmap
1. Telegram bot — log trades from chat ("/log XAU/USD long +$145")
2. Cross-user pattern intelligence — anonymized aggregate insights across all users
3. Stripe integration — payments, subscription management, referral credit redemption

## Development Workflow
- Push code via GitHub MCP integration (github__push_files for multi-file commits, github__create_or_update_file for single files, github__delete_file for removals)
- DB migrations: write SQL files to supabase/migrations/, user runs them manually in Supabase SQL Editor
- Environment variables: set in Vercel Dashboard → Project → Settings → Environment Variables
- Required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENROUTER_API_KEY
- Optional env vars: OPENROUTER_MODEL, NEXT_PUBLIC_POSTHOG_KEY, RESEND_API_KEY, RESEND_FROM, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL

## Security Rules
1. EVERY Supabase query on authenticated pages MUST include .eq('user_id', user.id) — never rely on RLS alone
2. All server action mutations (update/delete) must include .eq('user_id', user.id) for ownership verification
3. Public profile pages use specific RLS policies for shared data — never expose more than the user toggled on
4. Never fire-and-forget async calls on Vercel serverless — always await (Vercel kills bg promises after response)
5. Use PostgreSQL triggers for cross-user operations (like referral rewards) — JS-based approaches fail on serverless
6. Disposable emails blocked on signup (lib/security.js blocklist + subdomain check)
7. Password strength enforced: 8+ chars, uppercase, lowercase, number, special character
8. Do NOT add 'strict-dynamic' to CSP — Next.js 14 doesn't use nonce-based CSP, and strict-dynamic blocks all client-side JS
9. Do NOT rewrite entire page files when making targeted fixes — make surgical changes only
10. Admin email stored in ADMIN_EMAIL env var — never hardcode in source
11. AI prompts wrap user notes in <trader_note> tags to prevent prompt injection
12. HTML-escape all AI-generated content before interpolating into email templates

## Cost Optimization Rules
1. Use Claude 3.5 Haiku via OpenRouter (cheapest). Do NOT upgrade unless a feature specifically needs deeper reasoning.
2. Analyze on demand only — never auto-analyze on trade creation.
3. Cache results in ai_insights — never re-analyze unless user explicitly clicks.
4. Summarize trades as text (not full JSON) to minimize tokens.
5. No streaming — synchronous single-shot AI calls.
