import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import AdminTickets from '@/components/admin/AdminTickets';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  if (!isAdminConfigured()) {
    return <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-8 text-center"><p className="text-sm text-white/55">Service role key required.</p></div>;
  }

  const sb = createAdminClient();
  if (!sb) return null;

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

  // Attach replies to tickets
  const ticketsWithReplies = (tickets || []).map((t) => ({
    ...t,
    replies: repliesByTicket[t.id] || [],
  }));

  return <AdminTickets tickets={ticketsWithReplies} />;
}
