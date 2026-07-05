import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import QuickLog from '@/components/trades/QuickLog';
import RiskFooter from '@/components/layout/RiskFooter';
import NotificationBell from '@/components/notifications/NotificationBell';
import Logo from '@/components/Logo';
import Link from 'next/link';
import { num, fmtMoney, fmtMoneyCompact, getTradingDate } from '@/lib/stats';
import { getUserAccess } from '@/lib/plans';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { buildTrialEndingEmail } from '@/lib/subscription-emails';
import { notify, TYPES } from '@/lib/notifications';
import { ADMIN_EMAIL } from '@/lib/supabase/admin';
import GuidedTour from '@/components/ui/GuidedTour';
import { buildAccess } from '@/lib/plans';

/* Admin notification types — excluded from user dashboard bell */
const ADMIN_NOTIF_TYPES = ['new_support_ticket', 'new_user_signup', 'ticket_user_replied', 'ticket_closed'];

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('onboarding_complete, referred_by, referral_balance, avatar_url, full_name, is_beta')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!prefs || !prefs.onboarding_complete) {
    redirect('/onboarding');
  }

  /* Auto-save full_name from Google OAuth metadata if not yet set */
  if (prefs && !prefs.full_name) {
    const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (googleName) {
      try {
        await supabase
          .from('user_preferences')
          .update({ full_name: googleName })
          .eq('user_id', user.id);
        prefs.full_name = googleName;
      } catch (e) {}
    }
  }

  try {
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
  } catch (e) {}

  // Plan access + subscription for banners
  const access = await getUserAccess(supabase, user);
  const planAccess = access.toJSON();
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at, renews_at, cancelled_at, billing_cycle')
    .eq('user_id', user.id)
    .maybeSingle();

  // Trial ending email: send once when 3 days or less remain
  if (isEmailConfigured() && subscription?.trial_ends_at && subscription?.status !== 'cancelled') {
    const trialEnd = new Date(subscription.trial_ends_at);
    const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 3) {
      try {
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
      } catch (e) { /* Non-critical — don't break dashboard */ }
    }
  }

  const today = getTradingDate(); // UTC midnight = 5:30 AM IST trading day boundary
  const { data: todayTrades } = await supabase
    .from('trades')
    .select('pnl, trade_date')
    .eq('user_id', user.id)
    .gte('trade_date', today);
  const todayPnl = (todayTrades || []).reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const tone = todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
  // Short P&L for mobile header — drop decimals, use k suffix for $1000+
  const todayPnlShort = (() => {
    const sign = todayPnl >= 0 ? '+' : '-';
    const abs = Math.abs(todayPnl);
    if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return sign + '$' + Math.round(abs);
  })();

  /* ── Notification unread count ── */
  let notifCount = 0;
  let adminNotifCount = 0;
  try {
    let q = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    for (const t of ADMIN_NOTIF_TYPES) { q = q.neq('type', t); }
    const { count } = await q;
    notifCount = count || 0;
  } catch (e) {
    // notifications table may not exist yet (pre-migration)
  }
  if (user.email === ADMIN_EMAIL) {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .in('type', ADMIN_NOTIF_TYPES);
      adminNotifCount = count || 0;
    } catch (e) {}
  }

  /* ── Trade count for guided tour ── */
  let tradeCount = 0;
  try {
    const { count } = await supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    tradeCount = count || 0;
  } catch (e) {}

  const isAdmin = user.email === ADMIN_EMAIL;
  const initial = user.email ? user.email.charAt(0).toUpperCase() : '?';

  /* ── Plan access ── */
  const isBeta = prefs?.is_beta === true;
  const planAccess = buildAccess('basic', isBeta, isAdmin).toJSON();

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} credits={prefs.referral_balance} avatarUrl={prefs.avatar_url} isAdmin={isAdmin} adminNotifCount={adminNotifCount} fullName={prefs?.full_name || ''} planAccess={planAccess} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav email={user.email} avatarUrl={prefs.avatar_url} isAdmin={isAdmin} adminNotifCount={adminNotifCount} credits={prefs.referral_balance} fullName={prefs?.full_name || ''} planAccess={planAccess} />
            <Link href="/dashboard" className="sm:hidden">
              <Logo size={28} wordmarkClassName="font-display text-base font-bold" />
            </Link>
            <span className="hidden font-mono text-xs uppercase tracking-wider text-white/55 sm:block">PropLogAI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell initialCount={notifCount} excludeTypes={ADMIN_NOTIF_TYPES} />
            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 sm:gap-2 sm:px-3 sm:py-1.5 min-h-[44px]">
              <span className="hidden font-mono text-xs uppercase tracking-wider text-white/55 sm:inline">Today</span>
              <span className={'font-mono text-xs font-semibold sm:text-sm ' + tone}>{fmtMoney(todayPnl)}</span>
            </div>
            <span className="hidden font-mono text-xs text-white/55 sm:block">{user.email}</span>
          </div>
        </header>
        <main className="flex-1"><SubscriptionBanner subscription={subscription} planAccess={planAccess} />{children}</main>
        <RiskFooter />
      </div>
      <QuickLog />
      <GuidedTour hasTrades={tradeCount > 0} />
    </div>
  );
}
