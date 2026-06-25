"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAIL } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { TYPES } from '@/lib/notifications';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Unauthorized');
  return user;
}

/** Notify the ticket owner (uses admin client to bypass RLS) */
async function notifyTicketOwner(sb, ticketId, type, title, message) {
  try {
    const { data: ticket } = await sb
      .from('support_tickets')
      .select('user_id, subject')
      .eq('id', ticketId)
      .single();
    if (!ticket) return;
    await sb.from('notifications').insert({
      user_id: ticket.user_id,
      type,
      title,
      message: message || ticket.subject,
      metadata: { link: '/dashboard/support' },
    });
  } catch (e) {
    console.error('[notify] ticket owner notification failed:', e?.message);
  }
}

export async function updateTicketStatus(ticketId, status) {
  await requireAdmin();
  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client not configured.' };

  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) return { error: 'Invalid status.' };

  const { error } = await sb
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) return { error: error.message };

  // ── Notify ticket owner ──
  const label = status.replace('_', ' ');
  await notifyTicketOwner(sb, ticketId, TYPES.TICKET_STATUS, 'Ticket Status Updated', `Your ticket status changed to ${label}`);

  revalidatePath('/admin/tickets');
  return { ok: true };
}

export async function replyToTicket(ticketId, reply) {
  await requireAdmin();
  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client not configured.' };

  if (!reply || !reply.trim()) return { error: 'Reply cannot be empty.' };

  const { error } = await sb
    .from('support_tickets')
    .update({
      admin_reply: reply.trim().slice(0, 5000),
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);

  if (error) return { error: error.message };

  // ── Notify ticket owner about admin reply ──
  await notifyTicketOwner(sb, ticketId, TYPES.TICKET_REPLIED, 'Support Ticket Reply', 'An admin has replied to your support ticket');

  revalidatePath('/admin/tickets');
  revalidatePath('/dashboard/support');
  return { ok: true };
}
