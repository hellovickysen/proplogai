import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardLayout from '@/app/dashboard/layout';
import PreviewDashboardShell from './PreviewDashboardShell';
import { getPreviewAccessConfig, isPreviewUserAllowed } from './preview-access.mjs';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AIAnalyticsMockupLayout({ children }) {
  // Local review uses the same shared chrome components without requiring a
  // Supabase session. Production uses DashboardLayout with the real user data.
  if (process.env.NODE_ENV === 'development') {
    return <PreviewDashboardShell>{children}</PreviewDashboardShell>;
  }

  const access = getPreviewAccessConfig(process.env);
  if (!access.enabled || access.allowedUserIds.length === 0) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=%2Fai-analytics-mockup');
  if (!isPreviewUserAllowed(user.id, access.allowedUserIds)) notFound();

  return (
    <DashboardLayout>
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">{children}</div>
    </DashboardLayout>
  );
}
