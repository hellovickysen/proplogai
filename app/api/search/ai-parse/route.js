import { createClient } from '@/lib/supabase/server';
import { getUserAccess } from '@/lib/plans';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function model() {
  return process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
}

const PARSE_SYSTEM = `You convert natural language trading queries into structured search filters.
Return ONLY a valid JSON object with these possible keys (omit keys that don't apply):
- pair: trading pair/instrument (e.g. "XAUUSD", "EURUSD")
- direction: "long" or "short"
- pnl_direction: "positive" or "negative"
- emotion: single emotion keyword (e.g. "FOMO", "Fear", "Greedy", "Confident", "Calm")
- session: trading session (e.g. "London", "New York", "Asian", "Sydney")
- setup: setup name (e.g. "Breakout", "Pullback", "Reversal")
- date_from: ISO date string (YYYY-MM-DD)
- date_to: ISO date string (YYYY-MM-DD)
- keyword: fallback text search term if the query doesn't map to structured filters

Today's date is ${new Date().toISOString().split('T')[0]}.
"this month" = first day of current month to today.
"this week" = last Monday to today.
"today" = today's date for both from and to.
NO markdown fences. Just the JSON object.`;

/**
 * AI-powered natural language query parser for Elite users.
 * Converts queries like "my losing FOMO trades this month" into structured filters.
 */
export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Elite access
    const access = await getUserAccess(supabase, user);
    if (!access.isElite && !access.isAdmin && !access.isBeta) {
      return NextResponse.json({ error: 'Elite feature', upgrade: true }, { status: 403 });
    }

    const { query } = await request.json();
    if (!query || query.trim().length < 3) {
      return NextResponse.json({ filters: {}, isAI: false });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ filters: {}, isAI: false });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://proplogai.com',
        'X-Title': 'PropLogAI Search',
      },
      body: JSON.stringify({
        model: model(),
        messages: [
          { role: 'system', content: PARSE_SYSTEM },
          { role: 'user', content: query.trim() },
        ],
        max_tokens: 200,
        temperature: 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error('AI parse error:', res.status);
      return NextResponse.json({ filters: {}, isAI: false });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';

    // Parse JSON — strip code fences if present
    let filters = {};
    try {
      const cleaned = raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
      filters = JSON.parse(cleaned);
    } catch (e) {
      console.error('AI parse JSON error:', e.message, 'raw:', raw.substring(0, 200));
      return NextResponse.json({ filters: {}, isAI: false });
    }

    return NextResponse.json({ filters, isAI: true });
  } catch (err) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ filters: {}, isAI: false, timeout: true });
    }
    console.error('AI parse error:', err);
    return NextResponse.json({ filters: {}, isAI: false });
  }
}
