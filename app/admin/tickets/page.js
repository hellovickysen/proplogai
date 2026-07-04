import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import AdminTickets from '@/components/admin/AdminTickets';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  if (!isAdminConfigured()) {
    return <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-8 text-center"><p className="text-sm text-white/55">Service role key required.</p></div>;
  }

  const sb = createAdminClient();
  if (!sb) return null;

  // Auto-delete resolved tickets older than 7 days (no transcript)
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: expired } = await sb
      .from('support_tickets')
      .select('id, screenshot_urls')
      .eq('status', 'resolved')
      .lt('resolved_at', sevenDaysAgo);

    if (expired && expired.length > 0) {
      const allUrls = [];
      for (const t of expired) {
        if (t.screenshot_urls && Array.isArray(t.screenshot_urls)) allUrls.push(...t.screenshot_urls);
      }
      const expiredIds = expired.map((t) => t.id);
      const { data: replies } = await sb
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
        if (paths.length > 0) await sb.storage.from('screenshots').remove(paths);
      }
      await sb.from('support_tickets').delete().in('id', expiredIds);
    }
  } catch (e) {
    console.error('[admin/tickets] Auto-delete cleanup failed:', e?.message);
  }

  const { data: tickets } = await sb
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false });

  // Fetch replies for all tickets
  const ticketIds = (tickets || []).map((t) => t.id);
  let repliesByTicket = {};

  if (ticketIds.length > 0) {
    const { data: replies } = await sb
      .from('ticket_replies')
      .select('id, ticket_id, user_id, sender_role, message, screenshot_urls, created_at')
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

  return <AdminTickets tickets={ticketsWithReplies} />;
}
