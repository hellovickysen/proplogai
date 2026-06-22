import { createClient } from '@/lib/supabase/server';
import CoachReport from '@/components/CoachReport';
import GenerateReportButton from '@/components/GenerateReportButton';

export const dynamic = 'force-dynamic';

export default async function CoachPage() {
  const supabase = createClient();
  const { count } = await supabase.from('trades').select('id', { count: 'exact', head: true });
  const { data: insight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('type', 'coach_report')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const report = insight && insight.mistakes ? insight.mistakes : null;
  const tradeCount = count || 0;

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">AI Coach</h1>
          <p className="mt-1 text-sm text-white/50">Recurring patterns and trading psychology across your recent trades.</p>
        </div>
        {tradeCount >= 2 ? <GenerateReportButton label={report ? '↻ Refresh report' : '✦ Generate report'} /> : null}
      </div>

      {report ? (
        <CoachReport report={report} updatedAt={insight.created_at} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(120deg, rgba(139,92,246,0.2), rgba(34,211,238,0.1))', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            &#10022;
          </div>
          <h2 className="font-display text-xl font-bold">No report yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-white/55">
            {tradeCount < 2
              ? 'Log at least 2 trades (with journals) so the coach has patterns to analyze.'
              : 'Generate your first coaching report to see your recurring mistakes and trading psychology across all trades.'}
          </p>
          {tradeCount >= 2 ? (
            <div className="mt-6 flex justify-center">
              <GenerateReportButton />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
