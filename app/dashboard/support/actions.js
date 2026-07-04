"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyAdmin, TYPES } from '@/lib/notifications';

function sanitize(str, maxLen) {
  if (!str) return null;
  return String(str).slice(0, maxLen).replace(/<[^>]*>/g, '').trim();
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

  // Handle screenshot URLs array (max 5)
  let screenshotUrls = [];
  if (Array.isArray(payload.screenshot_urls)) {
    screenshotUrls = payload.screenshot_urls
      .filter((u) => typeof u === 'string' && u.startsWith('https://'))
      .slice(0, 5);
  }

  // Create ticket
  const { data: ticket, error } = await supabase.from('support_tickets').insert({
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

  // Notify admin about new ticket
  await notifyAdmin(TYPES.NEW_TICKET, 'New Support Ticket', `${category}: ${subject}`, { email: user.email });

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

  // Verify ticket ownership
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, subject, status, reply_count')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (!ticket) return { error: 'Ticket not found.' };
  if (ticket.status === 'closed') return { error: 'This ticket is closed.' };

  // Sanitize screenshot URLs
  let urls = [];
  if (Array.isArray(screenshotUrls)) {
    urls = screenshotUrls.filter((u) => typeof u === 'string' && u.startsWith('https://')).slice(0, 5);
  }

  // Insert reply
  const { error } = await supabase.from('ticket_replies').insert({
    ticket_id: ticketId,
    user_id: user.id,
    sender_role: 'user',
    message: msg,
    screenshot_urls: urls,
  });

  if (error) return { error: error.message };

  // Update ticket timestamp and reply count
  await supabase
    .from('support_tickets')
    .update({
      updated_at: new Date().toISOString(),
      reply_count: (ticket.reply_count || 0) + 1,
    })
    .eq('id', ticketId)
    .eq('user_id', user.id);

  // Notify admin about user reply
  await notifyAdmin(TYPES.TICKET_USER_REPLIED, 'New Reply on Ticket', `User replied: ${ticket.subject}`, { ticketId });

  revalidatePath('/dashboard/support');
  return { ok: true };
}

export async function closeTicket(ticketId) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  // Verify ticket ownership and fetch full data for transcript
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, user_email, category, subject, description, screenshot_urls, status, created_at')
    .eq('id', ticketId)
    .eq('user_id', user.id)
    .single();

  if (!ticket) return { error: 'Ticket not found.' };

  // Fetch all replies for transcript
  const { data: replies } = await supabase
    .from('ticket_replies')
    .select('sender_role, message, screenshot_urls, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  // Send transcript email
  try {
    const { sendTicketTranscript } = await import('@/lib/email');
    await sendTicketTranscript(ticket.user_email || user.email, ticket, replies || []);
  } catch (e) {
    console.error('[closeTicket] Transcript email failed:', e?.message);
    // Don't block close if email fails
  }

  // Clean up screenshots from storage
  try {
    const allUrls = [];
    if (ticket.screenshot_urls) allUrls.push(...ticket.screenshot_urls);
    for (const r of (replies || [])) {
      if (r.screenshot_urls && Array.isArray(r.screenshot_urls)) allUrls.push(...r.screenshot_urls);
    }
    if (allUrls.length > 0) {
      const paths = allUrls
        .filter((u) => typeof u === 'string' && u.includes('/screenshots/'))
        .map((u) => {
          const idx = u.indexOf('/screenshots/');
          return idx >= 0 ? u.slice(idx + '/screenshots/'.length) : null;
        })
        .filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from('screenshots').remove(paths);
      }
    }
  } catch (e) {
    console.error('[closeTicket] Screenshot cleanup failed:', e?.message);
  }

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
