import { NextResponse } from 'next/server';
import { analyzeTrade } from '@/app/dashboard/trades/actions';

export async function POST(req) {
  try {
    const { tradeId } = await req.json();
    if (!tradeId) {
      return NextResponse.json({ error: 'Missing tradeId' }, { status: 400 });
    }
    const result = await analyzeTrade(tradeId);
    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('analyze-trade API error:', e);
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
  }
}
