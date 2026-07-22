import { createClient } from '@/lib/supabase/server';
import LeadsTab from '@/app/dashboard/admin/prop-firms/LeadsTab';

export const metadata = { title: 'Lead Gen | Admin | PropLogAI' };

export default async function AdminLeadGenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <LeadsTab adminEmail={user?.email} />;
}
