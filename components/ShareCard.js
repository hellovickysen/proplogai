"use client";

import { forwardRef } from 'react';

function fmtMoney(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

/** Win background: dramatic violet/cyan radial glows */
const winBg = {
  background: '#07070b',
  position: 'relative',
  overflow: 'hidden',
};
const winGlow1 = { position: 'absolute', top: '-30%', left: '-20%', width: '70%', height: '70%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)', filter: 'blur(60px)' };
const winGlow2 = { position: 'absolute', bottom: '-20%', right: '-15%', width: '60%', height: '60%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%)', filter: 'blur(50px)' };
const winGlow3 = { position: 'absolute', top: '40%', left: '50%', width: '40%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 70%)', filter: 'blur(40px)' };

/** Loss background: deep navy with warm amber accents */
const lossBg = {
  background: '#07070b',
  position: 'relative',
  overflow: 'hidden',
};
const lossGlow1 = { position: 'absolute', top: '-25%', right: '-15%', width: '65%', height: '65%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', filter: 'blur(60px)' };
const lossGlow2 = { position: 'absolute', bottom: '-20%', left: '-10%', width: '55%', height: '55%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)', filter: 'blur(50px)' };

/**
 * ShareCard renders the branded P&L card.
 * type: "daily" | "trade"
 * ratio: "9:16" | "16:9"
 */
const ShareCard = forwardRef(function ShareCard({ type, ratio, data, quote }, ref) {
  const isWin = (data.pnl || 0) >= 0;
  const isStory = ratio === '9:16';

  // Dimensions for rendering (scaled down for preview, full-size for export)
  const w = isStory ? 360 : 640;
  const h = isStory ? 640 : 360;

  const bg = isWin ? winBg : lossBg;
  const glows = isWin
    ? [winGlow1, winGlow2, winGlow3]
    : [lossGlow1, lossGlow2];

  return (
    <div
      ref={ref}
      style={{ ...bg, width: w, height: h, fontFamily: "'Space Grotesk', 'Inter', sans-serif", color: '#fff' }}
      className="flex flex-col"
    >
      {/* Glow layers */}
      {glows.map((g, i) => <div key={i} style={g} />)}

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-8" style={{ padding: isStory ? 32 : 28 }}>
        {/* Top: Logo + date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', display: 'grid', placeItems: 'center', fontSize: 14, boxShadow: '0 0 16px rgba(139,92,246,0.5)' }}>◆</div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>PipMind</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
            {fmtDate(data.date || data.trade_date)}
          </span>
        </div>

        {/* Middle: Big P&L number */}
        <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 16 : 8 }}>
          {/* Type label */}
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
            {type === 'daily' ? "Today's P&L" : (data.pair || 'Trade') + ' ' + ((data.direction || '').toUpperCase())}
          </div>

          {/* P&L */}
          <div style={{
            fontSize: isStory ? 56 : 48,
            fontWeight: 700,
            background: isWin ? 'linear-gradient(120deg,#34d399,#22d3ee)' : 'linear-gradient(120deg,#f87171,#fbbf24)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            lineHeight: 1.1,
          }}>
            {fmtMoney(data.pnl)}
          </div>

          {/* Quote */}
          {quote && (
            <div style={{ fontSize: isStory ? 18 : 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginTop: 4 }}>
              {quote}
            </div>
          )}
        </div>

        {/* Bottom: Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: isStory ? 24 : 20, flexWrap: 'wrap' }}>
          {type === 'daily' ? (
            <>
              {data.trades != null && (
                <StatPill label="Trades" value={data.trades} />
              )}
              {data.winRate != null && (
                <StatPill label="Win Rate" value={data.winRate + '%'} />
              )}
              {data.bestTrade != null && (
                <StatPill label="Best" value={fmtMoney(data.bestTrade)} positive />
              )}
              {data.worstTrade != null && (
                <StatPill label="Worst" value={fmtMoney(data.worstTrade)} />
              )}
            </>
          ) : (
            <>
              {data.entry_price != null && <StatPill label="Entry" value={data.entry_price} />}
              {data.exit_price != null && <StatPill label="Exit" value={data.exit_price} />}
              {data.setup && <StatPill label="Setup" value={data.setup} />}
              {data.session && <StatPill label="Session" value={data.session} />}
            </>
          )}
        </div>

        {/* Watermark */}
        <div style={{ textAlign: 'center', marginTop: isStory ? 20 : 12 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
            pipmind.app · AI Trading Journal
          </span>
        </div>
      </div>
    </div>
  );
});

function StatPill({ label, value, positive }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}

export default ShareCard;
