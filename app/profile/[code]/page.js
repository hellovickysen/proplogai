import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PnlCalendar from '@/components/PnlCalendar';
import ProfileTradeList from '@/components/ProfileTradeList';

export const dynamic = 'force-dynamic';

function fmtCurrency(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

const CATEGORY_LABELS = { payout: 'Payout', challenge_pass: 'Challenge Pass', funded: 'Funded', other: 'Achievement' };

export default async function PublicProfilePage({ params }) {
  const code = params.code;
  const supabase = createClient();

  // Look up user by share_code
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_id, share_code, show_calendar, show_trades, show_payouts, show_trophies, calendar_mode, calendar_start, calendar_end, calendar_rolling_days')
    .eq('share_code', code)
    .maybeSingle();

  if (!prefs) notFound();

  const userId = prefs.user_id;
  const { show_calendar, show_trades, show_payouts, show_trophies } = prefs;

  if (!show_calendar && !show_trades && !show_payouts && !show_trophies) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">This profile is private</h1>
          <p className="mt-2 text-sm text-white/55">The trader hasn't shared any information publicly yet.</p>
        </div>
      </div>
    );
  }

  // Build date filter
  let dateFrom = null;
  if (prefs.calendar_mode === 'fixed' && prefs.calendar_start) {
    dateFrom = prefs.calendar_start;
  } else {
    const days = prefs.calendar_rolling_days || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    dateFrom = from.toISOString().slice(0, 10);
  }
  const dateTo = prefs.calendar_mode === 'fixed' && prefs.calendar_end ? prefs.calendar_end : null;

  // Fetch data based on toggles
  let trades = [];
  let payouts = [];
  let trophies = [];

  if (show_calendar || show_trades) {
    let query = supabase
      .from('trades')
      .select('id, pair, direction, pnl, r_multiple, entry_price, exit_price, trade_date, session, created_at')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false });

    if (dateFrom) query = query.gte('trade_date', dateFrom);
    if (dateTo) query = query.lte('trade_date', dateTo);

    const { data } = await query;
    trades = data || [];
  }

  if (show_payouts) {
    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('payout_date', { ascending: false });
    payouts = data || [];
  }

  if (show_trophies) {
    const { data } = await supabase
      .from('trophies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    trophies = data || [];
  }

  // Stats
  const totalPnl = trades.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const totalPayout = payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const payoutCerts = trophies.filter((t) => t.category === 'payout');
  const payoutCertCount = payoutCerts.length;
  const rollingLabel = prefs.calendar_mode === 'fixed'
    ? fmtDate(prefs.calendar_start) + ' — ' + fmtDate(prefs.calendar_end)
    : 'Last ' + (prefs.calendar_rolling_days || 30) + ' days';

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">

        {/* Hero Header */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl text-2xl"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', boxShadow: '0 0 40px rgba(139,92,246,0.3), 0 0 15px rgba(34,211,238,0.2)' }}
          >
            &#9670;
          </div>
          <h1 className="font-display text-3xl font-bold">Trader Profile</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-xs text-white/50">PropJournal Verified</span>
          </div>
          <p className="mt-2 font-mono text-xs text-white/30">{rollingLabel}</p>
        </div>

        {/* 3 Hero Stat Cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {(show_calendar || show_trades) && (
            <div className={'rounded-2xl border p-6 text-center ' + (totalPnl >= 0 ? 'border-emerald-400/20' : 'border-red-400/20')} style={{ background: totalPnl >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)' }}>
              <div className="font-mono text-xs uppercase tracking-wider text-white/45">Total P&L</div>
              <div className={'mt-2 font-display text-3xl font-bold ' + (totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {fmtCurrency(totalPnl)}
              </div>
              <div className="mt-1 font-mono text-[11px] text-white/30">{trades.length} trades</div>
            </div>
          )}
          {show_payouts && (
            <div className="rounded-2xl border border-emerald-400/20 p-6 text-center" style={{ background: 'rgba(52,211,153,0.05)' }}>
              <div className="font-mono text-xs uppercase tracking-wider text-white/45">Payouts Received</div>
              <div className="mt-2 font-display text-3xl font-bold text-emerald-400">
                +${Math.abs(totalPayout).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-1 font-mono text-[11px] text-white/30">{payouts.length} payout{payouts.length !== 1 ? 's' : ''}</div>
            </div>
          )}
          {show_payouts && (
            <div className="rounded-2xl border border-violet-400/20 p-6 text-center" style={{ background: 'rgba(139,92,246,0.05)' }}>
              <div className="font-mono text-xs uppercase tracking-wider text-white/45">No. of Payouts</div>
              <div className="mt-2 font-display text-3xl font-bold" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {payouts.length}
              </div>
              <div className="mt-1 font-mono text-[11px] text-white/30">received</div>
            </div>
          )}
        </div>

        {/* P&L Calendar */}
        {show_calendar && trades.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">P&L Calendar</h2>
            <PnlCalendar trades={trades} />
          </div>
        )}

        {/* Trade List */}
        {show_trades && trades.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Recent Trades</h2>
            <ProfileTradeList trades={trades} />
          </div>
        )}

        {/* Payouts */}
        {show_payouts && payouts.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Payouts</h2>
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">{p.firm_name}</div>
                    <div className="font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                    {/* Notes intentionally hidden from public profile */}
                  </div>
                  <div className="font-mono text-base font-bold text-emerald-400">+${Math.abs(Number(p.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payout Certificates */}
        {show_trophies && payoutCerts.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Payout Certificates</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {payoutCerts.map((t) => (
                <div key={t.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                    <img src={t.file_url} alt={t.title} className="h-full w-full object-cover" />
                    <div className="absolute left-2 top-2">
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 backdrop-blur-sm">Payout Certificate</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold">{t.title}</div>
                    {t.description && <p className="mt-0.5 text-xs text-white/40">{t.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="font-mono text-[11px] text-white/20">Shared via PropJournal — AI Trading Journal for Prop Firm Traders</p>
        </div>
      </div>
    </div>
  );
}
