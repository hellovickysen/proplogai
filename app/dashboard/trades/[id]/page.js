import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { fmtMoney } from '@/lib/stats';
import JournalInlineEdit from '@/components/trades/JournalInlineEdit';
import TradeShareMenu from '@/components/share/TradeShareMenu';
import AnalyzeButton from '@/components/trades/AnalyzeButton';

export const dynamic = 'force-dynamic';

export default async function TradeDetailPage({ params, searchParams }) {
  const isViewOnly = searchParams?.from === 'search';
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch trade with user_id check
  const { data: trade, error: tradeErr } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (tradeErr || !trade) {
    return (
      <div className="p-6">
        <Link href="/dashboard/trades" className="text-sm text-violet-400 hover:text-violet-300 mb-4 inline-flex items-center gap-1">
          ← Back to Trades
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4 opacity-30">🔍</div>
          <h2 className="text-lg font-semibold text-white/80 mb-2">Trade not found</h2>
          <p className="text-sm text-white/40">This trade doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  // Fetch journal entry
  const { data: journal } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('trade_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch user prefs for inline journal edit
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('custom_emotions, custom_tags, avatar_url, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch AI analysis
  const { data: aiInsight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('trade_id', id)
    .eq('user_id', user.id)
    .eq('type', 'trade_analysis')
    .order('created_at', { ascending: false })
    .maybeSingle();

  // Fetch setup names if setup_ids exist
  let setupNames = trade.setup ? trade.setup.split(', ') : [];

  const pnl = Number(trade.pnl) || 0;
  const isProfit = pnl >= 0;
  const emotions = journal?.emotions || [];
  const tags = Array.isArray(journal?.tags) ? journal.tags : [];
  const screenshots = Array.isArray(journal?.screenshot_urls) ? journal.screenshot_urls.filter(Boolean) : [];
  if (!screenshots.length && journal?.screenshot_url) screenshots.push(journal.screenshot_url);

  // Parse AI insight — structured data lives in the `mistakes` jsonb column,
  // `summary` is a plain text string
  let aiData = null;
  if (aiInsight) {
    if (aiInsight.mistakes && typeof aiInsight.mistakes === 'object') {
      aiData = aiInsight.mistakes;
    } else if (aiInsight.summary) {
      try {
        aiData = JSON.parse(aiInsight.summary);
      } catch (e) {
        aiData = { summary: aiInsight.summary };
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Top bar: Back + Share buttons */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard/trades" className="text-sm text-violet-400 hover:text-violet-300 inline-flex items-center gap-1.5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          Back to Trades
        </Link>
        <TradeShareMenu
          tradeId={trade.id}
          tradeData={{ pair: trade.pair, direction: trade.direction, pnl, trade_date: trade.trade_date, session: trade.session, setup: trade.setup, avatarUrl: prefs?.avatar_url || null, fullName: prefs?.full_name || '' }}
          initialShareId={trade.share_id}
          initialSharedUntil={trade.shared_until}
        />
      </div>

      {/* Trade Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{trade.pair}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${
                trade.direction === 'long'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
                  : 'bg-red-500/15 text-red-300 border border-red-400/20'
              }`}>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="shrink-0">
                  {trade.direction === 'long'
                    ? <path d="M1 9L4.5 4L7.5 6.5L13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    : <path d="M1 1L4.5 6L7.5 3.5L13 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  }
                </svg>
                {trade.direction}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span>{trade.trade_date}</span>
              {trade.session && <span>· {trade.session}</span>}
              {trade.timeframe && <span>· {trade.timeframe}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl sm:text-4xl font-bold font-mono ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmtMoney(pnl)}
            </div>
          </div>
        </div>

        {/* Setup badges */}
        {setupNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {setupNames.map((s, i) => (
              <span key={i} className="px-3 py-1 rounded-lg bg-amber-400/[0.1] border border-amber-400/20 text-amber-400 text-xs font-medium">
                ⚡ {s}
              </span>
            ))}
            {trade.setup_followed && (
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                trade.setup_followed === 'yes' ? 'bg-emerald-400/[0.1] border border-emerald-400/20 text-emerald-400' :
                trade.setup_followed === 'no' ? 'bg-red-400/[0.1] border border-red-400/20 text-red-400' :
                'bg-amber-400/[0.1] border border-amber-400/20 text-amber-400'
              }`}>
                {trade.setup_followed === 'yes' ? '✓ Followed' : trade.setup_followed === 'no' ? '✗ Not followed' : '~ Partial'}
              </span>
            )}
          </div>
        )}

        {/* Trade Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Entry" value={trade.entry_price != null ? Number(trade.entry_price).toFixed(5).replace(/0+$/, '').replace(/\.$/, '') : '—'} />
          <StatCard label="Exit" value={trade.exit_price != null ? Number(trade.exit_price).toFixed(5).replace(/0+$/, '').replace(/\.$/, '') : '—'} />
          <StatCard label="Stop Loss" value={trade.stop_loss != null ? Number(trade.stop_loss).toFixed(5).replace(/0+$/, '').replace(/\.$/, '') : '—'} />
          <StatCard label="Lot Size" value={trade.lot_size != null ? trade.lot_size : '—'} />
        </div>
      </div>

      {/* Journal — inline edit (from trades list) or view-only (from search) */}
      {isViewOnly ? (
        <>
          {journal ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-4">
              <h2 className="font-mono text-xs uppercase tracking-wider text-white/55 mb-4">📝 Journal Entry</h2>
              {(emotions.length > 0 || tags.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {emotions.map((e, i) => (
                    <span key={`e-${i}`} className="px-2.5 py-1 rounded-lg bg-violet-400/[0.12] border border-violet-400/20 text-violet-300 text-xs font-medium">{e}</span>
                  ))}
                  {tags.map((t, i) => (
                    <span key={`t-${i}`} className="px-2.5 py-1 rounded-lg bg-cyan-400/[0.1] border border-cyan-400/20 text-cyan-300 text-xs font-medium">#{t}</span>
                  ))}
                </div>
              )}
              {journal.confidence != null && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-white/40">Confidence</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className={`w-5 h-2 rounded-full ${n <= journal.confidence ? 'bg-violet-400' : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{journal.confidence}/5</span>
                </div>
              )}
              {journal.note && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-white/50 mb-2">Notes</h3>
                  <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{journal.note}</p>
                </div>
              )}
              {journal.lesson && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-white/50 mb-2">Lesson Learned</h3>
                  <div className="rounded-xl bg-amber-400/[0.06] border border-amber-400/15 px-4 py-3">
                    <p className="text-sm text-amber-200/80 leading-relaxed whitespace-pre-wrap">{journal.lesson}</p>
                  </div>
                </div>
              )}
              {screenshots.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/50 mb-2">Screenshots</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {screenshots.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-white/10 hover:border-violet-400/30 transition-colors">
                        <img src={url} alt={`Trade screenshot ${i + 1}`} className="w-full h-auto max-h-80 object-contain bg-black/50" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-4 text-center">
              <div className="text-2xl mb-2 opacity-30">📝</div>
              <p className="text-sm text-white/40">No journal entry for this trade</p>
            </div>
          )}
        </>
      ) : (
        <>
          <JournalInlineEdit tradeId={trade.id} journal={journal} userId={user.id} prefs={prefs} screenshots={screenshots} editTradeHref={`/dashboard/trades/${trade.id}/edit`} />
        </>
      )}

      {/* AI Analysis */}
      {aiData && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-4">
          <h2 className="font-mono text-xs uppercase tracking-wider text-white/55 mb-4">✦ AI Analysis</h2>

          {/* Grade/Score */}
          {aiData.grade && (
            <div className="flex items-center gap-3 mb-4">
              <div className={`text-3xl font-bold font-mono ${
                (aiData.execution_score || 0) >= 70 ? 'text-emerald-400' :
                (aiData.execution_score || 0) >= 40 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {aiData.grade}
              </div>
              {aiData.execution_score != null && (
                <div className="text-sm text-white/40">Execution Score: {aiData.execution_score}/100</div>
              )}
            </div>
          )}

          {/* What went well */}
          {aiData.went_well && aiData.went_well.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-emerald-400/70 mb-2">✓ What went well</h3>
              <ul className="space-y-1">
                {aiData.went_well.map((item, i) => (
                  <li key={i} className="text-sm text-white/60 pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-emerald-400/40">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mistakes */}
          {aiData.mistakes && aiData.mistakes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-red-400/70 mb-2">✗ Mistakes</h3>
              <ul className="space-y-1">
                {aiData.mistakes.map((item, i) => (
                  <li key={i} className="text-sm text-white/60 pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-red-400/40">
                    {typeof item === 'string' ? item : item.description || item.mistake || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Fix/Improvement */}
          {aiData.fix && (
            <div className="rounded-xl bg-violet-400/[0.06] border border-violet-400/15 px-4 py-3">
              <h3 className="text-xs font-semibold text-violet-300/70 mb-1">💡 Key takeaway</h3>
              <p className="text-sm text-violet-200/70">{aiData.fix}</p>
            </div>
          )}

          {/* Fallback for unstructured summary */}
          {!aiData.grade && aiData.summary && (
            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{aiData.summary}</p>
          )}
        </div>
      )}

      {/* No AI analysis — show CTA */}
      {!aiData && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-4 text-center">
          <div className="text-2xl mb-2 opacity-40">✦</div>
          <h3 className="text-sm font-semibold text-white/60 mb-1">AI Analysis</h3>
          <p className="text-xs text-white/35 mb-3">Get Propol&apos;s feedback on this trade — what went well, mistakes, and a lesson.</p>
          <AnalyzeButton tradeId={id} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6">
        <Link href="/dashboard/trades" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
          All Trades
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <div className="text-sm font-medium text-white/80 font-mono">{value}</div>
    </div>
  );
}
