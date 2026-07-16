import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTradeWithAI } from '@/lib/ai';
import { getUserAccess } from '@/lib/plans';
import { getUserTradeContext } from '@/lib/tradeContext';
import { notify, TYPES } from '@/lib/notifications';
import { rateLimit } from '@/lib/rateLimit';

// Burst protection: max 5 AI analysis calls per minute per user (all tiers)
const aiAnalysisLimiter = rateLimit({ windowMs: 60000, max: 5, name: 'ai-analysis' });

export async function POST(req) {
  let step = 'init';
  try {
    const { tradeId } = await req.json();
    if (!tradeId) return NextResponse.json({ error: 'Missing tradeId' }, { status: 400 });

    step = 'auth';
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    // Burst rate limit — prevent rapid-fire AI calls (all tiers including Elite/Admin)
    const { allowed: rateLimitOk } = await aiAnalysisLimiter.check(user.id);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    step = 'access';
    const access = await getUserAccess(supabase, user);
    if (!access.canUse('ai_analysis')) return NextResponse.json({ error: 'Requires Elite plan' }, { status: 403 });

    step = 'remaining';
    const { remaining } = await access.remaining('ai_analysis', supabase, user.id);
    if (remaining <= 0 && access.plan === 'basic' && !access.isBeta && !access.isAdmin) {
      return NextResponse.json({ error: 'Monthly limit reached' }, { status: 403 });
    }

    step = 'fetch-trade';
    const { data: trade, error: tErr } = await supabase.from('trades')
      .select('id, pair, direction, entry_price, exit_price, stop_loss, lot_size, pnl, setup, setup_id, setup_followed, no_setup_reason, timeframe, session, trade_date, opened_at, closed_at, created_at')
      .eq('id', tradeId).eq('user_id', user.id).maybeSingle();
    if (tErr) {
      console.error('[analyze-trade] Trade query failed:', tErr.message);
      return NextResponse.json({ error: 'Failed to load trade data' }, { status: 500 });
    }
    if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 });

    step = 'fetch-journal';
    const { data: journal, error: jErr } = await supabase.from('journal_entries')
      .select('id, trade_id, note, lesson, emotions, tags, confidence, screenshot_url, screenshot_urls, created_at')
      .eq('trade_id', tradeId).eq('user_id', user.id).maybeSingle();
    if (jErr) {
      console.error('[analyze-trade] Journal query failed:', jErr.message);
      return NextResponse.json({ error: 'Failed to load journal data' }, { status: 500 });
    }

    step = 'context';
    const depth = access.effectivePlan === 'elite' ? 90 : 30;
    const context = await getUserTradeContext(supabase, user.id, { depth });

    step = 'ai-call';
    let analysis;
    try {
      analysis = await analyzeTradeWithAI(trade, journal, context);
    } catch (aiErr) {
      console.error('[analyze-trade] AI call failed:', aiErr.message || aiErr);
      return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
    }

    step = 'save';
    const row = {
      user_id: user.id,
      trade_id: tradeId,
      type: 'trade_analysis',
      summary: analysis.summary || null,
      mistakes: analysis,
      severity: Number.isFinite(Number(analysis.execution_score)) ? Math.round(Number(analysis.execution_score)) : null,
    };

    const { data: existing } = await supabase.from('ai_insights')
      .select('id').eq('trade_id', tradeId).eq('type', 'trade_analysis').eq('user_id', user.id).maybeSingle();

    let dbErr;
    if (existing) {
      const r = await supabase.from('ai_insights').update(row).eq('id', existing.id).eq('user_id', user.id);
      dbErr = r.error;
    } else {
      const r = await supabase.from('ai_insights').insert(row);
      dbErr = r.error;
    }
    if (dbErr) {
      console.error('[analyze-trade] DB save failed:', dbErr.message);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    step = 'notify';
    try {
      await notify(supabase, user.id, TYPES.AI_ANALYSIS, 'AI Analysis Complete',
        trade.pair + ' — Grade: ' + (analysis.grade || ''), { link: '/dashboard/trades/' + tradeId });
    } catch (e) { /* non-critical */ }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[analyze-trade] Unexpected error at step:', step, e.message || e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
