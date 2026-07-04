"use client";

import { useState, useTransition } from 'react';
import { NOTIFICATION_META } from '@/lib/notifications';
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from '@/app/dashboard/notifications/actions';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationList({ initial, total }) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(total > initial.length);
  const [pending, startTransition] = useTransition();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const meta = (type) => NOTIFICATION_META[type] || { icon: '🔔', color: 'text-white/70' };
  const unread = items.filter((n) => !n.is_read).length;
  const displayItems = showUnreadOnly ? items.filter((n) => !n.is_read) : items;

  function handleMarkAll() {
    startTransition(async () => {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    });
  }

  function handleClearAll() {
    startTransition(async () => {
      await clearAllNotifications();
      setItems([]);
      setHasMore(false);
    });
  }

  function handleRead(id) {
    startTransition(async () => {
      await markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    });
  }

  function handleDelete(id) {
    startTransition(async () => {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    });
  }

  function loadMore() {
    startTransition(async () => {
      const res = await getNotifications(50, items.length);
      if (res.data) {
        setItems((prev) => [...prev, ...res.data]);
        setHasMore((res.total || 0) > items.length + res.data.length);
      }
    });
  }

  return (
    <div>
      {/* Action bar */}
      {items.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ' + (showUnreadOnly ? 'border-violet-400/40 bg-violet-500/15 text-violet-300' : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]')}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: showUnreadOnly ? 'linear-gradient(135deg,#a78bfa,#22d3ee)' : 'rgba(255,255,255,0.3)' }} />
              {showUnreadOnly ? `Unread (${unread})` : 'Unread only'}
            </button>
          )}
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-cyan-400 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Mark all as read
            </button>
          )}
          <button
            onClick={handleClearAll}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
            Clear all
          </button>
        </div>
      )}

      {/* Notification list */}
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
          <span className="text-4xl opacity-40">🔕</span>
          <p className="text-sm font-medium text-white/40">{showUnreadOnly ? 'No unread notifications' : 'No notifications'}</p>
          <p className="text-xs text-white/40">{showUnreadOnly ? 'All caught up!' : 'Your activity will show up here as you use PropLogAI.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {displayItems.map((item) => {
            const m = meta(item.type);
            return (
              <div
                key={item.id}
                className={
                  'group flex items-start gap-3 rounded-xl px-4 py-3.5 transition-colors ' +
                  (!item.is_read ? 'bg-white/[0.04] border border-white/[0.08]' : 'border border-transparent hover:bg-white/[0.03]')
                }
              >
                {/* Icon */}
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
                  {m.icon}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={'text-sm font-medium leading-snug ' + (item.is_read ? 'text-white/60' : 'text-white')}>
                      {item.title}
                    </p>
                    {!item.is_read && (
                      <span
                        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                      />
                    )}
                  </div>
                  {item.message && <p className="mt-0.5 text-xs text-white/40">{item.message}</p>}
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/40">{timeAgo(item.created_at)}</span>
                    {!item.is_read && (
                      <button onClick={() => handleRead(item.id)} className="text-[10px] font-medium text-cyan-400/70 hover:text-cyan-400">
                        Mark read
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="text-[10px] font-medium text-red-400/50 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={pending}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50"
            >
              {pending ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
