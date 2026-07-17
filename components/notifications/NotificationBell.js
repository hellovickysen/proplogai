"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NOTIFICATION_META } from '@/lib/notifications';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@/app/dashboard/notifications/actions';

/* -- Relative time helper ---------------------------------------- */
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

/* -- Bell icon SVG ------------------------------------------------ */
function BellIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/* -- Inline toast for real-time notifications -------------------- */
function RealtimeToast({ notification, onDismiss }) {
  const m = NOTIFICATION_META[notification.type] || { icon: '🔔', color: 'text-white/70' };

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-[slideUp_0.3s_ease-out] rounded-2xl border border-white/10 bg-[#12121a] p-4 shadow-2xl sm:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-white/[0.06] text-base">
          {m.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          {notification.message && (
            <p className="mt-0.5 truncate text-xs text-white/40">{notification.message}</p>
          )}
        </div>
        <button onClick={onDismiss} className="flex-shrink-0 text-white/30 hover:text-white/60 text-xs">✕</button>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* -- Main component ----------------------------------------------- */
export default function NotificationBell({ initialCount = 0, typeFilter = null, excludeTypes = null }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState(null);
  const ref = useRef(null);
  const router = useRouter();

  /* Close on outside click */
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') setOpen(false); }
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  /* ── Supabase Realtime subscription ────────────────────────── */
  useEffect(() => {
    let channel = null;

    try {
      const supabase = createClient();
      let userId = null;

      // Get current user for filtering
      supabase.auth.getUser().then(({ data }) => {
        userId = data?.user?.id;
      });

      channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          (payload) => {
            const newNotif = payload.new;

            // Filter: only process notifications for this user
            if (userId && newNotif.user_id !== userId) return;

            // Filter by typeFilter (if set, only show matching types)
            if (typeFilter && !typeFilter.includes(newNotif.type)) return;

            // Filter by excludeTypes (if set, skip excluded types)
            if (excludeTypes && excludeTypes.includes(newNotif.type)) return;

            // Increment unread count
            setCount((c) => c + 1);

            // Prepend to items if dropdown is open
            setItems((prev) => {
              if (prev.length === 0) return prev; // Not loaded yet
              // Avoid duplicate
              if (prev.some((n) => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev].slice(0, 20);
            });

            // Show toast
            setRealtimeToast(newNotif);
          }
        )
        .subscribe((status, err) => {
          // Gracefully handle subscription failures (e.g. WebSocket blocked by CSP)
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[NotificationBell] Realtime subscription failed:', status, err?.message);
          }
        });

      return () => {
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      };
    } catch (err) {
      // WebSocket may be unavailable (e.g. blocked by CSP on iOS Safari).
      // Degrade gracefully — the 60s polling fallback still works.
      console.warn('[NotificationBell] Realtime setup failed, falling back to polling:', err.message);
      return () => {};
    }
  }, [typeFilter, excludeTypes]);

  /* Poll unread count every 60s (fallback if Realtime drops) */
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await getUnreadCount(typeFilter, excludeTypes);
      if (typeof res.count === 'number') setCount(res.count);
    }, 60_000);
    return () => clearInterval(id);
  }, [typeFilter, excludeTypes]);

  /* Sync prop on server re-render */
  useEffect(() => { setCount(initialCount); }, [initialCount]);

  /* Fetch notifications when panel opens */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications(15, 0, typeFilter, excludeTypes);
    if (res.data) {
      setItems(res.data);
      setHasMore((res.total || 0) > 15);
    }
    const c = await getUnreadCount(typeFilter, excludeTypes);
    if (typeof c.count === 'number') setCount(c.count);
    setLoading(false);
  }, [typeFilter, excludeTypes]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) fetchItems();
  }

  /* Mark all as read */
  async function handleMarkAll() {
    await markAllAsRead(typeFilter, excludeTypes);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setCount(0);
  }

  /* Mark single item read on click */
  async function handleItemClick(item) {
    if (!item.is_read) {
      await markAsRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      setCount((c) => Math.max(0, c - 1));
    }
    // Navigate if the notification has a link
    if (item.metadata?.link) {
      setOpen(false);
      router.push(item.metadata.link);
    }
  }

  const meta = (type) => NOTIFICATION_META[type] || { icon: '🔔', color: 'text-white/70' };

  return (
    <div ref={ref} className="relative">
      {/* -- Bell button -- */}
      <button
        onClick={toggle}
        className="relative grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-white/[0.06] min-h-[44px] min-w-[44px]"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      >
        <BellIcon className={'transition-colors ' + (open ? 'text-white' : 'text-white/55')} />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-[#08080f] shadow-lg"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* -- Backdrop (mobile) -- */}
      {open && <div className="fixed inset-0 z-[55] bg-black/60 sm:hidden" onClick={() => setOpen(false)} />}

      {/* -- Dropdown panel -- */}
      {open && (
        <div className="fixed left-3 right-3 top-[4.5rem] z-[60] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e18] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {count > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold text-[#08080f]"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                >
                  {count}
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-400 transition-colors hover:bg-white/[0.06]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Read all
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {loading && items.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="text-2xl opacity-40">🔕</span>
                <p className="text-sm font-medium text-white/40">No notifications yet</p>
                <p className="text-xs text-white/40">Your activity will show up here.</p>
              </div>
            ) : (
              items.map((item) => {
                const m = meta(item.type);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ' +
                      (!item.is_read ? 'bg-white/[0.02]' : '')
                    }
                  >
                    {/* Icon */}
                    <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-white/[0.06] text-base">
                      {m.icon}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={'text-sm font-medium leading-snug ' + (item.is_read ? 'text-white/60' : 'text-white')}>
                        {item.title}
                      </p>
                      {item.message && (
                        <p className="mt-0.5 truncate text-xs text-white/40">{item.message}</p>
                      )}
                      <p className="mt-1 font-mono text-[10px] text-white/40">{timeAgo(item.created_at)}</p>
                    </div>
                    {/* Unread dot */}
                    {!item.is_read && (
                      <span
                        className="mt-2 h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-white/50 transition-colors hover:text-white/80"
              >
                View all notifications
                <span className="text-[10px]">→</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* -- Realtime toast notification -- */}
      {realtimeToast && (
        <RealtimeToast
          notification={realtimeToast}
          onDismiss={() => setRealtimeToast(null)}
        />
      )}
    </div>
  );
}
