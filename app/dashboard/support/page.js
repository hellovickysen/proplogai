import { createClient } from '@/lib/supabase/server';
import SupportPage from '@/components/support/SupportPage';

export const dynamic = 'force-dynamic';

export default async function SupportRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Auto-delete resolved tickets older than 7 days (no transcript)
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expired } = await supabase
      .from('support_tickets')
      .select('id, screenshot_urls')
      .eq('user_id', user.id)
      .eq('status', 'resolved')
      .lt('resolved_at', sevenDaysAgo);

    if (expired && expired.length > 0) {
      // Clean up screenshots
      const allUrls = [];
      for (const t of expired) {
        if (t.screenshot_urls && Array.isArray(t.screenshot_urls)) allUrls.push(...t.screenshot_urls);
      }
      // Also get reply screenshots
      const expiredIds = expired.map((t) => t.id);
      const { data: replies } = await supabase
        .from('ticket_replies')
        .select('screenshot_urls')
        .in('ticket_id', expiredIds);
      for (const r of (replies || [])) {
        if (r.screenshot_urls && Array.isArray(r.screenshot_urls)) allUrls.push(...r.screenshot_urls);
      }
      if (allUrls.length > 0) {
        const paths = allUrls
          .filter((u) => typeof u === 'string' && u.includes('/screenshots/'))
          .map((u) => { const idx = u.indexOf('/screenshots/'); return idx >= 0 ? u.slice(idx + '/screenshots/'.length) : null; })
          .filter(Boolean);
        if (paths.length > 0) await supabase.storage.from('screenshots').remove(paths);
      }
      // Delete expired tickets (CASCADE deletes replies)
      await supabase.from('support_tickets').delete().eq('user_id', user.id).in('id', expiredIds);
    }
  } catch (e) {
    console.error('[support] Auto-delete cleanup failed:', e?.message);
  }

  const { data: tickets, error: ticketsError } = await supabase
    .from('support_tickets')
    .select('id, category, subject, description, status, screenshot_urls, reply_count, ticket_number, resolved_at, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (ticketsError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Support</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Fetch replies for all tickets
  const ticketIds = (tickets || []).map((t) => t.id);
  let repliesByTicket = {};

  if (ticketIds.length > 0) {
    const { data: replies } = await supabase
      .from('ticket_replies')
      .select('id, ticket_id, sender_role, message, screenshot_urls, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true });

    if (replies) {
      for (const r of replies) {
        if (!repliesByTicket[r.ticket_id]) repliesByTicket[r.ticket_id] = [];
        repliesByTicket[r.ticket_id].push(r);
      }
    }
  }

  const ticketsWithReplies = (tickets || []).map((t) => ({
    ...t,
    replies: repliesByTicket[t.id] || [],
  }));

  return <SupportPage tickets={ticketsWithReplies} />;
}
