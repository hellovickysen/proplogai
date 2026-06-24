"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeCoachReport } from '@/lib/ai';
import { sendEmail, buildCoachReportEmail, isEmailConfigured } from '@/lib/email';
import { computeStats } from '@/lib/stats';

/** Rate limiter: max 5 coach reports per hour per user */
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

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const list = trades || [];
  if (list.length < 5) {
    return { error: 'Log at least 5 trades first so the coach has enough patterns to analyze.' };
  }

  const ids = list.map((t) => t.id);
  const { data: journals } = await supabase.from('journal_entries').select('*').in('trade_id', ids);
  const jmap = {};
  (journals || []).forEach((j) => {
    jmap[j.trade_id] = j;
  });

  let report;
  try {
    report = await analyzeCoachReport(list, jmap);
  } catch (e) {
    return { error: (e && e.message) || 'AI report failed.' };
  }

  const row = {
    user_id: user.id,
    trade_id: null,
    type: 'coach_report',
    summary: report.headline || null,
    mistakes: report,
    severity: list.length,
  };

  const { data: existing } = await supabase
    .from('ai_insights')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .limit(1)
    .maybeSingle();

  let error;
  if (existing) {
    const res = await supabase.from('ai_insights').update(row).eq('id', existing.id);
    error = res.error;
  } else {
    const res = await supabase.from('ai_insights').insert(row);
    error = res.error;
  }
  if (error) return { error: error.message };

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
    return { error: 'No coach report found. Generate one first.' };
  }

  // Fetch trade stats for the email
  const { data: trades } = await supabase
    .from('trades')
    .select('pnl, r_multiple')
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
    subject: '✦ Your PropLogAI Coach Report',
    html,
  });

  if (!result.ok) return { error: result.error };
  return { ok: true };
}
