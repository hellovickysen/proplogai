"use client";

import { useState, useRef, useCallback } from 'react';

const W = 800;
const H = 300;
const PAD = { top: 24, right: 20, bottom: 40, left: 60 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function fmtVal(v) {
  const sign = v >= 0 ? '+' : '-';
  return sign + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtYLabel(v) {
  if (v === 0) return '$0';
  const sign = v < 0 ? '-' : '';
  const abs = Math.abs(v);
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + abs.toFixed(0);
}

function niceStep(range, targetTicks) {
  const raw = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const residual = raw / mag;
  let nice;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3) nice = 2;
  else if (residual <= 7) nice = 5;
  else nice = 10;
  return nice * mag;
}

function yTicks(min, max) {
  const range = max - min || 1;
  const step = niceStep(range, 5);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step * 0.01; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

/* ── Smooth cubic bezier path through points ── */
function smoothPath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) return 'M' + points[0][0] + ',' + points[0][1] + 'L' + points[1][0] + ',' + points[1][1];

  let d = 'M' + points[0][0].toFixed(1) + ',' + points[0][1].toFixed(1);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.3;
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

    d += ' C' + cp1x.toFixed(1) + ',' + cp1y.toFixed(1) + ' ' + cp2x.toFixed(1) + ',' + cp2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
  }
  return d;
}

export default function EquityChart({ data }) {
  const [mode, setMode] = useState('cumulative');
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-white/55">
        Log at least two trades to see your equity curve.
      </div>
    );
  }

  const values = data.map((d) => (mode === 'cumulative' ? d.cumulative : d.daily));
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  // Use nice ticks for Y axis
  const ticks = yTicks(minVal, maxVal);
  const tickMin = ticks[0];
  const tickMax = ticks[ticks.length - 1];
  const tickRange = tickMax - tickMin || 1;

  function scaleX(i) { return PAD.left + (i / (data.length - 1)) * CHART_W; }
  function scaleY(v) { return PAD.top + CHART_H * (1 - (v - tickMin) / tickRange); }

  const barWidth = Math.max(4, Math.min(40, (CHART_W / data.length) * 0.6));
  const zeroY = scaleY(0);

  // X-axis labels
  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  // Cumulative smooth curve
  const pts = data.map((d, i) => [scaleX(i), scaleY(d.cumulative)]);
  const curvePath = smoothPath(pts);

  // Area paths: close to zero line
  const areaAbove = curvePath + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + zeroY.toFixed(1) + ' L' + pts[0][0].toFixed(1) + ',' + zeroY.toFixed(1) + ' Z';

  // Hover handler
  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const relX = mouseX - PAD.left;
    const idx = Math.round((relX / CHART_W) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }, [data.length]);

  const hoverItem = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverVal = hoverItem ? (mode === 'cumulative' ? hoverItem.cumulative : hoverItem.daily) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-base font-semibold">P&L Performance</div>
        <div className="flex gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5">
          {[{ key: 'cumulative', label: 'Cumulative' }, { key: 'daily', label: 'Daily' }].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={'rounded-md px-3 py-1.5 text-xs font-semibold transition-all ' + (mode === m.key ? 'bg-white/[0.1] text-white' : 'text-white/40 hover:text-white/60')}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <svg
        ref={svgRef}
        viewBox={'0 0 ' + W + ' ' + H}
        className="h-[220px] sm:h-[300px] w-full select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          {/* Green gradient for above zero */}
          <linearGradient id="eqGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.5" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0.03" />
          </linearGradient>
          {/* Red gradient for below zero */}
          <linearGradient id="eqRed" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f87171" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f87171" stopOpacity="0.03" />
          </linearGradient>
          {/* Clip above zero */}
          <clipPath id="clipAbove">
            <rect x={PAD.left} y={PAD.top} width={CHART_W} height={Math.max(0, zeroY - PAD.top)} />
          </clipPath>
          {/* Clip below zero */}
          <clipPath id="clipBelow">
            <rect x={PAD.left} y={zeroY} width={CHART_W} height={Math.max(0, PAD.top + CHART_H - zeroY)} />
          </clipPath>
          {/* Line gradient */}
          <linearGradient id="eqLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {ticks.map((v, i) => {
          const y = scaleY(v);
          const isZero = v === 0;
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke={isZero ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? '6 4' : 'none'} />
              <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill={isZero ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'} fontSize="11" fontFamily="JetBrains Mono, monospace">
                {fmtYLabel(v)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {xLabels.map((d) => {
          const i = data.indexOf(d);
          return (
            <text key={d.date} x={scaleX(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="JetBrains Mono, monospace">
              {d.label}
            </text>
          );
        })}

        {/* ── Cumulative mode ── */}
        {mode === 'cumulative' && (
          <>
            {/* Green area above zero */}
            <path d={areaAbove} fill="url(#eqGreen)" clipPath="url(#clipAbove)" />
            {/* Red area below zero */}
            <path d={areaAbove} fill="url(#eqRed)" clipPath="url(#clipBelow)" />
            {/* Smooth line */}
            <path d={curvePath} fill="none" stroke="url(#eqLine)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* Dots */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={scaleX(i)}
                cy={scaleY(d.cumulative)}
                r={hoverIdx === i ? 5.5 : 3}
                fill={hoverIdx === i ? '#22d3ee' : '#34d399'}
                stroke={hoverIdx === i ? '#fff' : '#0b0b14'}
                strokeWidth={hoverIdx === i ? 2 : 1.5}
              />
            ))}
          </>
        )}

        {/* ── Daily mode ── */}
        {mode === 'daily' && (
          <>
            {data.map((d, i) => {
              const x = scaleX(i) - barWidth / 2;
              const isPos = d.daily >= 0;
              const barY = isPos ? scaleY(d.daily) : zeroY;
              const barH = Math.abs(scaleY(d.daily) - zeroY);
              const isHovered = hoverIdx === i;
              return (
                <rect
                  key={i}
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={Math.max(1, barH)}
                  rx={3}
                  fill={isPos ? (isHovered ? '#34d399' : 'rgba(52,211,153,0.7)') : (isHovered ? '#f87171' : 'rgba(248,113,113,0.7)')}
                />
              );
            })}
          </>
        )}

        {/* ── Hover crosshair + tooltip ── */}
        {hoverIdx !== null && hoverItem && (
          <>
            <line
              x1={scaleX(hoverIdx)}
              y1={PAD.top}
              x2={scaleX(hoverIdx)}
              y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {(() => {
              const tx = scaleX(hoverIdx);
              const tooltipW = 150;
              const tooltipH = 48;
              const tooltipX = tx + tooltipW + 10 > W ? tx - tooltipW - 10 : tx + 10;
              const tooltipY = PAD.top + 4;
              return (
                <g>
                  <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx={8} fill="#12121a" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <text x={tooltipX + 14} y={tooltipY + 19} fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="JetBrains Mono, monospace">
                    {hoverItem.label}
                  </text>
                  <text x={tooltipX + 14} y={tooltipY + 38} fill={hoverVal >= 0 ? '#34d399' : '#f87171'} fontSize="14" fontWeight="bold" fontFamily="Poppins, sans-serif">
                    {fmtVal(hoverVal)}
                  </text>
                </g>
              );
            })()}
          </>
        )}
      </svg>
    </div>
  );
}
