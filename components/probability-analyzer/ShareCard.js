'use client';

import { useRef, useCallback } from 'react';

const W = 1080, H = 1080;

export default function ShareCard({ report }) {
  const canvasRef = useRef(null);

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#07070b';
    ctx.fillRect(0, 0, W, H);

    // Gradient accent bar
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#a78bfa');
    grad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 6);

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PROP CHALLENGE ANALYSIS', W / 2, 60);

    // Probability circle
    const cx = W / 2, cy = 260, r = 120;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 14;
    ctx.stroke();

    const pct = report.overallProbability / 100;
    const color = pct >= 0.65 ? '#34d399' : pct >= 0.4 ? '#fbbf24' : '#f87171';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText(`${report.overallProbability}%`, cx, cy + 10);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Pass Probability', cx, cy + 45);

    // Level badge
    const level = report.traderLevel;
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(level.level, cx, 430);

    // Personality
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${report.personality.emoji} ${report.personality.title}`, cx, 480);

    // Best challenge
    const stars = '★'.repeat(report.bestChallenge.rating) + '☆'.repeat(5 - report.bestChallenge.rating);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(stars, cx, 540);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Best: ${report.bestChallenge.name}`, cx, 575);

    // Badges
    const unlocked = report.badges.filter(b => b.unlocked);
    if (unlocked.length > 0) {
      ctx.font = '18px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      const badgeText = unlocked.map(b => `${b.emoji} ${b.title}`).slice(0, 4).join('  ');
      ctx.fillText(badgeText, cx, 640);
    }

    // Challenge suitability
    const startY = 700;
    report.challengeSuitability.forEach((cs, i) => {
      const y = startY + i * 50;
      ctx.font = '18px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.textAlign = 'left';
      ctx.fillText(cs.profileName, 220, y);
      ctx.textAlign = 'right';
      const c = cs.passRate >= 65 ? '#34d399' : cs.passRate >= 40 ? '#fbbf24' : '#f87171';
      ctx.fillStyle = c;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`${cs.passRate}%`, W - 220, y);
    });

    // Percentile
    ctx.textAlign = 'center';
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`Better than ${report.percentile}% of traders`, cx, 900);

    // Logo
    ctx.font = 'bold 26px sans-serif';
    const brandGrad = ctx.createLinearGradient(cx - 80, 0, cx + 80, 0);
    brandGrad.addColorStop(0, '#a78bfa');
    brandGrad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = brandGrad;
    ctx.fillText('PropLogAI', cx, H - 55);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText('proplogai.com/tools/probability-analyzer', cx, H - 30);

    // Download
    const link = document.createElement('a');
    link.download = 'proplogai-challenge-analysis.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [report]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button onClick={generate}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/[0.06] hover:text-white">
        📥 Download Share Card
      </button>
    </>
  );
}
