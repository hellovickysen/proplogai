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
    screenshotUrls = payload.screenshot_urls.filter((u) => typeof u === 'string' && u.startsWith('http')).slice(0, 5);
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
  });

  if (error) return { error: error.message };

  // ── Notify admin about new ticket ──
  await notifyAdmin(TYPES.NEW_TICKET, 'New Support Ticket', `${category}: ${subject}`, { email: user.email });

  revalidatePath('/dashboard/support');
  return { ok: true };
}
