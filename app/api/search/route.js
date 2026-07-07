import { createClient } from '@/lib/supabase/server';
import { searchAll } from '@/lib/search';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const filter = searchParams.get('filter') || 'all';

    if (!query) {
      return NextResponse.json({ grouped: {}, total: 0 });
    }

    // Parse any structured filters from query params
    const filters = {};
    if (searchParams.get('pair')) filters.pair = searchParams.get('pair');
    if (searchParams.get('direction')) filters.direction = searchParams.get('direction');
    if (searchParams.get('session')) filters.session = searchParams.get('session');
    if (searchParams.get('pnl_direction')) filters.pnl_direction = searchParams.get('pnl_direction');
    if (searchParams.get('emotion')) filters.emotion = searchParams.get('emotion');
    if (searchParams.get('date_from')) filters.date_from = searchParams.get('date_from');
    if (searchParams.get('date_to')) filters.date_to = searchParams.get('date_to');
    if (searchParams.get('setup')) filters.setup = searchParams.get('setup');

    const startTime = Date.now();
    const result = await searchAll(supabase, user.id, query, filters, filter);
    const elapsed = Date.now() - startTime;

    return NextResponse.json({ ...result, elapsed });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
