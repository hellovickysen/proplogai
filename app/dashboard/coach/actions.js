"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeCoachReport } from '@/lib/ai';
import { sendEmail, buildCoachReportEmail, isEmailConfigured } from '@/lib/email';
import { computeStats } from '@/lib/stats';
import { notify, TYPES } from '@/lib/notifications';
import { getUserAccess } from '@/lib/plans';
import { getUserTradeContext } from '@/lib/tradeContext';

/** Rate limiter: max 5 coach reports per hour per user (burst protection) */
const coachRateLimit = new Map();
function checkCoachRate(userId) {
  const now = Date.now();
  const entry = coachRateLimit.get(userId);
  if (!entry || now - entry.start > 60 * 60 * 1000) {
    coachRateLimit.set(userId, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function generateCoachReport() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };
  if (!checkCoachRate(user.id)) return { error: 'Rate limit reached. You can generate up to 5 reports per hour.' };

  // Plan-based limit check
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('coach_report')) return { error: 'Propol AI reviews require the Elite plan.' };
  const { remaining } = await access.remaining('coach_report', supabase, user.id);
  if (remaining <= 0 && access.plan === 'basic' && !access.isBeta && !access.isAdmin) {
    return { error: 'You\'ve used your monthly Propol review. Upgrade to Elite for weekly reviews.' };
  }

  // Determine trade depth based on plan
  const depth = access.effectivePlan === 'elite' ? 90 : 30;

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(depth);
  const list = trades || [];
  if (list.length < 5) {
    return { error: 'Log at least 5 trades first so Propol has enough patterns to analyze.' };
  }

  const ids = list.map((t) => t.id);
  const { data: journals } = await supabase.from('journal_entries').select('*').in('trade_id', ids);
  const jmap = {};
  (journals || []).forEach((j) => {
    jmap[j.trade_id] = j;
  });

  // Build user context for personalized analysis
  const context = await getUserTradeContext(supabase, user.id, { depth });

  let report;
  try {
    report = await analyzeCoachReport(list, jmap, context);
  } catch (e) {
    return { error: (e && e.message) || 'AI report failed.' };
  }

  // Always INSERT new reports (keep history for progress tracking)
  const row = {
    user_id: user.id,
    trade_id: null,
    type: 'coach_report',
    summary: report.headline || null,
    mistakes: report,
    severity: list.length,
  };

  const { error } = await supabase.from('ai_insights').insert(row);
  if (error) return { error: error.message };

  // ── Notification ──
  await notify(supabase, user.id, TYPES.AI_COACH_REPORT, 'Propol Review Ready', report.headline || 'Your AI coaching review is ready', { link: '/dashboard/coach' });

  revalidatePath('/dashboard/coach');
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Send the latest coach report to the user's email */
export async function sendCoachReportEmail() {
  if (!isEmailConfigured()) {
    return { error: 'Email is not configured yet.' };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  // Plan check — email reports are Elite-only
  const access = await getUserAccess(supabase, user);
  if (!access.canUse('email_coach')) return { error: 'Email coach reports require the Elite plan.' };

  // Fetch the latest coach report
  const { data: insight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!insight || !insight.mistakes) {
    return { error: 'No Propol review found. Generate one first.' };
  }

  // Fetch trade stats for the email
  const { data: trades } = await supabase
    .from('trades')
    .select('pnl')
    .eq('user_id', user.id)
    .limit(50);
  const list = trades || [];
  const s = computeStats(list);

  const report = insight.mistakes;
  const html = buildCoachReportEmail(report, {
    trades: s.n,
    winRate: s.winRate.toFixed(0),
    net: s.net,
  });

  const result = await sendEmail({
    to: user.email,
    subject: '✦ Your Propol AI Coach Review',
    html,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true };
}
