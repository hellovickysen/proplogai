import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import RiskFooter from '@/components/layout/RiskFooter';
import NotificationBell from '@/components/notifications/NotificationBell';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { num, fmtMoney, fmtMoneyCompact, getTradingDate } from '@/lib/stats';
import { buildAccess } from '@/lib/plans';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildTrialEndingEmail } from '@/lib/subscription-emails';
import { notify, TYPES } from '@/lib/notifications';
import { ADMIN_EMAIL } from '@/lib/supabase/admin';
import SearchBar from '@/components/layout/SearchBar';
import LiveClock from '@/components/layout/LiveClock';
import QuickActions from '@/components/layout/QuickActions';
import HeaderAvatar from '@/components/layout/HeaderAvatar';
import AccountSwitcher from '@/components/accounts/AccountSwitcher';
import SmartHeader from '@/components/layout/SmartHeader';
import { getAccounts, getActiveAccountId, getAccountStats } from '@/lib/accounts';

/* Admin notification types — excluded from user dashboard bell */
const ADMIN_NOTIF_TYPES = ['new_support_ticket', 'new_user_signup', 'ticket_user_replied', 'ticket_closed'];

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();

  /* ── Step 1: Auth check (must happen first) ── */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const isAdmin = user.email === ADMIN_EMAIL;
  const today = getTradingDate();

  /* ── Step 2: Parallel data fetch ──
   * Previously these ran sequentially (~10 round-trips, 5-7s).
   * Now they fire in a single parallel wave. */
  const notifQuery = (() => {
    let q = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    for (const t of ADMIN_NOTIF_TYPES) { q = q.neq('type', t); }
    return q;
  })();

  const [
    prefsResult,
    subResult,
    todayTradesResult,
    notifCountResult,
    adminNotifCountResult,
    accountsData,
    activeAccountIdData,
    todayAccountStats,
  ] = await Promise.all([
    supabase
      .from('user_preferences')
      .select('onboarding_complete, referred_by, referral_balance, avatar_url, full_name, is_beta')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan, status, trial_ends_at, renews_at, cancelled_at, billing_cycle, razorpay_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('trades')
      .select('pnl, trade_date')
      .eq('user_id', user.id)
      .gte('trade_date', today),
    notifQuery,
    isAdmin
      ? supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .in('type', ADMIN_NOTIF_TYPES)
      : Promise.resolve({ count: 0 }),
    getAccounts(supabase, user.id),
    getActiveAccountId(supabase, user.id),
    getAccountStats(supabase, user.id, today),
  ]);

  const prefs = prefsResult?.data;
  const subscription = subResult?.data || null;

  /* ── Step 3: Onboarding redirect (depends on prefs) ── */
  if (!prefs || !prefs.onboarding_complete) {
    redirect('/onboarding');
  }

  /* ── Step 4: Derive all values from parallel-fetched data ── */

  // Plan access — replicate getUserAccess() logic inline to avoid
  // its internal duplicate user_preferences + subscriptions queries.
  const rawPlan = subscription?.plan || 'basic';
  const plan = (rawPlan === 'free' ? 'basic' : rawPlan === 'pro' ? 'elite' : rawPlan) || 'basic';
  const isBeta = prefs?.is_beta === true;
  const isActiveSub = subscription && (subscription.status === 'active' || subscription.status === 'authenticated');
  const isTrialing = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();
  const effectivePlan =
    isAdmin || isBeta || (plan === 'elite' && (isActiveSub || isTrialing))
      ? 'elite'
      : plan === 'elite' && !isActiveSub && !isTrialing
        ? 'basic'
        : plan;

  const access = buildAccess(effectivePlan === 'elite' ? 'elite' : plan, isBeta, isAdmin, {
    subscriptionStatus: subscription?.status || null,
    isTrialing: !!isTrialing,
    trialEndsAt: subscription?.trial_ends_at || null,
    renewsAt: subscription?.renews_at || null,
    razorpaySubscriptionId: subscription?.razorpay_subscription_id || null,
  });
  const planAccess = access.toJSON();

  // Today's P&L
  const todayTrades = todayTradesResult?.data || [];
  const todayPnl = todayTrades.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const tone = todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
  const todayPnlShort = (() => {
    const sign = todayPnl >= 0 ? '+' : '-';
    const abs = Math.abs(todayPnl);
    if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return sign + '$' + Math.round(abs);
  })();

  // Notifications
  const notifCount = notifCountResult?.count || 0;
  const adminNotifCount = isAdmin ? (adminNotifCountResult?.count || 0) : 0;

  // Multi-account
  const isElite = access.canUse('multi_account');
  const accounts = isElite ? (accountsData || []) : [];
  const activeAccountId = isElite ? (activeAccountIdData || null) : null;

  const initial = user.email ? user.email.charAt(0).toUpperCase() : '?';

  /* ── Step 5: Fire-and-forget side effects ──
   * These don't affect the rendered UI so they run in the background
   * without blocking the response. */
  Promise.resolve().then(async () => {
    try {
      // Auto-save full_name from Google OAuth metadata if not yet set
      if (!prefs.full_name) {
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (googleName) {
          await supabase
            .from('user_preferences')
            .update({ full_name: googleName })
            .eq('user_id', user.id);
        }
      }

      // Referral cookie processing
      const cookieStore = cookies();
      const refCookie = cookieStore.get('ref_code');
      if (refCookie && refCookie.value && !prefs.referred_by) {
        const refCode = refCookie.value;
        const { data: refRow } = await supabase
          .from('referral_codes')
          .select('user_id, code')
          .eq('code', refCode)
          .maybeSingle();
        if (refRow && refRow.user_id !== user.id) {
          const { data: existingRef } = await supabase
            .from('referrals')
            .select('id')
            .eq('referred_user_id', user.id)
            .maybeSingle();
          if (!existingRef) {
            await supabase
              .from('user_preferences')
              .update({ referred_by: refCode })
              .eq('user_id', user.id);
            await supabase.from('referrals').insert({
              referrer_id: refRow.user_id,
              referred_user_id: user.id,
              referred_email: user.email || null,
              status: 'pending',
              reward_given: false,
            });
          }
        }
      }

      // Trial ending email: send once when 3 days or less remain
      if (isEmailConfigured() && subscription?.trial_ends_at && subscription?.status !== 'cancelled') {
        const trialEnd = new Date(subscription.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 3) {
          const { data: alreadySent } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'trial_ending')
            .maybeSingle();
          if (!alreadySent) {
            const trialEmail = buildTrialEndingEmail({ trialEndsAt: subscription.trial_ends_at });
            await sendEmail({ to: user.email, subject: trialEmail.subject, html: trialEmail.html });
            await notify(supabase, user.id, TYPES.TRIAL_ENDING || 'trial_ending',
              'Trial ending soon',
              `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Subscribe to keep Elite features.`,
              { link: '/dashboard/settings?tab=billing' }
            );
          }
        }
      }
    } catch (e) {
      /* Non-critical — don't break dashboard */
    }
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} fullName={prefs?.full_name || ''} avatarUrl={prefs.avatar_url} planAccess={planAccess} credits={prefs.referral_balance} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SmartHeader>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <MobileNav email={user.email} avatarUrl={prefs.avatar_url} isAdmin={isAdmin} adminNotifCount={adminNotifCount} credits={prefs.referral_balance} fullName={prefs?.full_name || ''} planAccess={planAccess} />
            <Link href="/dashboard" className="sm:hidden flex-shrink-0">
              <Logo size={28} wordmarkClassName="font-display text-base font-bold" />
            </Link>
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 min-h-[36px]">
              <span className="font-mono text-xs uppercase tracking-wider text-white/55">Today</span>
              <span className={'font-mono text-xs font-semibold ' + tone}>{fmtMoney(todayPnl)}</span>
            </div>
            <AccountSwitcher accounts={accounts} activeAccountId={activeAccountId} todayStats={todayAccountStats} planAccess={planAccess} />
          </div>
          <SearchBar planAccess={planAccess} />
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LiveClock />
            <NotificationBell initialCount={notifCount} excludeTypes={ADMIN_NOTIF_TYPES} />
            <div className="flex sm:hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 min-h-[36px]">
              <span className={'font-mono text-xs font-semibold ' + tone}>{fmtMoney(todayPnl)}</span>
            </div>
            <div className="hidden sm:block">
              <HeaderAvatar email={user.email} fullName={prefs?.full_name || ''} avatarUrl={prefs.avatar_url} credits={prefs.referral_balance} isAdmin={isAdmin} adminNotifCount={adminNotifCount} planAccess={planAccess} />
            </div>
          </div>
        </SmartHeader>
        <main className="flex-1"><SubscriptionBanner subscription={subscription} planAccess={planAccess} />{children}</main>
        <RiskFooter />
      </div>
      <QuickActions />
    </div>
  );
}
