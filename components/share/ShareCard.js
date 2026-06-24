"use client";

import { forwardRef } from 'react';

function fmtMoney(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtMoneyShort(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + abs.toFixed(0);
}

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

/**
 * ShareCard renders the branded P&L card.
 * type: "daily" | "trade"
 * ratio: "9:16" | "16:9"
 *
 * Design: Dark card with dramatic glow, large P&L, stats row, motivational quote.
 * IMPORTANT: Only uses CSS properties that html2canvas supports.
 * - No background-clip: text (renders invisible)
 * - No emojis in rendered text (garbled by html2canvas)
 */
const ShareCard = forwardRef(function ShareCard({ type, ratio, data, quote }, ref) {
  const pnl = Number(data.pnl) || 0;
  const isWin = pnl >= 0;
  const isStory = ratio === '9:16';

  const w = isStory ? 360 : 640;
  const h = isStory ? 640 : 360;

  // Colors
  const accentColor = isWin ? '#34d399' : '#f87171';
  const accentColorDim = isWin ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';
  const accentGlow = isWin ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.35)';
  const secondaryGlow = isWin ? 'rgba(34,211,238,0.25)' : 'rgba(251,191,36,0.2)';
  const accentGradient = isWin
    ? 'linear-gradient(120deg, #34d399, #22d3ee)'
    : 'linear-gradient(120deg, #f87171, #fbbf24)';

  // Strip emoji from quote for html2canvas compatibility
  const cleanQuote = quote ? quote.replace(/[\u{1F600}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2702}-\u{27B0}\u{FE0E}]/gu, '').trim() : '';

  return (
    <div
      ref={ref}
      style={{
        width: w,
        height: h,
        background: '#07070b',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-25%', left: '-15%', width: '65%', height: '65%', borderRadius: '50%', background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '55%', height: '55%', borderRadius: '50%', background: `radial-gradient(circle, ${secondaryGlow} 0%, transparent 70%)`, filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', top: '35%', left: '40%', width: '30%', height: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {/* Top accent bar */}
      <div style={{ height: 3, width: '100%', background: accentGradient, flexShrink: 0 }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isStory ? '28px 32px 24px' : '20px 32px 18px',
      }}>
        {/* Header: Logo + date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'linear-gradient(120deg,#a78bfa,#22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#08080f', fontWeight: 800,
              boxShadow: '0 0 14px rgba(139,92,246,0.5)',
            }}>◆</div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>PropJournal</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' }}>
            {fmtDate(data.date || data.trade_date)}
          </span>
        </div>

        {/* Center: P&L hero */}
        <div style={{
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: isStory ? 12 : 6,
        }}>
          {/* Type label */}
          <div style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {type === 'daily' ? "Today's P&L" : (data.pair || 'Trade') + ' ' + ((data.direction || '').toUpperCase())}
          </div>

          {/* P&L amount — solid color, NOT background-clip:text */}
          <div style={{
            fontSize: isStory ? 64 : 52,
            fontWeight: 800,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            textShadow: `0 0 40px ${accentGlow}`,
          }}>
            {fmtMoney(data.pnl)}
          </div>

          {/* Win/loss indicator bar */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginTop: isStory ? 4 : 2,
          }}>
            <div style={{
              width: isStory ? 80 : 60, height: 3, borderRadius: 2,
              background: accentGradient,
              boxShadow: `0 0 12px ${accentGlow}`,
            }} />
          </div>

          {/* Quote */}
          {cleanQuote && (
            <div style={{
              fontSize: isStory ? 16 : 13,
              color: 'rgba(255,255,255,0.45)',
              fontWeight: 500,
              fontStyle: 'italic',
              marginTop: isStory ? 8 : 4,
              padding: '0 12px',
              lineHeight: 1.4,
            }}>
              "{cleanQuote}"
            </div>
          )}
        </div>

        {/* Stats row */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: isStory ? 6 : 6, flexWrap: 'wrap',
            marginBottom: isStory ? 16 : 10,
          }}>
            {type === 'daily' ? (
              <>
                {data.trades != null && <StatChip label="Trades" value={String(data.trades)} isStory={isStory} />}
                {data.winRate != null && <StatChip label="Win Rate" value={data.winRate + '%'} isStory={isStory} />}
                {data.bestTrade != null && <StatChip label="Best" value={fmtMoneyShort(data.bestTrade)} accent isStory={isStory} />}
                {data.avgR != null && <StatChip label="Avg R" value={(data.avgR >= 0 ? '+' : '') + data.avgR.toFixed(1) + 'R'} isStory={isStory} />}
              </>
            ) : (
              <>
                {data.entry_price != null && <StatChip label="Entry" value={String(data.entry_price)} isStory={isStory} />}
                {data.exit_price != null && <StatChip label="Exit" value={String(data.exit_price)} isStory={isStory} />}
                {data.session && <StatChip label="Session" value={data.session} isStory={isStory} />}
                {data.r_multiple != null && <StatChip label="R" value={(data.r_multiple >= 0 ? '+' : '') + Number(data.r_multiple).toFixed(1) + 'R'} isStory={isStory} />}
              </>
            )}
          </div>

          {/* Watermark */}
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 9, color: 'rgba(255,255,255,0.18)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
            }}>
              propjournal.app — AI Trading Journal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

function StatChip({ label, value, accent, isStory }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: isStory ? '8px 14px' : '6px 12px',
      textAlign: 'center',
      minWidth: isStory ? 68 : 60,
    }}>
      <div style={{
        fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em',
        color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontSize: isStory ? 14 : 12, fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: accent ? '#34d399' : '#fff',
      }}>{value}</div>
    </div>
  );
}

export default ShareCard;
