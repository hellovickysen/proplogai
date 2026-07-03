import { createClient } from '@/lib/supabase/server';
import CoachReport from '@/components/coach/CoachReport';
import GenerateReportButton from '@/components/coach/GenerateReportButton';
import EmailReportButton from '@/components/coach/EmailReportButton';
import Link from 'next/link';
import { isEmailConfigured } from '@/lib/email';
import { getUserAccess } from '@/lib/plans';
import BetaFeatureWarning from '@/components/ui/BetaFeatureWarning';
import UpgradeCard from '@/components/ui/UpgradeCard';

export const dynamic = 'force-dynamic';

const MIN_TRADES = 5;

export default async function CoachPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { count, error: countError } = await supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', user.id);

  if (countError) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">AI Coach</h1>
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/[0.05] p-6 text-center">
          <p className="text-sm text-red-400">Something went wrong loading your data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { data: insight, error: insightError } = await supabase
    .from('ai_insights')
    .select('mistakes, created_at')
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (insightError) console.error('ai_insights error', insightError);

  // Count coach reports used this month (for usage badge)
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const { count: coachUsedThisMonth, error: usageError } = await supabase
    .from('ai_insights')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'coach_report')
    .gte('created_at', monthStart.toISOString());
  if (usageError) console.error('coach usage error', usageError);

  const report = insight && insight.mistakes ? insight.mistakes : null;
  const tradeCount = count || 0;
  const hasEnough = tradeCount >= MIN_TRADES;
  const emailEnabled = isEmailConfigured();

  // Plan access
  const access = await getUserAccess(supabase, user);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">AI Coach</h1>
          <p className="mt-1 text-sm text-white/55">Recurring patterns and trading psychology across your recent trades.</p>
        </div>
        <div className="flex items-center gap-2">
          {report && emailEnabled && access.canUse('email_coach') ? <EmailReportButton /> : null}
          {hasEnough && access.canUse('coach_report') ? <GenerateReportButton label={report ? '↻ Refresh report' : '✦ Generate report'} usedThisMonth={coachUsedThisMonth || 0} /> : null}
        </div>
      </div>

      {access.showWarning('coach_report') && (
        <div className="mb-4"><BetaFeatureWarning feature="coach_report" featureLabel="AI Coach reports" /></div>
      )}
      {!access.canUse('coach_report') && (
        <div className="mb-4"><UpgradeCard feature="coach_report" featureLabel="AI Coach reports" /></div>
      )}

      {report ? (
        <CoachReport report={report} updatedAt={insight.created_at} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-10">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}>
            &#10022;
          </div>
          <h2 className="font-display text-xl font-bold">{hasEnough ? 'No report yet' : 'Need more trades'}</h2>
          <p className="mx-auto mt-2 max-w-sm text-white/55">
            {hasEnough
              ? 'Generate your first coaching report to see your recurring mistakes and trading psychology across all trades.'
              : `Log at least ${MIN_TRADES} trades so the AI Coach has enough data to detect patterns. You have ${tradeCount} trade${tradeCount !== 1 ? 's' : ''} so far.`}
          </p>
          {hasEnough ? (
            <div className="mt-6 flex justify-center"><GenerateReportButton usedThisMonth={coachUsedThisMonth || 0} /></div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="w-full max-w-[192px]">
                <div className="mb-1 flex justify-between font-mono text-xs text-white/45"><span>{tradeCount} / {MIN_TRADES}</span><span>{Math.round((tradeCount / MIN_TRADES) * 100)}%</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full transition-all" style={{ width: Math.min(100, (tradeCount / MIN_TRADES) * 100) + '%', background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }} /></div>
              </div>
              <Link href="/dashboard/trades/new" className="mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>+ Log a trade</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
