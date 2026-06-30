import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CoachPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count, error: countError } = await supabase
    .from('trades')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

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

  const tradeCount = count || 0;

  const { data: insights, error: insightError } = await supabase
    .from('ai_insights')
    .select('id, insight, created_at, tags')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (insightError) console.error('ai_insights error', insightError);
  const insightList = insights || [];

  if (tradeCount === 0) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold">AI Coach</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-10">
          <h2 className="font-display text-xl font-bold">No insights yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
            Log some trades first and your AI coach will start generating personalised insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">AI Coach</h1>

      {insightList.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-white/55">No insights generated yet. Check back after logging more trades.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {insightList.map((item) => (
            <div key={item.id} className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5">
              <div className="mb-1 font-mono text-xs uppercase tracking-wider text-violet-400">
                {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <p className="text-sm text-white/80">{item.insight}</p>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-violet-400/20 px-2 py-0.5 font-mono text-xs text-violet-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
