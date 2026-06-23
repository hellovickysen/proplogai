import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { fmtMoney, num } from '@/lib/stats';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

export default async function AdminUserDetailPage({ params }) {
  if (!isAdminConfigured()) return <div className="p-8 text-white/55">Add SUPABASE_SERVICE_ROLE_KEY first.</div>;
  const userId = params.id;
  const sb = createAdminClient();

  // Get user info
  const { data: userData } = await sb.auth.admin.getUserById(userId);
  const user = userData?.user;
  if (!user) notFound();

  // Get user's data
  const [tradesRes, journalsRes, insightsRes, prefsRes] = await Promise.all([
    sb.from('trades').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    sb.from('journal_entries').select('trade_id, emotions, note, confidence').eq('user_id', userId),
    sb.from('ai_insights').select('id, type, trade_id, summary, severity, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    sb.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const trades = tradesRes.data || [];
  const journals = journalsRes.data || [];
  const insights = insightsRes.data || [];
  const prefs = prefsRes.data;

  const totalPnl = trades.reduce((a, t) => a + num(t.pnl), 0);
  const wins = trades.filter((t) => num(t.pnl) >= 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const tradeAnalyses = insights.filter((i) => i.type === 'trade_analysis').length;
  const coachReports = insights.filter((i) => i.type === 'coach_report').length;

  // Journal map for trades
  const jmap = {};
  journals.forEach((j) => { jmap[j.trade_id] = j; });

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users" className="text-xs text-cyan-400 hover:underline">← All users</Link>
        <h1 className="mt-2 font-display text-2xl font-bold">{user.email}</h1>
        <p className="mt-1 text-sm text-white/50">
          Signed up {fmtDate(user.created_at)} · Last active {fmtDate(user.last_sign_in_at)} · Provider: {user.app_metadata?.provider || 'email'}
        </p>
      </div>

      {/* User stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="font-mono text-xs text-white/50">Net P&L</div>
          <div className={'mt-1 font-display text-xl font-bold ' + (totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(totalPnl)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="font-mono text-xs text-white/50">Trades</div>
          <div className="mt-1 font-display text-xl font-bold">{trades.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="font-mono text-xs text-white/50">Win rate</div>
          <div className="mt-1 font-display text-xl font-bold">{winRate}%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="font-mono text-xs text-white/50">AI calls</div>
          <div className="mt-1 font-display text-xl font-bold">{tradeAnalyses} + {coachReports}r</div>
        </div>
      </div>

      {/* Preferences */}
      {prefs && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 font-display text-sm font-semibold">Preferences</div>
          <div className="flex flex-wrap gap-3 text-xs text-white/55">
            <span>Onboarded: {prefs.onboarding_complete
              ? <span className="text-emerald-400 font-semibold">✓ Yes</span>
              : <span className="text-red-400 font-semibold">✕ No</span>}</span>
            <span>Emotions: {prefs.custom_emotions?.length || 0} custom</span>
            <span>Setups: {prefs.custom_setups?.length || 0} custom</span>
            <span>Default confidence: {prefs.default_confidence || 0}</span>
            {prefs.avatar_url && <span>Has avatar ✅</span>}
          </div>
        </div>
      )}

      {/* Recent trades */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 font-display text-base font-semibold">Recent trades ({trades.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="text-left font-mono text-xs uppercase tracking-wider text-white/55">
                <th className="px-3 pb-2">Pair</th>
                <th className="px-3 pb-2">Dir</th>
                <th className="px-3 pb-2">Date</th>
                <th className="px-3 pb-2">P&L</th>
                <th className="px-3 pb-2">Setup</th>
                <th className="px-3 pb-2">Session</th>
                <th className="px-3 pb-2">Journal</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const win = num(t.pnl) >= 0;
                const j = jmap[t.id];
                return (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="px-3 py-2 font-medium">{t.pair}</td>
                    <td className="px-3 py-2">
                      <span className={'rounded px-2 py-0.5 font-mono text-[10px] ' + (t.direction === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')}>
                        {(t.direction || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-white/55">{t.trade_date || '—'}</td>
                    <td className={'px-3 py-2 font-mono font-semibold ' + (win ? 'text-emerald-400' : 'text-red-400')}>{fmtMoney(t.pnl)}</td>
                    <td className="px-3 py-2 text-white/55">{t.setup || '—'}</td>
                    <td className="px-3 py-2 text-white/55">{t.session || '—'}</td>
                    <td className="px-3 py-2">
                      {j ? (
                        <span className="text-xs text-white/50">
                          {j.emotions?.length ? j.emotions.join(', ') : ''}
                          {j.note ? ' 📝' : ''}
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-white/40">No trades logged.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
