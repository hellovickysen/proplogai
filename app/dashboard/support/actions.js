"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyAdmin, TYPES } from '@/lib/notifications';
import { ADMIN_EMAIL } from '@/lib/supabase/admin';

function sanitize(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '').trim();
}

/** Remove screenshot files from Supabase Storage */
async function cleanupScreenshots(supabase, urls) {
  try {
    const paths = (urls || [])
      .filter((u) => typeof u === 'string' && u.includes('/screenshots/'))
      .map((u) => {
        const idx = u.indexOf('/screenshots/');
        return idx >= 0 ? u.slice(idx + '/screenshots/'.length) : null;
      })
      .filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from('screenshots').remove(paths);
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

export async function createTicket(payload) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const subject = sanitize(payload.subject, 200);
  if (!subject) return { error: 'Subject is required.' };

  const description = sanitize(payload.description, 5000);
  if (!description) return { error: 'Description is required.' };

  const validCategories = ['bug', 'platform_issue', 'feature_request', 'general_support', 'account_billing'];
  const category = validCategories.includes(payload.category) ? payload.category : 'general_support';

  let screenshotUrls = [];
  if (Array.isArray(payload.screenshot_urls)) {
    screenshotUrls = payload.screenshot_urls
      .filter((u) => typeof u === 'string' && u.startsWith('https://'))
      .slice(0, 5);
  }

  const { error } = await supabase.from('support_tickets').insert({
    user_id: user.id,
    user_email: user.email,
    category,
    subject,
    description,
    screenshot_url: screenshotUrls[0] || null,
    screenshot_urls: screenshotUrls,
    status: 'open',
    reply_count: 0,
  }).select('id').single();

  if (error) return { error: error.message };

  // Skip admin notification if user IS the admin (avoids duplicate)
  if (user.email !== ADMIN_EMAIL) {
    await notifyAdmin(TYPES.NEW_TICKET, 'New Support Ticket', `${category}: ${subject}`, { email: user.email });
  }

  revalidatePath('/dashboard/support');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function replyToTicket(ticketId, message, screenshotUrls = []) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const msg = sanitize(message, 5000);
  if (!msg) return { error: 'Message cannot be empty.' };

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, subject, status, reply_count')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (!ticket) return { error: 'Ticket not found.' };
  if (ticket.status === 'closed') return { error: 'This ticket is closed.' };

  let urls = [];
  if (Array.isArray(screenshotUrls)) {
    urls = screenshotUrls.filter((u) => typeof u === 'string' && u.startsWith('https://')).slice(0, 5);
  }

  const { error } = await supabase.from('ticket_replies').insert({
    ticket_id: ticketId,
    user_id: user.id,
    sender_role: 'user',
    message: msg,
    screenshot_urls: urls,
  });

  if (error) return { error: error.message };

  await supabase
    .from('support_tickets')
    .update({
      updated_at: new Date().toISOString(),
      reply_count: (ticket.reply_count || 0) + 1,
    })
    .eq('id', ticketId)
    .eq('user_id', user.id);

  // Skip admin notification if user IS the admin (avoids duplicate)
  if (user.email !== ADMIN_EMAIL) {
    await notifyAdmin(TYPES.TICKET_USER_REPLIED, 'New Reply on Ticket', `User replied: ${ticket.subject}`, { ticketId });
  }

  revalidatePath('/dashboard/support');
  return { ok: true };
}

export async function closeTicket(ticketId, sendTranscript = true) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, user_email, category, subject, description, screenshot_urls, status, created_at')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (!ticket) return { error: 'Ticket not found.' };

  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('sender_role, message, screenshot_urls, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  // Send transcript email only if requested
  if (sendTranscript) {
    try {
      const { sendTicketTranscript } = await import('@/lib/email');
      await sendTicketTranscript(ticket.user_email || user.email, ticket, replies || []);
    } catch (e) {
      console.error('[closeTicket] Transcript email failed:', e?.message);
    }
  }

  // Clean up screenshots
  await cleanupScreenshots(supabase, collectScreenshotUrls(ticket, replies));

  // Delete ticket (CASCADE deletes replies)
  const { error } = await supabase
    .from('support_tickets')
    .delete()
    .eq('id', ticketId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/support');
  return { ok: true };
}

export async function bulkDeleteTickets(ticketIds) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  if (!Array.isArray(ticketIds) || ticketIds.length === 0) return { error: 'No tickets selected.' };
  if (ticketIds.length > 50) return { error: 'Too many tickets selected (max 50).' };

  // Fetch all tickets to verify ownership and get screenshot URLs
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('id, screenshot_urls')
    .eq('user_id', user.id)
    .in('id', ticketIds);

  if (!tickets || tickets.length === 0) return { error: 'No tickets found.' };

  const ownedIds = tickets.map((t) => t.id);

  // Fetch all replies for screenshot cleanup
  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('screenshot_urls')
    .in('ticket_id', ownedIds);

  // Collect and clean up all screenshots
  const allUrls = [];
  for (const t of tickets) {
    if (t.screenshot_urls && Array.isArray(t.screenshot_urls)) allUrls.push(...t.screenshot_urls);
  }
  for (const r of (replies || [])) {
    if (r.screenshot_urls && Array.isArray(r.screenshot_urls)) allUrls.push(...r.screenshot_urls);
  }
  await cleanupScreenshots(supabase, allUrls);

  // Delete all tickets (CASCADE deletes replies)
  const { error } = await supabase
    .from('support_tickets')
    .delete()
    .eq('user_id', user.id)
    .in('id', ownedIds);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/support');
  return { ok: true, deleted: ownedIds.length };
}
