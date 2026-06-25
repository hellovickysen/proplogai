"use client";

import { forwardRef } from 'react';

// Open Journal mark (raster PNG so html2canvas captures it reliably)
const LOGO_MARK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAACtUlEQVR4nO3Zv2sTYRgH8O/zps09V5K+qbYKtYugYl0Eg61SXETcFaWIk4OCFP8CRZwFBRUXdwcnNycROvijhYAOijrpUERbWmKVXK7JPQ4K1utV7CW5t7XPB7LkTZ583+8lOZIDlFJKKaWUUkptPjnXAdLpL/p+fiKXy4/n82wbjfob14kyNFBgtu+ZrSy73Us7zbQzWhaYw3EAu2N3ny8UCtvSzNtoBRgiXEpaCMPu7akGtpYnW75fui2C/QlLc2G48DbNzA1TAHPpmohMrFyRzwCdArCUeaiseJ69GPvSE2ZbZ+47C4Bc5+so3y+dYLaN2Oabvm9Pu87Wccz2KLMN4kff83oTvwj/K55njzPbxYS3/mXX2TrNMPdeZbbN+OZ9v3TLdbiOKhaLW5nto4SjLsz2PtbZWctr5zDf7x1hth9X2fwDAN2dyJL6FMJsPwGYAfBYxDyt12kSmP+actYFAHcA5GNLDSJcqdWq1wHI77sHe3y/dgCIxkRwDMBwEFSH0rx2KwXMAuhfHhbAK6ypkCGfefEugHMJi18AnAmC6pOEDR/Bn0d9LgiqA2n20c4C4v5aiOcV9xDlHgKyL+G5k8bQTREZXmXDceuygLhlhdAzIrkBYFfsMQLgA4BBrO1znbqArjRPSqkLQBlAmUhWewwB2JlZIqyz04oLWoDrAK5pAa4DuKYFuA7gmhbgOoBrWoDrAK5t+gJa+DFkThJFh6MIh4gwAmBH21L9mxkRTBuDFyLmedohbbuo0NPTP9hsNstEUiZCWUTGAPS1afx3gF4SoSKCShSZShjOv27H4E5eVcnl81v2GhP9KgRlQA5i5d9ecU2A3gE/N2sMVWq1hWkAYSdCZnxZaaDAvFQmktEowigRRgFABFPGYEqEpoKguwLMfss2l1JKKaWUUkoppZTaTH/eK6MSpCDdTAAAAAElFTkSuQmCC';

