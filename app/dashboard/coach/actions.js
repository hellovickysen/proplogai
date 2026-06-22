"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeCoachReport } from '@/lib/ai';

export async function generateCoachReport() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  const list = trades || [];
  if (list.length < 2) {
    return { error: 'Log at least 2 trades first so the coach has patterns to analyze.' };
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
