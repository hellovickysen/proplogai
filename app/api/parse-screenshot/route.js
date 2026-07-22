import { NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function model() {
  return process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
}

/* ── Rate limiter (sliding window, in-memory) ──────────────── */

const windowMs = 60 * 60 * 1000; // 1 hour
const maxReqs = 10;
const hits = new Map(); // ip -> [timestamps]

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxReqs) return true;
  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}

/* ── Prompt ─────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a trading statement parser. You receive screenshots of MT4/MT5 mobile trading history.

Extract EVERY visible closed trade and return them as a JSON array.

Each trade in the MT5 mobile format looks like:
Line 1: SYMBOL, direction lotSize           DATE
Line 2: entryPrice → exitPrice             profit

Example:
XAUUSD.x, sell 0.01          2026.07.17 15:43:04
3 992.27 → 3 968.84                         23.43

For each trade, extract:
- symbol: the trading instrument (e.g., "XAUUSD", "BTCUSD") — remove broker suffixes like ".x"
- direction: "buy" or "sell"
- lotSize: the lot size as a number
- date: the close date in ISO format
- entry: the entry price as a number (first price, before the arrow)
- exit: the exit price as a number (second price, after the arrow)
- profit: the profit/loss as a number (negative for losses)

IMPORTANT:
- Prices may have spaces as thousands separators (e.g., "3 992.27" = 3992.27). Remove spaces.
- Include ALL visible trades, even partially visible ones at the top or bottom if you can read enough data.
- If a trade is too cut off to read, skip it.
- Return ONLY the JSON array. No markdown, no commentary.

Example output:
[
  {"symbol":"XAUUSD","direction":"sell","lotSize":0.01,"date":"2026-07-17T15:43:04.000Z","entry":3992.27,"exit":3968.84,"profit":23.43},
  {"symbol":"XAUUSD","direction":"buy","lotSize":0.01,"date":"2026-07-17T08:06:24.000Z","entry":3989.80,"exit":3979.10,"profit":-10.70}
]`;

/* ── API Handler ───────────────────────────────────────────── */

export async function POST(request) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 10 screenshot analyses per hour.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { images } = body; // array of base64 data URLs

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided.' }, { status: 400 });
    }

    if (images.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 screenshots per analysis.' }, { status: 400 });
    }

    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'AI is not configured.' }, { status: 500 });
    }

    // Build message content with all images
    const content = [];
    images.forEach((img, i) => {
      content.push({
        type: 'image_url',
        image_url: { url: img },
      });
    });
    content.push({
      type: 'text',
      text: images.length > 1
        ? `Extract ALL trades from these ${images.length} screenshots. Combine them into a single JSON array. Remove duplicates if the same trade appears in multiple screenshots.`
        : 'Extract all trades from this MT4/MT5 mobile trading history screenshot.',
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        'X-Title': 'PropLogAI',
      },
      body: JSON.stringify({
        model: model(),
        temperature: 0.1,
        max_tokens: 4000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const t = await res.text();
      console.error('[parse-screenshot] OpenRouter error:', res.status, t.slice(0, 300));
      return NextResponse.json({ error: 'AI request failed. Please try again.' }, { status: 502 });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'AI returned no content.' }, { status: 502 });
    }

    // Parse JSON from response
    const trades = extractJson(raw);
    if (!trades || !Array.isArray(trades)) {
      console.error('[parse-screenshot] Failed to parse AI response:', raw.slice(0, 500));
      return NextResponse.json({ error: 'Could not parse trades from screenshot. Please try a clearer image.' }, { status: 422 });
    }

    // Normalize trades
    const normalized = trades
      .filter((t) => t.symbol && t.direction && t.profit !== undefined)
      .map((t, i) => ({
        id: String(i + 1),
        date: t.date || new Date().toISOString(),
        openDate: null,
        closeDate: t.date || null,
        symbol: String(t.symbol).replace(/\.x$/i, '').trim(),
        direction: String(t.direction).toLowerCase(),
        entry: Number(t.entry) || 0,
        exit: Number(t.exit) || 0,
        stopLoss: 0,
        takeProfit: 0,
        lotSize: Number(t.lotSize) || 0.01,
        profit: Number(t.profit) || 0,
        commission: 0,
        swap: 0,
        netProfit: Number(t.profit) || 0,
        duration: 0,
      }));

    return NextResponse.json({
      trades: normalized,
      tradeCount: normalized.length,
      broker: 'MT5 Mobile (Screenshot)',
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out. Please try again.' }, { status: 504 });
    }
    console.error('[parse-screenshot] Error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error.' }, { status: 500 });
  }
}

/* ── JSON extractor ────────────────────────────────────────── */

function extractJson(text) {
  if (!text) return null;
  let clean = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(clean); } catch {}
  const a = clean.indexOf('[');
  const b = clean.lastIndexOf(']');
  if (a >= 0 && b > a) {
    try { return JSON.parse(clean.slice(a, b + 1)); } catch {}
  }
  return null;
}