function fmtMoney(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  return sign + '$' + abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtPnlCard(v, isStory) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? '+' : '-';
  const abs = Math.abs(n);
  if (isStory && abs >= 10000) return { prefix: sign + '$', whole: (abs / 1000).toFixed(1) + 'K', decimal: '' };
  if (abs >= 100000) return { prefix: sign + '$', whole: (abs / 1000).toFixed(1) + 'K', decimal: '' };
  const wholeNum = Math.floor(abs);
  const dec = Math.round((abs - wholeNum) * 100).toString().padStart(2, '0');
  return { prefix: sign + '$', whole: wholeNum.toLocaleString('en-US'), decimal: '.' + dec };
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

const ShareCard = forwardRef(function ShareCard({ type, ratio, data, quote }, ref) {
  const pnl = Number(data.pnl) || 0;
  const isWin = pnl >= 0;
  const isStory = ratio === '9:16';

  const w = isStory ? 360 : 640;
  const h = isStory ? 640 : 360;

  const accentColor = isWin ? '#34d399' : '#f87171';
  const accentGlow = isWin ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.35)';
  const secondaryGlow = isWin ? 'rgba(34,211,238,0.25)' : 'rgba(251,191,36,0.2)';
  const accentGradient = isWin
    ? 'linear-gradient(120deg, #34d399, #22d3ee)'
    : 'linear-gradient(120deg, #f87171, #fbbf24)';

  const cleanQuote = quote ? quote.replace(/[\u{1F600}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F1E0}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2702}-\u{27B0}\u{FE0E}]/gu, '').trim() : '';

  const pnlParts = fmtPnlCard(data.pnl, isStory);
  const pnlLen = (pnlParts.prefix + pnlParts.whole + pnlParts.decimal).length;
  const baseFontSize = isStory ? 48 : 52;
  const pnlFontSize = pnlLen > 12 ? baseFontSize - 14 : pnlLen > 9 ? baseFontSize - 6 : baseFontSize;

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
      <div style={{ position: 'absolute', top: '-25%', left: '-15%', width: '65%', height: '65%', borderRadius: '50%', background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`, filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '55%', height: '55%', borderRadius: '50%', background: `radial-gradient(circle, ${secondaryGlow} 0%, transparent 70%)`, filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', top: '35%', left: '40%', width: '30%', height: '30%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div style={{ height: 3, width: '100%', background: accentGradient, flexShrink: 0 }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isStory ? '28px 28px 24px' : '20px 32px 18px',
      }}>
        {/* ── Logo row (explicit heights — html2canvas doesn't reliably handle flex centering) ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(120deg,#a78bfa,#22d3ee)',
              position: 'relative',
              flexShrink: 0,
              boxShadow: '0 0 14px rgba(139,92,246,0.5)',
            }}>
              <img src={LOGO_MARK} width={16} height={16} alt="" style={{ display: 'block', position: 'absolute', top: 6, left: 6 }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '30px', height: 30 }}>PropLogAI</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em', lineHeight: '30px', height: 30 }}>
            {fmtDate(data.date || data.trade_date)}
          </span>
        </div>

        <div style={{
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: isStory ? 12 : 6,
        }}>
          <div style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {type === 'daily' ? "Today's P&L" : (data.pair || 'Trade') + ' ' + ((data.direction || '').toUpperCase())}
          </div>

          <div style={{
            fontWeight: 800,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            color: accentColor,
            lineHeight: 1.15,
            textShadow: `0 0 40px ${accentGlow}`,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: pnlFontSize, letterSpacing: '-0.02em' }}>{pnlParts.prefix}</span>
            <span style={{ width: isStory ? 2 : 3, flexShrink: 0 }} />
            <span style={{ fontSize: pnlFontSize, letterSpacing: '-0.02em' }}>{pnlParts.whole}</span>
            {pnlParts.decimal && (
              <span style={{ fontSize: Math.round(pnlFontSize * 0.7), letterSpacing: '-0.01em', opacity: 0.85 }}>{pnlParts.decimal}</span>
            )}
          </div>

          {cleanQuote && (
            <div style={{
              fontSize: isStory ? 15 : 13,
              color: 'rgba(255,255,255,0.65)',
              fontWeight: 500,
              fontStyle: 'italic',
              marginTop: isStory ? 10 : 6,
              padding: '0 16px',
              lineHeight: 1.5,
              letterSpacing: '0.03em',
              wordSpacing: '0.12em',
            }}>
              &ldquo;{cleanQuote}&rdquo;
            </div>
          )}
        </div>

        <div>
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'stretch',
            gap: isStory ? 8 : 10, flexWrap: 'nowrap',
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

          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 10, color: 'rgba(255,255,255,0.65)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
            }}>
              proplogai.com &mdash; AI Trading Journal
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
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      padding: isStory ? '10px 12px' : '8px 16px',
      textAlign: 'center',
      minWidth: isStory ? 80 : 80,
      flex: '1 1 0',
      maxWidth: isStory ? 110 : 140,
    }}>
      <div style={{
        fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em',
        color: 'rgba(255,255,255,0.65)', fontFamily: "'JetBrains Mono', monospace",
        marginBottom: 4,
        whiteSpace: 'nowrap',
      }}>{label}</div>
      <div style={{
        fontSize: isStory ? 14 : 14, fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        color: accent ? '#34d399' : '#ffffff',
        whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  );
}

export default ShareCard;
