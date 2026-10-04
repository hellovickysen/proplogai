import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPreviewAccessConfig, isPreviewUserAllowed } from './preview-access.mjs';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AIAnalyticsMockupLayout({ children }) {
  // Keep the isolated mockup reviewable without production credentials locally.
  if (process.env.NODE_ENV === 'development') return children;

  const access = getPreviewAccessConfig(process.env);
  if (!access.enabled || access.allowedUserIds.length === 0) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=%2Fai-analytics-mockup');
  if (!isPreviewUserAllowed(user.id, access.allowedUserIds)) notFound();

  return children;
}
