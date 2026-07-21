"use client";

import { useState, useRef, useCallback } from 'react';

const W = 800;
const H = 300;
const PAD = { top: 20, right: 0, bottom: 36, left: 0 };
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

function fmtFullDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
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

/* ── Smooth cubic bezier (Catmull-Rom, low tension for extra smoothness) ── */
function smoothPath(points) {
  const n = points.length;
  if (n < 2) return '';
  if (n === 2) return 'M' + points[0][0].toFixed(2) + ',' + points[0][1].toFixed(2) + 'L' + points[1][0].toFixed(2) + ',' + points[1][1].toFixed(2);

  let d = 'M' + points[0][0].toFixed(2) + ',' + points[0][1].toFixed(2);
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];

    const t = 0.25;
    const cp1x = p1[0] + (p2[0] - p0[0]) * t;
    const cp1y = p1[1] + (p2[1] - p0[1]) * t;
    const cp2x = p2[0] - (p3[0] - p1[0]) * t;
    const cp2y = p2[1] - (p3[1] - p1[1]) * t;

    d += ' C' + cp1x.toFixed(2) + ',' + cp1y.toFixed(2) + ' ' + cp2x.toFixed(2) + ',' + cp2y.toFixed(2) + ' ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2);
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

  const zeroY = scaleY(0);

  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  const vals = data.map((d) => (mode === 'cumulative' ? d.cumulative : d.daily));
  const pts = data.map((d, i) => [scaleX(i), scaleY(vals[i])]);
  const curvePath = smoothPath(pts);

  /* Area path: close to zero line */
  const areaPath = curvePath
    + ' L' + pts[pts.length - 1][0].toFixed(2) + ',' + zeroY.toFixed(2)
    + ' L' + pts[0][0].toFixed(2) + ',' + zeroY.toFixed(2) + ' Z';

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const relX = mouseX - PAD.left;
    const idx = Math.round((relX / CHART_W) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }, [data.length]);

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

  /* Y-axis label x position — overlaid near right edge */
  const yLabelX = W - 6;

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
        style={{ shapeRendering: 'geometricPrecision' }}
      >
        <defs>
          {/* Cyan area fill (above zero) */}
          <linearGradient id="eqAreaCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#22d3ee" stopOpacity="0.08" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0.01" />
          </linearGradient>
          {/* Red area fill (below zero) */}
          <linearGradient id="eqAreaRed" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#f87171" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#f87171" stopOpacity="0.08" />
            <stop offset="1" stopColor="#f87171" stopOpacity="0.01" />
          </linearGradient>
          {/* Clip above zero */}
          <clipPath id="clipAbove">
            <rect x="0" y={PAD.top} width={W} height={Math.max(0, zeroY - PAD.top)} />
          </clipPath>
          {/* Clip below zero */}
          <clipPath id="clipBelow">
            <rect x="0" y={zeroY} width={W} height={Math.max(0, PAD.top + CHART_H - zeroY)} />
          </clipPath>
        </defs>

        {/* ── Grid lines + Y labels (overlaid on right edge) ── */}
        {ticks.map((v, i) => {
          const y = scaleY(v);
          const isZero = v === 0;
          return (
            <g key={i}>
              <line
                x1={0} y1={y} x2={W} y2={y}
                stroke={isZero ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
                strokeWidth={isZero ? 1 : 0.5}
                strokeDasharray={isZero ? '4 3' : 'none'}
              />
              <text
                x={yLabelX} y={y - 5}
                textAnchor="end"
                fill={v > 0 ? 'rgba(34,211,238,0.5)' : v < 0 ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.3)'}
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
              key={d.date} x={scaleX(i)} y={H - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.25)"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {d.label}
            </text>
          );
        })}

        {/* ── Area fills ── */}
        <path d={areaPath} fill="url(#eqAreaCyan)" clipPath="url(#clipAbove)" />
        <path d={areaPath} fill="url(#eqAreaRed)" clipPath="url(#clipBelow)" />

        {/* ── Line: cyan above zero ── */}
        <g clipPath="url(#clipAbove)">
          <path
            d={curvePath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        {/* ── Line: red below zero ── */}
        <g clipPath="url(#clipBelow)">
          <path
            d={curvePath}
            fill="none"
            stroke="#f87171"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>

        {/* ── Hover crosshair + dot + tooltip ── */}
        {hoverIdx !== null && hoverItem && (() => {
          const hx = scaleX(hoverIdx);
          const val = mode === 'cumulative' ? hoverItem.cumulative : hoverItem.daily;
          const hy = scaleY(val);
          const isPositive = val >= 0;
          const dotColor = isPositive ? '#22d3ee' : '#f87171';

          const tooltipW = 170;
          const tooltipH = 62;
          const tooltipX = hx + tooltipW + 20 > W ? hx - tooltipW - 16 : hx + 16;
          const tooltipY = Math.max(PAD.top, Math.min(hy - tooltipH / 2, H - PAD.bottom - tooltipH));

          return (
            <>
              {/* Vertical dashed crosshair */}
              <line
                x1={hx} y1={PAD.top}
                x2={hx} y2={H - PAD.bottom}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
              {/* Horizontal dashed crosshair */}
              <line
                x1={0} y1={hy}
                x2={W} y2={hy}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="1"
                strokeDasharray="4 3"
              />

              {/* Hover dot */}
              <circle cx={hx} cy={hy} r="8" fill={isPositive ? 'rgba(34,211,238,0.12)' : 'rgba(248,113,113,0.12)'} />
              <circle cx={hx} cy={hy} r="5" fill="#0b0b14" stroke={dotColor} strokeWidth="2" />
              <circle cx={hx} cy={hy} r="2" fill="#fff" />

              {/* Tooltip */}
              <g>
                <rect
                  x={tooltipX} y={tooltipY}
                  width={tooltipW} height={tooltipH}
                  rx={10}
                  fill="rgba(18, 18, 30, 0.90)"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="1"
                />
                <text
                  x={tooltipX + tooltipW / 2} y={tooltipY + 18}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.6)"
                  fontSize="10.5"
                  fontWeight="600"
                  fontFamily="Poppins, sans-serif"
                >
                  {fmtFullDate(hoverItem.date)}
                </text>
                <text
                  x={tooltipX + tooltipW / 2} y={tooltipY + 39}
                  textAnchor="middle"
                  fill={dotColor}
                  fontSize="16"
                  fontWeight="700"
                  fontFamily="Poppins, sans-serif"
                >
                  {fmtVal(val)}
                </text>
                <text
                  x={tooltipX + tooltipW / 2} y={tooltipY + 54}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  letterSpacing="1.2"
                >
                  {mode === 'cumulative' ? 'CUMULATIVE P&L' : 'DAILY P&L'}
                </text>
              </g>
            </>
          );
        })()}
      </svg>
    </div>
  );
}
