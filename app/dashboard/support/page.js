import { createClient } from '@/lib/supabase/server';
import SupportPage from '@/components/support/SupportPage';

export const dynamic = 'force-dynamic';

export default async function SupportRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tickets, error: ticketsError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (ticketsError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Feedback</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return <SupportPage tickets={tickets || []} />;
}
