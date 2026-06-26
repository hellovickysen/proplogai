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
  // Admin actions on the user's ticket
  TICKET_REPLIED:        'ticket_replied',
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

/* ── Notify the admin user (uses service-role to bypass RLS) */
let _adminId = null;

export async function notifyAdmin(type, title, message = null, metadata = {}) {
  try {
    const { createAdminClient, ADMIN_EMAIL } = await import('@/lib/supabase/admin');
    const svc = createAdminClient();
    if (!svc) return;

    // Resolve admin user_id (cached after first lookup)
    if (!_adminId) {
      const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const adminUser = (data?.users || []).find(u => u.email === ADMIN_EMAIL);
      if (!adminUser) return;
      _adminId = adminUser.id;
    }

    await svc.from('notifications').insert({
      user_id: _adminId,
      type,
      title,
      message,
      metadata,
    });
  } catch (e) {
    console.error('[notifyAdmin]', e?.message);
  }
}
