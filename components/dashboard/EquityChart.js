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

/* ── Smooth cubic bezier path (Catmull-Rom spline) ── */
function smoothPath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) return 'M' + points[0][0] + ',' + points[0][1] + 'L' + points[1][0] + ',' + points[1][1];

  let d = 'M' + points[0][0].toFixed(1) + ',' + points[0][1].toFixed(1);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.35;
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

  const ticks = yTicks(minVal, maxVal);
  const tickMin = ticks[0];
  const tickMax = ticks[ticks.length - 1];
  const tickRange = tickMax - tickMin || 1;

  function scaleX(i) { return PAD.left + (i / (data.length - 1)) * CHART_W; }
  function scaleY(v) { return PAD.top + CHART_H * (1 - (v - tickMin) / tickRange); }

  const barWidth = Math.max(4, Math.min(40, (CHART_W / data.length) * 0.6));
  const zeroY = scaleY(0);

  const labelStep = Math.max(1, Math.ceil(data.length / 6));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  const pts = data.map((d, i) => [scaleX(i), scaleY(d.cumulative)]);
  const curvePath = smoothPath(pts);

  const areaAbove = curvePath + ' L' + pts[pts.length - 1][0].toFixed(1) + ',' + zeroY.toFixed(1) + ' L' + pts[0][0].toFixed(1) + ',' + zeroY.toFixed(1) + ' Z';

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const relX = mouseX - PAD.left;
    const idx = Math.round((relX / CHART_W) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }, [data.length]);

  /* Touch support for mobile */
  const handleTouchMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg || !e.touches[0]) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * W;
    const relX = mouseX - PAD.left;
    const idx = Math.round((relX / CHART_W) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }, [data.length]);

  const hoverItem = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverVal = hoverItem ? (mode === 'cumulative' ? hoverItem.cumulative : hoverItem.daily) : 0;

  return (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 truncate font-display text-base font-semibold">P&amp;L Performance</div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5">
          {[{ key: 'cumulative', label: 'Cumulative' }, { key: 'daily', label: 'Daily' }].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={'rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-xs ' + (mode === m.key ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/40 hover:text-white/60')}
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
        className="h-[220px] w-full select-none sm:h-[300px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          {/* ── Area gradients ── */}
          <linearGradient id="eqAreaGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="0.4" stopColor="#22d3ee" stopOpacity="0.15" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="eqAreaRed" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f87171" stopOpacity="0.30" />
            <stop offset="0.5" stopColor="#f87171" stopOpacity="0.08" />
            <stop offset="1" stopColor="#f87171" stopOpacity="0.01" />
          </linearGradient>

          {/* ── Line gradient (emerald → cyan) ── */}
          <linearGradient id="eqLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#34d399" />
            <stop offset="0.5" stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>

          {/* ── Glow filter for the curve line ── */}
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>

          {/* ── Glow filter for hover dot ── */}
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>

          {/* ── Bar gradients ── */}
          <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="barRed" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f87171" stopOpacity="0.9" />
            <stop offset="1" stopColor="#f87171" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="barGreenHover" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity="1" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="barRedHover" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f87171" stopOpacity="1" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0.5" />
          </linearGradient>

          {/* ── Clip regions ── */}
          <clipPath id="clipAbove">
            <rect x={PAD.left} y={PAD.top} width={CHART_W} height={Math.max(0, zeroY - PAD.top)} />
          </clipPath>
          <clipPath id="clipBelow">
            <rect x={PAD.left} y={zeroY} width={CHART_W} height={Math.max(0, PAD.top + CHART_H - zeroY)} />
          </clipPath>
        </defs>

        {/* ── Grid lines + Y labels ── */}
        {ticks.map((v, i) => {
          const y = scaleY(v);
          const isZero = v === 0;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke={isZero ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}
                strokeWidth={isZero ? 1 : 0.5}
              />
              <text
                x={PAD.left - 8} y={y + 4}
                textAnchor="end"
                fill={isZero ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)'}
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtYLabel(v)}
              </text>
            </g>
          );
        })}

        {/* ── X labels ── */}
        {xLabels.map((d) => {
          const i = data.indexOf(d);
          return (
            <text
              key={d.date} x={scaleX(i)} y={H - 6}
              textAnchor="middle"
              fill="rgba(255,255,255,0.25)"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {d.label}
            </text>
          );
        })}

        {/* ── Cumulative mode ── */}
        {mode === 'cumulative' && (
          <>
            {/* Green area above zero */}
            <path d={areaAbove} fill="url(#eqAreaGreen)" clipPath="url(#clipAbove)" />
            {/* Red area below zero */}
            <path d={areaAbove} fill="url(#eqAreaRed)" clipPath="url(#clipBelow)" />

            {/* Glow layer beneath the line */}
            <path
              d={curvePath}
              fill="none"
              stroke="url(#eqLineGrad)"
              strokeWidth="5"
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#lineGlow)"
              opacity="0.4"
            />

            {/* Main curve line */}
            <path
              d={curvePath}
              fill="none"
              stroke="url(#eqLineGrad)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Hover dot only — no always-visible dots */}
            {hoverIdx !== null && hoverItem && (
              <>
                {/* Outer glow ring */}
                <circle
                  cx={scaleX(hoverIdx)}
                  cy={scaleY(hoverItem.cumulative)}
                  r="10"
                  fill={hoverVal >= 0 ? '#34d399' : '#f87171'}
                  opacity="0.2"
                  filter="url(#dotGlow)"
                />
                {/* Bright dot */}
                <circle
                  cx={scaleX(hoverIdx)}
                  cy={scaleY(hoverItem.cumulative)}
                  r="5"
                  fill={hoverVal >= 0 ? '#34d399' : '#f87171'}
                  stroke="#0b0b14"
                  strokeWidth="2"
                />
                {/* Inner white core */}
                <circle
                  cx={scaleX(hoverIdx)}
                  cy={scaleY(hoverItem.cumulative)}
                  r="2"
                  fill="#fff"
                />
              </>
            )}
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
                <g key={i}>
                  {/* Bar glow on hover */}
                  {isHovered && (
                    <rect
                      x={x - 2}
                      y={barY - 2}
                      width={barWidth + 4}
                      height={Math.max(1, barH) + 4}
                      rx={5}
                      fill={isPos ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}
                    />
                  )}
                  <rect
                    x={x}
                    y={barY}
                    width={barWidth}
                    height={Math.max(1, barH)}
                    rx={3}
                    fill={isPos
                      ? (isHovered ? 'url(#barGreenHover)' : 'url(#barGreen)')
                      : (isHovered ? 'url(#barRedHover)' : 'url(#barRed)')
                    }
                  />
                </g>
              );
            })}
          </>
        )}

        {/* ── Hover crosshair + tooltip ── */}
        {hoverIdx !== null && hoverItem && (
          <>
            {/* Vertical reference line */}
            <line
              x1={scaleX(hoverIdx)}
              y1={PAD.top}
              x2={scaleX(hoverIdx)}
              y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            {/* Glassmorphic tooltip */}
            {(() => {
              const tx = scaleX(hoverIdx);
              const tooltipW = 148;
              const tooltipH = 56;
              const tooltipX = tx + tooltipW + 14 > W ? tx - tooltipW - 14 : tx + 14;
              const tooltipY = PAD.top + 8;
              const isPositive = hoverVal >= 0;
              return (
                <g>
                  {/* Tooltip background with border */}
                  <rect
                    x={tooltipX} y={tooltipY}
                    width={tooltipW} height={tooltipH}
                    rx={10}
                    fill="rgba(12, 12, 22, 0.85)"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                  {/* Accent bar on left edge */}
                  <rect
                    x={tooltipX} y={tooltipY}
                    width={3} height={tooltipH}
                    rx={1.5}
                    fill={isPositive ? '#34d399' : '#f87171'}
                  />
                  {/* Date label */}
                  <text
                    x={tooltipX + 14} y={tooltipY + 20}
                    fill="rgba(255,255,255,0.45)"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.5"
                  >
                    {hoverItem.label}
                  </text>
                  {/* P&L value */}
                  <text
                    x={tooltipX + 14} y={tooltipY + 42}
                    fill={isPositive ? '#34d399' : '#f87171'}
                    fontSize="16"
                    fontWeight="700"
                    fontFamily="Poppins, sans-serif"
                  >
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
