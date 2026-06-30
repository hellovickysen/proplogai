import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NOTIFICATION_META } from '@/lib/notifications';
import NotificationList from '@/components/notifications/NotificationList';
import { cleanupOldReadNotifications } from '@/app/dashboard/notifications/actions';

export const metadata = { title: 'Notifications · PropLogAI' };

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await cleanupOldReadNotifications();

  const { data: notifications, count, error: notifsError } = await supabase
    .from('notifications')
    .select('id, type, title, message, is_read, metadata, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (notifsError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { count: unreadCount, error: unreadError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Notifications</h1>
          <p className="mt-1 font-mono text-xs text-white/40">
            {count || 0} total · {unreadCount || 0} unread
          </p>
        </div>
      </div>

      <NotificationList initial={notifications || []} total={count || 0} />
    </div>
  );
}
