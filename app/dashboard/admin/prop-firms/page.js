import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PropFirmAdmin from './PropFirmAdmin';
import LeadsTab from './LeadsTab';
import { getFirms, getLeadStats } from './actions';
import AdminTabs from './AdminTabs';

export const metadata = { title: 'Prop Firms & Leads Admin | PropLogAI' };

export default async function PropFirmsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard');

  const { firms } = await getFirms();
  const stats = await getLeadStats(user.email);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <AdminTabs
          firmsContent={<PropFirmAdmin initialFirms={firms || []} leadStats={stats} adminEmail={user.email} />}
          leadsContent={<LeadsTab adminEmail={user.email} />}
        />
      </div>
    </div>
  );
}
