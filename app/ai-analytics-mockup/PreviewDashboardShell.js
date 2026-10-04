import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import RiskFooter from '@/components/layout/RiskFooter';
import NotificationBell from '@/components/notifications/NotificationBell';
import Logo from '@/components/Logo';
import SmartHeader from '@/components/layout/SmartHeader';
import LazySearchBar from '@/components/layout/LazySearchBar';
import LiveClock from '@/components/layout/LiveClock';
import QuickActions from '@/components/layout/QuickActions';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import HeaderAvatar from '@/components/layout/HeaderAvatar';
import AccountSwitcher from '@/components/accounts/AccountSwitcher';

const PREVIEW_USER = {
  email: 'preview@proplogai.com',
  fullName: 'Preview Trader',
  avatarUrl: '',
};

const PREVIEW_ACCESS = {
  effectivePlan: 'elite',
  isAdmin: false,
  isBeta: false,
};

/**
 * Local-only dashboard chrome for reviewing the protected mockup without a
 * Supabase session. Production renders the real DashboardLayout instead.
 */
export default function PreviewDashboardShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar
        email={PREVIEW_USER.email}
        fullName={PREVIEW_USER.fullName}
        avatarUrl={PREVIEW_USER.avatarUrl}
        planAccess={PREVIEW_ACCESS}
        credits={2}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <SmartHeader>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileNav
              email={PREVIEW_USER.email}
              avatarUrl={PREVIEW_USER.avatarUrl}
              credits={2}
              fullName={PREVIEW_USER.fullName}
              planAccess={PREVIEW_ACCESS}
            />
            <Link href="/dashboard" className="flex-shrink-0 sm:hidden">
              <Logo size={28} showWordmark={false} />
            </Link>
            <div className="hidden min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 sm:flex">
              <span className="font-mono text-xs uppercase tracking-wider text-white/55">Today</span>
              <span className="font-mono text-xs font-semibold text-emerald-400">+$0.00</span>
            </div>
            <AccountSwitcher accounts={[]} activeAccountId={null} todayStats={{}} planAccess={PREVIEW_ACCESS} />
          </div>
          <LazySearchBar planAccess={PREVIEW_ACCESS} />
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <LiveClock />
            <NotificationBell initialCount={0} excludeTypes={[]} />
            <div className="flex min-h-[36px] items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 sm:hidden">
              <span className="font-mono text-xs font-semibold text-emerald-400">+$0.00</span>
            </div>
            <div className="hidden sm:block">
              <HeaderAvatar
                email={PREVIEW_USER.email}
                fullName={PREVIEW_USER.fullName}
                avatarUrl={PREVIEW_USER.avatarUrl}
                credits={2}
                planAccess={PREVIEW_ACCESS}
              />
            </div>
          </div>
        </SmartHeader>
        <main className="min-w-0 w-full max-w-full flex-1 overflow-x-hidden">{children}</main>
        <RiskFooter />
      </div>
      <QuickActions />
      <MobileBottomNav />
    </div>
  );
}
