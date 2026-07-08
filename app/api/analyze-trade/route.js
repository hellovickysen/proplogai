import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTradeWithAI } from '@/lib/ai';
import { getUserAccess } from '@/lib/plans';
import { getUserTradeContext } from '@/lib/tradeContext';
import { notify, TYPES } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';

export async function POST(req) {
  try {
    const { tradeId } = await req.json();
    if (!tradeId) {
      return NextResponse.json({ error: 'Missing tradeId' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    }

    // Plan-based limit check
    const access = await getUserAccess(supabase, user);
    if (!access.canUse('ai_analysis')) {
      return NextResponse.json({ error: 'AI trade analysis requires the Elite plan.' }, { status: 403 });
    }
    const { remaining } = await access.remaining('ai_analysis', supabase, user.id);
    if (remaining <= 0 && access.plan === 'basic' && !access.isBeta && !access.isAdmin) {
      return NextResponse.json({ error: "You've used all AI analyses this month. Upgrade to Elite for more." }, { status: 403 });
    }

    // Fetch trade
    const { data: trade } = await supabase.from('trades').select('*').eq('id', tradeId).eq('user_id', user.id).maybeSingle();
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found.' }, { status: 404 });
    }

    // Fetch journal
    const { data: journal } = await supabase.from('journal_entries').select('*').eq('trade_id', tradeId).eq('user_id', user.id).maybeSingle();

    // Build context
    const depth = access.effectivePlan === 'elite' ? 90 : 30;
    const context = await getUserTradeContext(supabase, user.id, { depth });

    // Run AI analysis
    let analysis;
    try {
      analysis = await analyzeTradeWithAI(trade, journal, context);
    } catch (e) {
      return NextResponse.json({ error: (e && e.message) || 'AI analysis failed.' }, { status: 500 });
    }

    // Save to DB
    const row = {
      user_id: user.id,
      trade_id: tradeId,
      type: 'trade_analysis',
      summary: analysis.summary || null,
      mistakes: analysis,
      severity: Number.isFinite(Number(analysis.execution_score)) ? Math.round(Number(analysis.execution_score)) : null,
    };

    const { data: existing } = await supabase
      .from('ai_insights')
      .select('id')
      .eq('trade_id', tradeId)
      .eq('type', 'trade_analysis')
      .eq('user_id', user.id)
      .maybeSingle();

    let dbError;
    if (existing) {
      const res = await supabase.from('ai_insights').update(row).eq('id', existing.id).eq('user_id', user.id);
      dbError = res.error;
    } else {
      const res = await supabase.from('ai_insights').insert(row);
      dbError = res.error;
    }
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Notification
    const grade = analysis.grade || '';
    await notify(supabase, user.id, TYPES.AI_ANALYSIS, 'AI Analysis Complete', `${trade.pair} — Grade: ${grade}`, { link: '/dashboard/trades/' + tradeId });

    try { revalidatePath('/dashboard/trades/' + tradeId); } catch (e) {}

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('analyze-trade API error:', e);
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
  }
}
