import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fmtMoney, fmtR, num } from '@/lib/stats';
import Logo from '@/components/Logo';
import SharedScreenshots from '@/components/share/SharedScreenshots';

export const dynamic = 'force-dynamic';

const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

function timeLeft(sharedUntil) {
  const diff = new Date(sharedUntil) - new Date();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return hours + 'h ' + mins + 'm';
  return mins + 'm';
}

/* ─── Expired Page ──────────────────────────────────────────── */

function ExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#07070b]">
      <header className="border-b border-white/10 px-6 py-4">
        <Link href="/">
          <Logo size={32} wordmarkClassName="font-display text-base font-bold" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl">⏰</div>
          <h1 className="font-display text-2xl font-bold">This link has expired</h1>
          <p className="mt-3 text-sm text-white/50">
            Shared trade journals are available for 24 hours. This one is no longer accessible.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f]"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            Start your own trading journal — Free
          </Link>
        </div>
      </main>
      <footer className="border-t border-white/10 px-6 py-4 text-center">
        <p className="text-xs text-white/30" style={{ fontFamily: 'Poppins, sans-serif' }}>
          PropLogAI is an educational tool and does not provide financial advice.
        </p>
      </footer>
    </div>
  );
}

/* ─── Emotion pill ──────────────────────────────────────────── */

function EmotionPill({ emotion }) {
  const colors = {
    confident: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
    calm: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-300',
    focused: 'border-blue-400/30 bg-blue-500/15 text-blue-300',
    anxious: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
    greedy: 'border-orange-400/30 bg-orange-500/15 text-orange-300',
    fearful: 'border-red-400/30 bg-red-500/15 text-red-300',
    frustrated: 'border-red-400/30 bg-red-500/15 text-red-300',
    revenge: 'border-red-400/30 bg-red-500/15 text-red-300',
    fomo: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
    hopeful: 'border-violet-400/30 bg-violet-500/15 text-violet-300',
  };
  const cls = colors[emotion.toLowerCase()] || 'border-white/20 bg-white/10 text-white/60';
  return (
    <span className={'rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ' + cls}>{emotion}</span>
  );
}

/* ─── Confidence bar ────────────────────────────────────────── */

function ConfidenceBar({ value }) {
  if (!value && value !== 0) return null;
  const pct = Math.min(Math.max(value, 0), 10) * 10;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-white/50">Confidence</span>
        <span className="font-mono text-sm font-bold text-white/80">{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: pct + '%', background: 'linear-gradient(90deg,#a78bfa,#22d3ee)' }} />
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */

export async function generateMetadata({ params }) {
  const supabase = createClient();
  const { data: trade } = await supabase
    .from('trades')
    .select('pair, direction, pnl, share_id, shared_until')
    .eq('share_id', params.shareId)
    .maybeSingle();

  if (!trade || !trade.shared_until || new Date(trade.shared_until) <= new Date()) {
    return { title: 'Shared Trade — PropLogAI' };
  }

  const win = num(trade.pnl) >= 0;
  const pnlStr = (win ? '+' : '') + fmtMoney(trade.pnl);
  return {
    title: trade.pair + ' ' + (trade.direction || '').toUpperCase() + ' ' + pnlStr + ' — PropLogAI',
    description: 'See this trade journal entry on PropLogAI — AI-powered trading journal for prop firm traders.',
    openGraph: {
      title: trade.pair + ' ' + (trade.direction || '').toUpperCase() + ' ' + pnlStr,
      description: 'Trade journal shared via PropLogAI. See the full breakdown, emotions, and AI analysis.',
      siteName: 'PropLogAI',
    },
  };
}

