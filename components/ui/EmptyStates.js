/**
 * Animated empty state illustrations for PropLogAI pages.
 * Pure CSS animations — zero dependencies, GPU-accelerated.
 */

const styles = `
@keyframes emFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
@keyframes emSparkle { 0%,100%{opacity:.3;transform:scale(.6) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(45deg)} }
@keyframes emWalletFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes emFlapOpen { 0%,100%{transform:rotateX(0deg)} 40%,60%{transform:rotateX(-30deg)} }
@keyframes emCoinFloat { 0%,100%{transform:translateY(0) scale(1);opacity:.6} 50%{transform:translateY(-12px) scale(1.1);opacity:1} }
@keyframes emTrophyGlow { 0%,100%{transform:translateY(0);box-shadow:0 0 0 rgba(251,191,36,0)} 50%{transform:translateY(-5px);box-shadow:0 8px 24px rgba(251,191,36,.15)} }
@keyframes emStarPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.3);opacity:1} }
@keyframes emGlowPulse { 0%,100%{transform:scale(.8);opacity:.3} 50%{transform:scale(1.2);opacity:.8} }
@keyframes emNodePulse { 0%,100%{transform:scale(1);box-shadow:0 0 0 rgba(139,92,246,0)} 50%{transform:scale(1.1);box-shadow:0 0 20px rgba(139,92,246,.2)} }
@keyframes emOrbit1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-4px,-6px)} }
@keyframes emOrbit2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4px,-6px)} }
@keyframes emOrbit3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(2px,6px)} }
@keyframes emLinePulse { 0%,100%{opacity:.2} 50%{opacity:.6} }
`;

function InjectStyles() {
  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
}

export function PlaybookEmptyIcon() {
  return (
    <>
      <InjectStyles />
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
        <div style={{ width: 60, height: 70, background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(34,211,238,0.15))', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px 12px 12px 4px', position: 'absolute', left: 10, top: 5, animation: 'emFloat 3s ease-in-out infinite' }}>
          {[22, 30, 38, 46].map((t, i) => (
            <div key={i} style={{ position: 'absolute', width: [35, 25, 32, 20][i], height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)', left: 12, top: t }} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: 10, top: 5, width: 6, height: 70, background: 'linear-gradient(180deg, #a78bfa, #22d3ee)', borderRadius: '4px 0 0 4px' }} />
        <div style={{ position: 'absolute', right: 2, top: 0, width: 16, height: 16, animation: 'emSparkle 2s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', width: 2, height: 12, left: 7, top: 2, background: '#a78bfa', borderRadius: 1 }} />
          <div style={{ position: 'absolute', width: 12, height: 2, left: 2, top: 7, background: '#a78bfa', borderRadius: 1 }} />
        </div>
      </div>
    </>
  );
}

export function ExpensesEmptyIcon() {
  return (
    <>
      <InjectStyles />
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
        <div style={{ width: 56, height: 44, background: 'linear-gradient(135deg, rgba(248,113,113,0.2), rgba(251,191,36,0.15))', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, position: 'absolute', left: 12, bottom: 10, animation: 'emWalletFloat 3.5s ease-in-out infinite' }}>
          <div style={{ position: 'absolute', top: -6, left: 8, right: 8, height: 14, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px 8px 0 0', animation: 'emFlapOpen 3.5s ease-in-out infinite', transformOrigin: 'bottom' }} />
        </div>
        {[[16, 0, 4], [12, -6, 24], [10, null, 12]].map(([s, r, t], i) => (
          <div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', border: '2px solid rgba(251,191,36,0.6)', background: 'rgba(251,191,36,0.15)', ...(r !== null ? { right: r } : { left: -4 }), top: t, animation: `emCoinFloat ${[2.5, 3, 2.8][i]}s ease-in-out ${[0, 0.3, 0.6][i]}s infinite` }} />
        ))}
      </div>
    </>
  );
}

export function TrophyEmptyIcon() {
  return (
    <>
      <InjectStyles />
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: 15, top: 8, width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', animation: 'emGlowPulse 3s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', left: 18, top: 12, width: 44, height: 36, background: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15))', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '4px 4px 20px 20px', animation: 'emTrophyGlow 3s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', left: 34, top: 48, width: 12, height: 12, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.2)' }} />
        <div style={{ position: 'absolute', left: 24, top: 58, width: 32, height: 6, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: 10, top: 16, width: 10, height: 20, border: '2px solid rgba(251,191,36,0.25)', borderRight: 'none', borderRadius: '10px 0 0 10px' }} />
        <div style={{ position: 'absolute', right: 10, top: 16, width: 10, height: 20, border: '2px solid rgba(251,191,36,0.25)', borderLeft: 'none', borderRadius: '0 10px 10px 0' }} />
        <div style={{ position: 'absolute', left: 32, top: 22, color: 'rgba(251,191,36,0.8)', fontSize: 14, animation: 'emStarPulse 2s ease-in-out infinite' }}>&#9733;</div>
      </div>
    </>
  );
}

export function ReferralEmptyIcon() {
  return (
    <>
      <InjectStyles />
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
        {[[16, 22, 20, -20], [52, 28, 18, 20], [28, 52, 16, 60]].map(([l, t, w, r], i) => (
          <div key={i} style={{ position: 'absolute', left: l, top: t, width: w, height: 1, background: 'linear-gradient(90deg, rgba(139,92,246,0.3), rgba(34,211,238,0.15))', transformOrigin: 'left center', transform: `rotate(${r}deg)`, animation: `emLinePulse 4s ease-in-out ${i * 0.5}s infinite` }} />
        ))}
        <div style={{ position: 'absolute', width: 32, height: 32, left: 24, top: 24, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(34,211,238,0.2))', border: '2px solid rgba(139,92,246,0.5)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, animation: 'emNodePulse 3s ease-in-out infinite', zIndex: 1 }}>You</div>
        {[['rgba(52,211,153,0.15)', 'rgba(52,211,153,0.3)', 22, 0, 8, 'emOrbit1', 0],
          ['rgba(34,211,238,0.15)', 'rgba(34,211,238,0.3)', 22, null, 8, 'emOrbit2', 0.5],
          ['rgba(251,191,36,0.15)', 'rgba(251,191,36,0.3)', 18, 10, null, 'emOrbit3', 1]].map(([bg, bc, s, l, t, anim, d], i) => (
          <div key={i} style={{ position: 'absolute', width: s, height: s, borderRadius: '50%', background: bg, border: `2px solid ${bc}`, ...(l !== null ? { left: l } : { right: 0 }), ...(t !== null ? { top: t } : { bottom: 4 }), animation: `${anim} 4s ease-in-out ${d}s infinite` }} />
        ))}
      </div>
    </>
  );
}
