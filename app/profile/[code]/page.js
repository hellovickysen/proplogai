import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PnlCalendar from '@/components/PnlCalendar';

export const dynamic = 'force-dynamic';

function fmtCurrency(v) {
  const n = Number(v) || 0;
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    .select('user_id, share_code, show_calendar, show_payouts, show_trophies, calendar_mode, calendar_start, calendar_end, calendar_rolling_days')
    .eq('share_code', code)
    .maybeSingle();

  if (!prefs) notFound();

  const userId = prefs.user_id;
  const showCalendar = prefs.show_calendar;
  const showPayouts = prefs.show_payouts;
  const showTrophies = prefs.show_trophies;

  // If nothing is enabled, show empty
  if (!showCalendar && !showPayouts && !showTrophies) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">This profile is private</h1>
          <p className="mt-2 text-sm text-white/55">The trader hasn't shared any information publicly yet.</p>
        </div>
      </div>
    );
  }

  // Fetch data based on toggles
  let trades = [];
  let payouts = [];
  let trophies = [];

  if (showCalendar) {
    let query = supabase
      .from('trades')
      .select('id, pnl, trade_date, created_at')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false });

    // Apply date range
    if (prefs.calendar_mode === 'fixed' && prefs.calendar_start) {
      query = query.gte('trade_date', prefs.calendar_start);
      if (prefs.calendar_end) query = query.lte('trade_date', prefs.calendar_end);
    } else {
      // Rolling window
      const days = prefs.calendar_rolling_days || 30;
      const from = new Date();
      from.setDate(from.getDate() - days);
      query = query.gte('trade_date', from.toISOString().slice(0, 10));
    }

    const { data } = await query;
    trades = data || [];
  }

  if (showPayouts) {
    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('payout_date', { ascending: false });
    payouts = data || [];
  }

  if (showTrophies) {
    const { data } = await supabase
      .from('trophies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });
    trophies = data || [];
  }

  const totalPayout = payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-xl"
            style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}
          >
            &#9670;
          </div>
          <h1 className="font-display text-2xl font-bold">Trader Profile</h1>
          <p className="mt-1 font-mono text-xs text-white/40">PropJournal verified</p>
        </div>

        {/* P&L Calendar */}
        {showCalendar && trades.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">P&L Calendar</h2>
              <span className="font-mono text-xs text-white/40">
                {prefs.calendar_mode === 'fixed'
                  ? fmtDate(prefs.calendar_start) + ' — ' + fmtDate(prefs.calendar_end)
                  : 'Last ' + (prefs.calendar_rolling_days || 30) + ' days'}
              </span>
            </div>
            <PnlCalendar trades={trades} />
          </div>
        )}

        {/* Total Payouts */}
        {showPayouts && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Payouts Received</h2>
            <div className="mb-4 rounded-xl border border-emerald-400/15 p-4" style={{ background: 'rgba(52,211,153,0.04)' }}>
              <div className="font-mono text-xs uppercase text-white/40">Total earned</div>
              <div className="mt-1 font-display text-3xl font-bold text-emerald-400">{fmtCurrency(totalPayout)}</div>
            </div>
            {payouts.length > 0 && (
              <div className="space-y-2">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold">{p.firm_name}</div>
                      <div className="font-mono text-[11px] text-white/40">{fmtDate(p.payout_date)}</div>
                    </div>
                    <div className="font-mono text-base font-bold text-emerald-400">+{fmtCurrency(p.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trophy Wall */}
        {showTrophies && trophies.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Achievements</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trophies.map((t) => (
                <div key={t.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="aspect-[4/3] overflow-hidden bg-black/40">
                    <img src={t.file_url} alt={t.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                        {CATEGORY_LABELS[t.category] || 'Achievement'}
                      </span>
                      <span className="font-mono text-[10px] text-white/30">{fmtDate(t.created_at?.slice(0, 10))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="font-mono text-[11px] text-white/25">Shared via PropJournal — AI Trading Journal for Prop Firm Traders</p>
        </div>
      </div>
    </div>
  );
}
