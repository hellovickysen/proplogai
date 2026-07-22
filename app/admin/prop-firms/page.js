import { createClient } from '@/lib/supabase/server';
import PropFirmAdmin from '@/app/dashboard/admin/prop-firms/PropFirmAdmin';
import { getFirms, getLeadStats } from '@/app/dashboard/admin/prop-firms/actions';

export const metadata = { title: 'Prop Firms | Admin | PropLogAI' };

export default async function AdminPropFirmsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { firms } = await getFirms();
  const stats = await getLeadStats(user?.email);

  return <PropFirmAdmin initialFirms={firms || []} leadStats={stats} adminEmail={user?.email} />;
}
