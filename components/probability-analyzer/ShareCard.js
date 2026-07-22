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
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Prop Challenge Analysis', W / 2, 80);

    // Probability circle
    const cx = W / 2, cy = 320, r = 140;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 12;
    ctx.stroke();

    const pct = report.overallProbability / 100;
    const color = pct >= 0.65 ? '#34d399' : pct >= 0.4 ? '#fbbf24' : '#f87171';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText(`${report.overallProbability}%`, cx, cy + 10);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Pass Probability', cx, cy + 50);

    // Best challenge
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Best Match: ${report.bestChallenge.name}`, cx, 530);

    // Stars
    const stars = '★'.repeat(report.bestChallenge.rating) + '☆'.repeat(5 - report.bestChallenge.rating);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(stars, cx, 575);

    // Expected days
    if (report.expectedDays.length > 0) {
      ctx.font = '22px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(
        `~${report.expectedDays[0].days} Trading Days to Pass`,
        cx, 630,
      );
    }

    // Challenge suitability
    const startY = 700;
    report.challengeSuitability.forEach((cs, i) => {
      const y = startY + i * 50;
      ctx.font = '20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'left';
      ctx.fillText(cs.profileName, 200, y);
      ctx.textAlign = 'right';
      const c = cs.passRate >= 65 ? '#34d399' : cs.passRate >= 40 ? '#fbbf24' : '#f87171';
      ctx.fillStyle = c;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${cs.passRate}%`, W - 200, y);
    });

    // Logo / Branding
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px sans-serif';
    const brandGrad = ctx.createLinearGradient(cx - 80, 0, cx + 80, 0);
    brandGrad.addColorStop(0, '#a78bfa');
    brandGrad.addColorStop(1, '#22d3ee');
    ctx.fillStyle = brandGrad;
    ctx.fillText('PropLogAI', cx, H - 50);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('proplogai.com', cx, H - 25);

    // Trigger download
    const link = document.createElement('a');
    link.download = 'proplogai-challenge-analysis.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [report]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={generate}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        📥 Download Share Card
      </button>
    </>
  );
}
