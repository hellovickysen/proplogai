import { createClient } from '@/lib/supabase/server';
import SupportPage from '@/components/support/SupportPage';

export const dynamic = 'force-dynamic';

export default async function SupportRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tickets, error: ticketsError } = await supabase
    .from('support_tickets')
    .select('id, category, subject, description, status, screenshot_urls, reply_count, created_at, updated_at')
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

  // Attach replies to tickets
  const ticketsWithReplies = (tickets || []).map((t) => ({
    ...t,
    replies: repliesByTicket[t.id] || [],
  }));

  return <SupportPage tickets={ticketsWithReplies} />;
}
