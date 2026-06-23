import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient, isAdminConfigured } from '@/lib/supabase/admin';
import { fmtMoney, num } from '@/lib/stats';
import AdminTradeList from '@/components/AdminTradeList';

export const dynamic = 'force-dynamic';

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

function Pill({ children, color = 'violet' }) {
  const colors = {
    violet: 'border-violet-400/25 bg-violet-500/10 text-violet-200',
    cyan: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
  };
  return <span className={'rounded-full border px-2.5 py-1 text-[11px] ' + (colors[color] || colors.violet)}>{children}</span>;
}

export default async function AdminUserDetailPage({ params }) {
  if (!isAdminConfigured()) return <div className="p-8 text-white/55">Add SUPABASE_SERVICE_ROLE_KEY first.</div>;
  const userId = params.id;
  const sb = createAdminClient();
  if (!sb) return <div className="p-8 text-white/55">Admin client unavailable.</div>;

  const { data: userData } = await sb.auth.admin.getUserById(userId);
  const user = userData?.user;
  if (!user) notFound();

  const [tradesRes, journalsRes, insightsRes, prefsRes] = await Promise.all([
    sb.from('trades').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    sb.from('journal_entries').select('*').eq('user_id', userId),
    sb.from('ai_insights').select('id, type').eq('user_id', userId),
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
  const journalCount = journals.length;

  // Build journal map (serializable for client component)
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

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
          <div className="font-mono text-xs text-white/50">Journals</div>
          <div className="mt-1 font-display text-xl font-bold">{journalCount}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="font-mono text-xs text-white/50">AI calls</div>
          <div className="mt-1 font-display text-xl font-bold">{tradeAnalyses + coachReports}</div>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-3 font-display text-base font-semibold">Preferences</div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-white/50">Onboarded:</span>
            {prefs?.onboarding_complete
              ? <span className="font-semibold text-emerald-400">✓ Yes</span>
              : <span className="font-semibold text-red-400">✕ No</span>}
            <span className="text-white/50">Confidence:</span>
            <span className="font-semibold">{prefs?.default_confidence || 0}/5</span>
            {prefs?.avatar_url && <span className="text-white/50">Avatar: ✅</span>}
          </div>
          <div>
            <div className="mb-1.5 font-mono text-xs uppercase tracking-wider text-white/45">Custom Emotions ({prefs?.custom_emotions?.length || 0})</div>
            {prefs?.custom_emotions?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">{prefs.custom_emotions.map((em, i) => <Pill key={i} color="violet">{em}</Pill>)}</div>
            ) : <span className="text-xs text-white/30">Using defaults</span>}
          </div>
          <div>
            <div className="mb-1.5 font-mono text-xs uppercase tracking-wider text-white/45">Custom Setups ({prefs?.custom_setups?.length || 0})</div>
            {prefs?.custom_setups?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">{prefs.custom_setups.map((s, i) => <Pill key={i} color="cyan">{s}</Pill>)}</div>
            ) : <span className="text-xs text-white/30">Using defaults</span>}
          </div>
        </div>
      </div>

      {/* Trades with filter */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 font-display text-base font-semibold">Trades & Journals</div>
        <AdminTradeList trades={trades} jmap={jmap} />
      </div>
    </div>
  );
}
