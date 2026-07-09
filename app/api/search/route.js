import { createClient } from '@/lib/supabase/server';
import { searchAll } from '@/lib/search';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allowed filter values for validation
const VALID_DIRECTIONS = ['long', 'short'];
const VALID_PNL_DIRECTIONS = ['positive', 'negative'];
const VALID_FILTERS = ['all', 'trades', 'journal', 'coach', 'setups', 'expenses', 'trophies'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUERY_LENGTH = 200;
const MAX_PARAM_LENGTH = 100;

/** Sanitize a string param: trim, limit length, strip control chars */
function sanitizeParam(val, maxLen = MAX_PARAM_LENGTH) {
  if (!val || typeof val !== 'string') return null;
  return val.trim().replace(/[\x00-\x1f\x7f]/g, '').slice(0, maxLen) || null;
}

export async function GET(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = sanitizeParam(searchParams.get('q'), MAX_QUERY_LENGTH);
    const filter = sanitizeParam(searchParams.get('filter')) || 'all';

    if (!query) {
      return NextResponse.json({ grouped: {}, total: 0 });
    }

    // Validate filter type
    if (!VALID_FILTERS.includes(filter)) {
      return NextResponse.json({ grouped: {}, total: 0 });
    }

    // Parse and validate structured filters from query params
    const filters = {};

    const pair = sanitizeParam(searchParams.get('pair'));
    if (pair) filters.pair = pair;

    const direction = sanitizeParam(searchParams.get('direction'));
    if (direction && VALID_DIRECTIONS.includes(direction.toLowerCase())) {
      filters.direction = direction.toLowerCase();
    }

    const session = sanitizeParam(searchParams.get('session'));
    if (session) filters.session = session;

    const pnlDir = sanitizeParam(searchParams.get('pnl_direction'));
    if (pnlDir && VALID_PNL_DIRECTIONS.includes(pnlDir.toLowerCase())) {
      filters.pnl_direction = pnlDir.toLowerCase();
    }

    const emotion = sanitizeParam(searchParams.get('emotion'));
    if (emotion) filters.emotion = emotion;

    const setup = sanitizeParam(searchParams.get('setup'));
    if (setup) filters.setup = setup;

    // Validate date formats (YYYY-MM-DD)
    const dateFrom = sanitizeParam(searchParams.get('date_from'));
    if (dateFrom && DATE_REGEX.test(dateFrom) && !isNaN(Date.parse(dateFrom))) {
      filters.date_from = dateFrom;
    }

    const dateTo = sanitizeParam(searchParams.get('date_to'));
    if (dateTo && DATE_REGEX.test(dateTo) && !isNaN(Date.parse(dateTo))) {
      filters.date_to = dateTo;
    }

    const startTime = Date.now();
    const result = await searchAll(supabase, user.id, query, filters, filter);
    const elapsed = Date.now() - startTime;

    return NextResponse.json({ ...result, elapsed });
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
