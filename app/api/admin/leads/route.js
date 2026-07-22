import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdmin } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Check admin auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Fetch leads
    const { data: leads } = await admin
      .from('tool_leads')
      .select('id, email, verified, converted, source, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    // Stats
    const { count: total } = await admin.from('tool_leads').select('*', { count: 'exact', head: true });
    const { count: verified } = await admin.from('tool_leads').select('*', { count: 'exact', head: true }).eq('verified', true);
    const { count: converted } = await admin.from('tool_leads').select('*', { count: 'exact', head: true }).eq('converted', true);

    return NextResponse.json({
      leads: leads || [],
      stats: { total: total || 0, verified: verified || 0, converted: converted || 0 },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
