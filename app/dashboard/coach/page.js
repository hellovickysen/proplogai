import { createClient } from '@/lib/supabase/server';
import PropolCoachHub from '@/components/coach/PropolCoachHub';
import { isEmailConfigured } from '@/lib/email';
import { getUserAccess } from '@/lib/plans';
import { computePersona, computeStreaks, checkAutoHabits } from '@/lib/persona';
import { getTradingDate } from '@/lib/stats';
import BetaFeatureWarning from '@/components/ui/BetaFeatureWarning';
import UpgradeCard from '@/components/ui/UpgradeCard';

export const dynamic = 'force-dynamic';

export default async function CoachPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Trade count
  const { count: tradeCount, error: countError } = await supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">Propol AI Coach</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  // Fetch ALL coach reports (for history, scores over time)
  const { data: coachReports } = await supabase
    .from('ai_insights')
    .select('id, summary, mistakes, severity, created_at')
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .order('created_at', { ascending: false })
    .limit(12);

  // Fetch trade analyses (for Trade Analysis tab)
  const { data: tradeAnalyses } = await supabase
    .from('ai_insights')
    .select('id, trade_id, summary, mistakes, severity, created_at')
    .eq('user_id', user.id)
    .eq('type', 'trade_analysis')
    .order('created_at', { ascending: false })
    .limit(50);

  // Usage counts this month
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const { count: coachUsed } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .gte('created_at', monthStart.toISOString());

  const { count: analysisUsed } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'trade_analysis')
    .gte('created_at', monthStart.toISOString());

  // ── Persona + Streaks ──
  const { data: allTrades } = await supabase
    .from('trades')
    .select('id, pair, direction, pnl, r_multiple, setup, setup_followed, no_setup_reason, session, trade_date, created_at')
    .eq('user_id', user.id)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);

  const tradeList = allTrades || [];
  const tradeIds = tradeList.map((t) => t.id);
  let jmap = {};
  if (tradeIds.length > 0) {
    const { data: journals } = await supabase
      .from('journal_entries')
      .select('trade_id, emotions, confidence, note, lesson, tags')
      .in('trade_id', tradeIds);
    (journals || []).forEach((j) => { jmap[j.trade_id] = j; });
  }

  const persona = computePersona(tradeList, jmap);
  const streaks = computeStreaks(tradeList);

  // ── Habits ──
  let habits = [];
  let habitLogs = [];
  let autoHabitStatus = {};
  const todayDate = getTradingDate(new Date().toISOString());

  try {
    const { data: h } = await supabase
      .from('habits')
      .select('id, name, is_custom, is_active, sort_order')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('sort_order');
    habits = h || [];

    // Fetch today's logs
    if (habits.length > 0) {
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id, log_date, completed')
        .eq('user_id', user.id)
        .eq('log_date', todayDate);
      habitLogs = logs || [];
    }

    // Auto-habit status for today
    const todayTrades = tradeList.filter((t) => (t.trade_date || getTradingDate(t.created_at)) === todayDate);
    const todayJmap = {};
    todayTrades.forEach((t) => { if (jmap[t.id]) todayJmap[t.id] = jmap[t.id]; });
    autoHabitStatus = checkAutoHabits(todayTrades, todayJmap);
  } catch (e) {
    // habits table might not exist yet (migration not run)
    console.log('Habits not available yet (migration 0028 may not be run):', e?.message);
  }

  // Plan access
  const access = await getUserAccess(supabase, user);
  const coachLimit = access.limit('coach_report');
  const analysisLimit = access.limit('ai_analysis');
  const emailEnabled = isEmailConfigured();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      {access.showWarning('coach_report') && (
        <div className="mb-4"><BetaFeatureWarning feature="coach_report" featureLabel="Propol AI Coach" /></div>
      )}
      {!access.canUse('coach_report') && (
        <div className="mb-4"><UpgradeCard feature="coach_report" featureLabel="Propol AI Coach" /></div>
      )}

      <PropolCoachHub
        reports={coachReports || []}
        tradeAnalyses={tradeAnalyses || []}
        tradeCount={tradeCount || 0}
        access={access.toJSON()}
        coachUsed={coachUsed || 0}
        coachLimit={coachLimit}
        analysisUsed={analysisUsed || 0}
        analysisLimit={analysisLimit}
        emailEnabled={emailEnabled}
        persona={persona}
        streaks={streaks}
        habits={habits}
        habitLogs={habitLogs}
        autoHabitStatus={autoHabitStatus}
        todayDate={todayDate}
      />
    </div>
  );
}
