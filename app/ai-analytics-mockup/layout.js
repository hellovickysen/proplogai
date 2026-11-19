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
  // Local standalone review can use shared chrome without a Supabase session.
  // Full-site local validation opts into the real authenticated dashboard shell.
  if (
    process.env.NODE_ENV === 'development'
    && process.env.AI_ANALYTICS_USE_LOCAL_AUTH !== 'true'
  ) {
    return <PreviewDashboardShell>{children}</PreviewDashboardShell>;
  }

  if (process.env.NODE_ENV === 'development') {
    return (
      <DashboardLayout>
        <div className="min-w-0 w-full max-w-full overflow-x-hidden">{children}</div>
      </DashboardLayout>
    );
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
