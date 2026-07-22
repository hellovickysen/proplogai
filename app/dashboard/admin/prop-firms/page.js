import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PropFirmAdmin from './PropFirmAdmin';
import { getFirms, getLeadStats } from './actions';

export const metadata = { title: 'Prop Firms Admin | PropLogAI' };

export default async function PropFirmsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard');

  const { firms } = await getFirms();
  const stats = await getLeadStats(user.email);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <PropFirmAdmin initialFirms={firms || []} leadStats={stats} adminEmail={user.email} />
      </div>
    </div>
  );
}