export default async function SharedTradePage({ params }) {
  const supabase = createClient();

  // Fetch trade by share_id (RLS allows anon to see shared+non-expired)
  const { data: trade } = await supabase
    .from('trades')
    .select('*')
    .eq('share_id', params.shareId)
    .maybeSingle();

  // If no trade found, it either doesn't exist or has expired
  if (!trade) {
    // Check if it once existed (expired)
    // Since RLS filters out expired trades for anon, any missing result could be expired
    return <ExpiredPage />;
  }

  const remaining = timeLeft(trade.shared_until);
  if (!remaining) return <ExpiredPage />;

  // Fetch journal and AI insight (RLS allows via shared trade policy)
  const { data: journal } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('trade_id', trade.id)
    .maybeSingle();

  const { data: insight } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('trade_id', trade.id)
    .eq('type', 'trade_analysis')
    .maybeSingle();

  // Resolve setup names
  let setupNames = [];
  const setupIdsList = Array.isArray(trade.setup_ids) && trade.setup_ids.length > 0
    ? trade.setup_ids
    : trade.setup_id ? [trade.setup_id] : [];

  if (setupIdsList.length > 0) {
    const { data: setupRows } = await supabase
      .from('setups')
      .select('name')
      .in('id', setupIdsList);
    setupNames = (setupRows || []).map((s) => s.name);
  }
  if (setupNames.length === 0 && trade.setup) {
    setupNames = trade.setup.split(', ').filter(Boolean);
  }

  const win = num(trade.pnl) >= 0;
  const screenshots = journal?.screenshot_urls || (journal?.screenshot_url ? [journal.screenshot_url] : []);
  const ai = insight?.mistakes; // the full AI analysis object

  return (
    <div className="flex min-h-screen flex-col bg-[#07070b]">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/">
            <Logo size={28} wordmarkClassName="font-display text-base font-bold" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <span className="font-mono text-[10px] text-cyan-300">Expires in {remaining}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Trade headline */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">
                  {trade.pair}{' '}
                  <span className={'ml-1 rounded px-2 py-0.5 align-middle font-mono text-xs ' + (trade.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                    {(trade.direction || '').toUpperCase()}
                  </span>
                </h1>
                <div className="mt-1 font-mono text-xs text-white/45">
                  {fmtDate(trade.trade_date || trade.closed_at || trade.created_at)}
                  {trade.session && <span className="ml-2">&middot; {trade.session}</span>}
                  {trade.timeframe && <span className="ml-2">&middot; {trade.timeframe}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className={'font-display text-2xl font-bold ' + (win ? 'text-emerald-400' : 'text-red-400')}>
                  {fmtMoney(trade.pnl)}
                </div>
                {trade.r_multiple != null && (
                  <div className={'font-mono text-sm ' + (win ? 'text-emerald-400/70' : 'text-red-400/70')}>
                    {fmtR(trade.r_multiple)}
                  </div>
                )}
              </div>
            </div>

            {/* Trade facts grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {trade.entry_price != null && (
                <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">Entry</div>
                  <div className="font-mono text-sm">{trade.entry_price}</div>
                </div>
              )}
              {trade.exit_price != null && (
                <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">Exit</div>
                  <div className="font-mono text-sm">{trade.exit_price}</div>
                </div>
              )}
              {trade.stop_loss != null && (
                <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">Stop</div>
                  <div className="font-mono text-sm">{trade.stop_loss}</div>
                </div>
              )}
              {trade.lot_size != null && (
                <div className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">Lot</div>
                  <div className="font-mono text-sm">{trade.lot_size}</div>
                </div>
              )}
            </div>

            {/* Setups */}
            {setupNames.length > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-white/45">Setups</div>
                <div className="flex flex-wrap gap-1.5">
                {setupNames.map((name, i) => (
                  <span key={i} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">{name}</span>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Journal section */}
          {journal && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 font-display text-sm font-semibold" style={gradientText}>📓 Journal Entry</h2>

              {/* Emotions */}
              {journal.emotions && journal.emotions.length > 0 && (
                <div className="mb-4">
                  <div className="mb-1.5 font-mono text-xs uppercase tracking-wider text-white/45">Emotions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {journal.emotions.map((e, i) => <EmotionPill key={i} emotion={e} />)}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {journal.confidence != null && (
                <div className="mb-4">
                  <ConfidenceBar value={journal.confidence} />
                </div>
              )}

              {/* Note */}
              {journal.note && (
                <div className="mb-4 rounded-xl border border-white/5 bg-black/20 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{journal.note}</p>
                </div>
              )}

              {/* Screenshots with lightbox */}
              <SharedScreenshots urls={screenshots} />

              {/* Empty journal */}
              {!journal.note && (!journal.emotions || journal.emotions.length === 0) && journal.confidence == null && screenshots.length === 0 && (
                <p className="text-sm text-white/35 italic">No journal entry recorded for this trade.</p>
              )}
            </div>
          )}

          {/* AI Analysis */}
          {ai && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold" style={gradientText}>✦ AI Trade Analysis</h2>
                {ai.grade && (
                  <span className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-xs font-bold text-white/80">
                    Grade: {ai.grade}
                  </span>
                )}
              </div>

              {ai.execution_score != null && (
                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-white/45">Execution Score</span>
                    <span className="font-mono text-sm font-bold">{ai.execution_score}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: Math.min(ai.execution_score, 100) + '%', background: 'linear-gradient(90deg,#a78bfa,#22d3ee)' }} />
                  </div>
                </div>
              )}

              {ai.went_well && ai.went_well.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 font-mono text-xs uppercase tracking-wider text-emerald-400/60">What went well</div>
                  <ul className="space-y-1">
                    {ai.went_well.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="mt-1 text-emerald-400">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.mistakes && ai.mistakes.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 font-mono text-xs uppercase tracking-wider text-red-400/60">Mistakes</div>
                  <ul className="space-y-1">
                    {ai.mistakes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <span className="mt-1 text-red-400">✗</span>
                        <span>{typeof item === 'string' ? item : item.description || item.mistake || JSON.stringify(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ai.fix && (
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/[0.06] p-3">
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300/60">One thing to fix</div>
                  <p className="text-sm text-white/70">{ai.fix}</p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="rounded-2xl border border-white/10 p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(34,211,238,0.06))' }}>
            <h3 className="font-display text-lg font-bold">Track your trading psychology</h3>
            <p className="mt-2 text-sm text-white/50">
              PropLogAI helps prop firm traders identify recurring mistakes, track emotions, and get AI coaching — all in one journal.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f]"
              style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
            >
              Start free — no credit card
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 text-center">
        <p className="text-xs text-white/30" style={{ fontFamily: 'Poppins, sans-serif' }}>
          PropLogAI is an educational tool and does not provide financial advice. Trading involves substantial risk of loss.
        </p>
      </footer>
    </div>
  );
}
