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

/** Remove screenshot files from Supabase Storage */
async function cleanupScreenshots(sb, urls) {
  try {
    const paths = (urls || [])
      .filter((u) => typeof u === 'string' && u.includes('/screenshots/'))
      .map((u) => {
        const idx = u.indexOf('/screenshots/');
        return idx >= 0 ? u.slice(idx + '/screenshots/'.length) : null;
      })
      .filter(Boolean);
    if (paths.length > 0) {
      await sb.storage.from('screenshots').remove(paths);
    }
  } catch (e) {
    console.error('[cleanupScreenshots]', e?.message);
  }
}

/** Collect all screenshot URLs from a ticket and its replies */
function collectScreenshotUrls(ticket, replies) {
  const allUrls = [];
  if (ticket.screenshot_urls && Array.isArray(ticket.screenshot_urls)) allUrls.push(...ticket.screenshot_urls);
  for (const r of (replies || [])) {
    if (r.screenshot_urls && Array.isArray(r.screenshot_urls)) allUrls.push(...r.screenshot_urls);
  }
  return allUrls;
}

export async function updateTicketStatus(ticketId, status) {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client not configured.' };

  const validStatuses = ['open', 'in_progress'];
  if (!validStatuses.includes(status)) return { error: 'Invalid status. Use close action to close tickets.' };

  const { error } = await sb
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (error) return { error: error.message };

  const label = status.replace('_', ' ');
  await notifyTicketOwner(sb, ticketId, TYPES.TICKET_STATUS, 'Ticket Status Updated', `Your ticket status changed to ${label}`);

  revalidatePath('/admin/tickets');
  return { ok: true };
}

export async function replyToTicket(ticketId, message) {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client not configured.' };

  if (!message || !message.trim()) return { error: 'Reply cannot be empty.' };

  const msg = message.trim().slice(0, 5000);

  const { error } = await sb.from('ticket_replies').insert({
    ticket_id: ticketId,
    user_id: admin.id,
    sender_role: 'admin',
    message: msg,
    screenshot_urls: [],
  });

  if (error) return { error: error.message };

  const { data: ticket } = await sb
    .from('support_tickets')
    .select('reply_count')
    .eq('id', ticketId)
    .single();

  await sb
    .from('support_tickets')
    .update({
      status: 'in_progress',
      updated_at: new Date().toISOString(),
      reply_count: ((ticket?.reply_count) || 0) + 1,
    })
    .eq('id', ticketId);

  await notifyTicketOwner(sb, ticketId, TYPES.TICKET_REPLIED, 'Support Reply', 'An admin has replied to your support ticket');

  revalidatePath('/admin/tickets');
  revalidatePath('/dashboard/support');
  return { ok: true };
}

export async function closeTicket(ticketId, sendTranscript = true) {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client not configured.' };

  const { data: ticket } = await sb
    .from('support_tickets')
    .select('id, user_id, user_email, category, subject, description, screenshot_urls, status, created_at')
    .eq('id', ticketId)
    .single();

  if (!ticket) return { error: 'Ticket not found.' };

  const { data: replies } = await sb
    .from('ticket_replies')
    .select('sender_role, message, screenshot_urls, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  // Send transcript email only if requested
  if (sendTranscript) {
    try {
      const { sendTicketTranscript } = await import('@/lib/email');
      await sendTicketTranscript(ticket.user_email, ticket, replies || []);
    } catch (e) {
      console.error('[closeTicket] Transcript email failed:', e?.message);
    }
  }

  // Notify ticket owner
  try {
    const transcriptNote = sendTranscript ? ' A transcript was sent to your email.' : '';
    await sb.from('notifications').insert({
      user_id: ticket.user_id,
      type: TYPES.TICKET_CLOSED,
      title: 'Ticket Closed',
      message: `Your ticket "${ticket.subject}" has been closed.${transcriptNote}`,
      metadata: { link: '/dashboard/support' },
    });
  } catch (e) {
    console.error('[closeTicket] Notification failed:', e?.message);
  }

  await cleanupScreenshots(sb, collectScreenshotUrls(ticket, replies));

  const { error } = await sb
    .from('support_tickets')
    .delete()
    .eq('id', ticketId);

  if (error) return { error: error.message };

  revalidatePath('/admin/tickets');
  revalidatePath('/dashboard/support');
  return { ok: true };
}

export async function bulkDeleteTickets(ticketIds) {
  await requireAdmin();
  const sb = createAdminClient();
  if (!sb) return { error: 'Admin client not configured.' };

  if (!Array.isArray(ticketIds) || ticketIds.length === 0) return { error: 'No tickets selected.' };
  if (ticketIds.length > 50) return { error: 'Too many tickets selected (max 50).' };

  // Fetch tickets for screenshot cleanup
  const { data: tickets } = await sb
    .from('support_tickets')
    .select('id, screenshot_urls')
    .in('id', ticketIds);

  if (!tickets || tickets.length === 0) return { error: 'No tickets found.' };

  const ids = tickets.map((t) => t.id);

  // Fetch all replies for screenshot cleanup
  const { data: replies } = await sb
    .from('ticket_replies')
    .select('screenshot_urls')
    .in('ticket_id', ids);

  const allUrls = [];
  for (const t of tickets) {
    if (t.screenshot_urls && Array.isArray(t.screenshot_urls)) allUrls.push(...t.screenshot_urls);
  }
  for (const r of (replies || [])) {
    if (r.screenshot_urls && Array.isArray(r.screenshot_urls)) allUrls.push(...r.screenshot_urls);
  }
  await cleanupScreenshots(sb, allUrls);

  const { error } = await sb
    .from('support_tickets')
    .delete()
    .in('id', ids);

  if (error) return { error: error.message };

  revalidatePath('/admin/tickets');
  revalidatePath('/dashboard/support');
  return { ok: true, deleted: ids.length };
}
