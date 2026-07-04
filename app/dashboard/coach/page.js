import { createClient } from '@/lib/supabase/server';
import PropolCoachHub from '@/components/coach/PropolCoachHub';
import { isEmailConfigured } from '@/lib/email';
import { getUserAccess } from '@/lib/plans';
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
        coachLimit={coachLimit === Infinity ? -1 : coachLimit}
        analysisUsed={analysisUsed || 0}
        analysisLimit={analysisLimit === Infinity ? -1 : analysisLimit}
        emailEnabled={emailEnabled}
      />
    </div>
  );
}
