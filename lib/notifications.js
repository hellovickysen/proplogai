/**
 * Notification system for PropLogAI
 *
 * Usage in server actions:
 *   import { notify, TYPES } from '@/lib/notifications';
 *   await notify(supabase, user.id, TYPES.TRADE_LOGGED, 'Trade Logged', 'XAU/USD long +$245');
 */

/* ── Notification type constants ─────────────────────────── */
export const TYPES = {
  // User activities
  TRADE_LOGGED:          'trade_logged',
  JOURNAL_ADDED:         'journal_added',
  AI_ANALYSIS:           'ai_analysis_complete',
  AI_COACH_REPORT:       'ai_coach_report',
  TROPHY_UPLOADED:       'trophy_uploaded',
  PAYOUT_LOGGED:         'payout_logged',
  EXPENSE_LOGGED:        'expense_logged',
  ACHIEVEMENT_UNLOCKED:  'achievement_unlocked',
  REFERRAL_REWARD:       'referral_reward',
  TICKET_REPLIED:        'ticket_replied',
  TICKET_STATUS:         'ticket_status_changed',
  // Admin
  NEW_USER:              'new_user_signup',
  NEW_TICKET:            'new_support_ticket',
};

/* ── Icon + color map for the UI ─────────────────────────── */
export const NOTIFICATION_META = {
  trade_logged:           { icon: '📊', color: 'text-emerald-400' },
  journal_added:          { icon: '📝', color: 'text-violet-400' },
  ai_analysis_complete:   { icon: '🤖', color: 'text-cyan-400' },
  ai_coach_report:        { icon: '✦',  color: 'text-amber-400' },
  trophy_uploaded:        { icon: '🏆', color: 'text-amber-400' },
  payout_logged:          { icon: '💰', color: 'text-emerald-400' },
  expense_logged:         { icon: '💳', color: 'text-red-400' },
  achievement_unlocked:   { icon: '🎖️', color: 'text-amber-400' },
  referral_reward:        { icon: '🎁', color: 'text-emerald-400' },
  ticket_replied:         { icon: '💬', color: 'text-cyan-400' },
  ticket_status_changed:  { icon: '🎫', color: 'text-violet-400' },
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
