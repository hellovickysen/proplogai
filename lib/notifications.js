/**
 * Notification system for PropLogAI
 *
 * Usage in server actions:
 *   import { notify, TYPES } from '@/lib/notifications';
 *   await notify(supabase, user.id, TYPES.AI_ANALYSIS, 'AI Analysis Complete', 'XAU/USD — Grade: A');
 *
 * Only notify for: async results, surprise events, admin actions.
 * DO NOT notify for self-actions (trade logged, journal saved, expense added, etc.)
 */

/* ── Notification type constants ─────────────────────────── */
export const TYPES = {
  // Async results the user is waiting for
  AI_ANALYSIS:           'ai_analysis_complete',
  AI_COACH_REPORT:       'ai_coach_report',
  // Surprise events the user didn't directly trigger
  ACHIEVEMENT_UNLOCKED:  'achievement_unlocked',
  REFERRAL_REWARD:       'referral_reward',
  // Ticket events
  TICKET_REPLIED:        'ticket_replied',
  TICKET_STATUS:         'ticket_status',
  TICKET_USER_REPLIED:   'ticket_user_replied',
  TICKET_CLOSED:         'ticket_closed',
  TICKET_RESOLVED:       'ticket_resolved',
  // Admin alerts
  NEW_USER:              'new_user_signup',
  NEW_TICKET:            'new_support_ticket',
};

/* ── Icon + color map for the UI ─────────────────────────── */
export const NOTIFICATION_META = {
  ai_analysis_complete:   { icon: '🤖', color: 'text-cyan-400' },
  ai_coach_report:        { icon: '✦',  color: 'text-amber-400' },
  achievement_unlocked:   { icon: '🎖️', color: 'text-amber-400' },
  referral_reward:        { icon: '🎁', color: 'text-emerald-400' },
  ticket_replied:         { icon: '💬', color: 'text-cyan-400' },
  ticket_status:          { icon: '🔄', color: 'text-cyan-400' },
  ticket_user_replied:    { icon: '💬', color: 'text-violet-400' },
  ticket_closed:          { icon: '✅', color: 'text-emerald-400' },
  ticket_resolved:        { icon: '✔️', color: 'text-emerald-400' },
  new_user_signup:        { icon: '👤', color: 'text-cyan-400' },
  new_support_ticket:     { icon: '🎫', color: 'text-amber-400' },
};

/* ── Create a notification for the current user ──────────── */
export async function notify(supabase, userId, type, title, message = null, metadata = {}) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    });
  } catch (e) {
    // Notification failure must never break primary actions
    console.error('[notify]', e?.message);
  }
}

/* ── Admin ID resolution with caching and pagination ─────── */
let _adminId = null;
let _adminEmail = null;

async function getAdminId(svc, ADMIN_EMAIL) {
  // Return cached if still valid
  if (_adminId && _adminEmail === ADMIN_EMAIL) return _adminId;

  if (!ADMIN_EMAIL) return null;

  try {
    // Fetch in smaller pages to find the admin
    let page = 1;
    while (page <= 10) { // Cap at 10 pages (10,000 users)
      const { data } = await svc.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users || [];
      const admin = users.find(u => u.email === ADMIN_EMAIL);
      if (admin) {
        _adminId = admin.id;
        _adminEmail = ADMIN_EMAIL;
        return _adminId;
      }
      if (users.length < 1000) break; // No more pages
      page++;
    }
    console.warn('[notifyAdmin] Admin user not found for email:', ADMIN_EMAIL);
    return null;
  } catch (e) {
    console.warn('[notifyAdmin] Failed to resolve admin ID:', e?.message);
    return null;
  }
}

/* ── Notify the admin user (uses service-role to bypass RLS) */
export async function notifyAdmin(type, title, message = null, metadata = {}) {
  try {
    const { createAdminClient, ADMIN_EMAIL } = await import('@/lib/supabase/admin');
    const svc = createAdminClient();
    if (!svc) return;

    // Resolve admin user_id (cached after first lookup)
    const adminId = await getAdminId(svc, ADMIN_EMAIL);
    if (!adminId) {
      console.warn('[notifyAdmin] Could not resolve admin user ID — notification skipped.');
      return;
    }

    await svc.from('notifications').insert({
      user_id: adminId,
      type,
      title,
      message,
      metadata,
    });
  } catch (e) {
    console.error('[notifyAdmin]', e?.message);
  }
}
