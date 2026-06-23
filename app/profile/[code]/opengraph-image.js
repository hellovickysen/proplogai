import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const alt = 'PropJournal Trader Profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function fmtMoney(v) {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '+';
  if (abs >= 1000000) return sign + '$' + (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 10000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function OGImage({ params }) {
  const code = params.code;
  const supabase = createClient();

  // Look up user by share_code
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_id, show_calendar, show_payouts, show_trophies, show_trades, calendar_mode, calendar_rolling_days')
    .eq('share_code', code)
    .maybeSingle();

  if (!prefs) {
    // Fallback: generic card
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#07070b', color: 'white', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>PropJournal</div>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>Trader Profile</div>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const userId = prefs.user_id;

  // Fetch stats
  const days = prefs.calendar_rolling_days || 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().slice(0, 10);

  const { data: trades } = await supabase
    .from('trades')
    .select('pnl')
    .eq('user_id', userId)
    .gte('trade_date', fromStr);

  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount')
    .eq('user_id', userId);

  const tradeList = trades || [];
  const payoutList = payouts || [];

  const totalPnl = tradeList.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const totalTrades = tradeList.length;
  const wins = tradeList.filter((t) => (Number(t.pnl) || 0) > 0).length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalPayout = payoutList.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const pnlColor = totalPnl >= 0 ? '#34d399' : '#f87171';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#07070b',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: 60,
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#08080f',
            }}
          >
            PJ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>Trader Profile</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              PropJournal Verified • Last {days} days
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, marginTop: 20 }}>
          {/* P&L */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              borderRadius: 20,
              border: `1px solid ${totalPnl >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              background: totalPnl >= 0 ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
              padding: 32,
            }}
          >
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2 }}>
              Total P&L
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, color: pnlColor, marginTop: 8 }}>
              {fmtMoney(totalPnl)}
            </div>
          </div>

          {/* Win Rate */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              padding: 32,
            }}
          >
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2 }}>
              Win Rate
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, marginTop: 8 }}>
              {winRate}%
            </div>
          </div>

          {/* Trades */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              padding: 32,
            }}
          >
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2 }}>
              Trades
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, marginTop: 8 }}>
              {totalTrades}
            </div>
          </div>

          {/* Payouts */}
          {totalPayout > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                borderRadius: 20,
                border: '1px solid rgba(52,211,153,0.2)',
                background: 'rgba(52,211,153,0.04)',
                padding: 32,
              }}
            >
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2 }}>
                Payouts
              </div>
              <div style={{ fontSize: 52, fontWeight: 700, color: '#34d399', marginTop: 8 }}>
                {fmtMoney(totalPayout)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#34d399',
              }}
            />
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
              pipmind-sigma.vercel.app/profile/{code}
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.3)',
              background: 'linear-gradient(120deg, rgba(167,139,250,0.15), rgba(34,211,238,0.1))',
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            PropJournal — AI Trading Journal
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
