"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

const W = 800;
const H = 300;
const PAD = { top: 20, right: 0, bottom: 36, left: 0 };
const CHART_W = W;
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

/* ── Smooth cubic bezier (Catmull-Rom) ── */
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
    d += ' C' + (p1[0] + (p2[0] - p0[0]) * t).toFixed(2) + ',' + (p1[1] + (p2[1] - p0[1]) * t).toFixed(2) + ' ' + (p2[0] - (p3[0] - p1[0]) * t).toFixed(2) + ',' + (p2[1] - (p3[1] - p1[1]) * t).toFixed(2) + ' ' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2);
  }
  return d;
}

export default function EquityChart({ data }) {
  const [mode, setMode] = useState('cumulative');
  const svgRef = useRef(null);
  const hoverRef = useRef(null);
  const rafId = useRef(0);
  const ptsCacheRef = useRef([]);

  const hasData = data && data.length >= 2;

  /* ── Compute scales ── */
  const vals = hasData ? data.map((d) => (mode === 'cumulative' ? d.cumulative : d.daily)) : [];
  const minVal = hasData ? Math.min(0, ...vals) : 0;
  const maxVal = hasData ? Math.max(0, ...vals) : 0;
  const ticks = hasData ? yTicks(minVal, maxVal) : [];
  const tickMin = ticks[0] || 0;
  const tickMax = ticks[ticks.length - 1] || 1;
  const tickRange = tickMax - tickMin || 1;

  const sx = (i) => (i / ((data ? data.length : 2) - 1)) * CHART_W;
  const sy = (v) => PAD.top + CHART_H * (1 - (v - tickMin) / tickRange);
  const zeroY = hasData ? sy(0) : H / 2;

  /* Cache points for hover lookup */
  if (hasData) {
    ptsCacheRef.current = data.map((d, i) => ({ x: sx(i), y: sy(vals[i]), val: vals[i], date: d.date, label: d.label }));
  }

  /* ── Native event listeners for zero-lag hover ── */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !hasData) return;

    const pts = ptsCacheRef.current;
    const hg = hoverRef.current;
    if (!hg) return;

    const els = {
      vl: hg.querySelector('.hv'),
      hl: hg.querySelector('.hh'),
      d1: hg.querySelector('.d1'),
      d2: hg.querySelector('.d2'),
      d3: hg.querySelector('.d3'),
      bg: hg.querySelector('.tb'),
      td: hg.querySelector('.td'),
      tv: hg.querySelector('.tv'),
      tl: hg.querySelector('.tl'),
    };

    function update(clientX) {
      const r = svg.getBoundingClientRect();
      const mx = ((clientX - r.left) / r.width) * W;
      const ci = Math.max(0, Math.min(pts.length - 1, Math.round((mx / CHART_W) * (pts.length - 1))));
      const p = pts[ci];
      if (!p) return;

      const pos = p.val >= 0;
      const col = pos ? '#22d3ee' : '#f87171';

      els.vl.setAttribute('x1', p.x); els.vl.setAttribute('x2', p.x);
      els.hl.setAttribute('y1', p.y); els.hl.setAttribute('y2', p.y);
      els.d1.setAttribute('cx', p.x); els.d1.setAttribute('cy', p.y);
      els.d1.setAttribute('fill', pos ? 'rgba(34,211,238,0.12)' : 'rgba(248,113,113,0.12)');
      els.d2.setAttribute('cx', p.x); els.d2.setAttribute('cy', p.y); els.d2.setAttribute('stroke', col);
      els.d3.setAttribute('cx', p.x); els.d3.setAttribute('cy', p.y);

      const tw = 170, th = 62;
      const tx = p.x + tw + 20 > W ? p.x - tw - 16 : p.x + 16;
      const ty = Math.max(PAD.top, Math.min(p.y - th / 2, H - PAD.bottom - th));
      els.bg.setAttribute('x', tx); els.bg.setAttribute('y', ty);
      els.td.setAttribute('x', tx + tw / 2); els.td.setAttribute('y', ty + 18); els.td.textContent = fmtFullDate(p.date);
      els.tv.setAttribute('x', tx + tw / 2); els.tv.setAttribute('y', ty + 39); els.tv.setAttribute('fill', col); els.tv.textContent = fmtVal(p.val);
      els.tl.setAttribute('x', tx + tw / 2); els.tl.setAttribute('y', ty + 54);

      hg.style.display = '';
    }

    function onMove(e) {
      if (rafId.current) return;
      const cx = e.clientX;
      rafId.current = requestAnimationFrame(() => { rafId.current = 0; update(cx); });
    }
    function onTouch(e) {
      if (rafId.current || !e.touches[0]) return;
      const cx = e.touches[0].clientX;
      rafId.current = requestAnimationFrame(() => { rafId.current = 0; update(cx); });
    }
    function onLeave() {
      if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = 0; }
      hg.style.display = 'none';
    }

    svg.addEventListener('mousemove', onMove, { passive: true });
    svg.addEventListener('touchmove', onTouch, { passive: true });
    svg.addEventListener('mouseleave', onLeave);
    svg.addEventListener('touchend', onLeave);

    return () => {
      svg.removeEventListener('mousemove', onMove);
      svg.removeEventListener('touchmove', onTouch);
      svg.removeEventListener('mouseleave', onLeave);
      svg.removeEventListener('touchend', onLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  });

  if (!hasData) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-white/55">
        Log at least two trades to see your equity curve.
      </div>
    );
  }

  const labelStep = Math.max(1, Math.ceil(data.length / 7));
  const xLabels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);
  const pts = data.map((d, i) => [sx(i), sy(vals[i])]);
  const curvePath = smoothPath(pts);
  const areaPath = curvePath + ' L' + pts[pts.length - 1][0].toFixed(2) + ',' + zeroY.toFixed(2) + ' L' + pts[0][0].toFixed(2) + ',' + zeroY.toFixed(2) + ' Z';
  const yLabelX = W - 6;
  const modeLabel = mode === 'cumulative' ? 'CUMULATIVE P&L' : 'DAILY P&L';

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0 truncate font-display text-base font-semibold">P&amp;L Performance</div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5">
          {[{ key: 'cumulative', label: 'Cumulative' }, { key: 'daily', label: 'Daily' }].map((m) => (
            <button key={m.key} onClick={() => setMode(m.key)}
              className={'rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-xs ' + (mode === m.key ? 'bg-white/[0.1] text-white shadow-sm' : 'text-white/40 hover:text-white/60')}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — bleeds past card padding */}
      <div className="-mx-5 -mb-5">
        <svg
          ref={svgRef}
          viewBox={'0 0 ' + W + ' ' + H}
          className="block h-[220px] w-full select-none sm:h-[300px]"
          preserveAspectRatio="none"
          style={{ shapeRendering: 'geometricPrecision' }}
        >
          <defs>
            <linearGradient id="eqAreaCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.22" />
              <stop offset="0.5" stopColor="#22d3ee" stopOpacity="0.08" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="eqAreaRed" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#f87171" stopOpacity="0.22" />
              <stop offset="0.5" stopColor="#f87171" stopOpacity="0.08" />
              <stop offset="1" stopColor="#f87171" stopOpacity="0.01" />
            </linearGradient>
            <clipPath id="clipAbove"><rect x="0" y={PAD.top} width={W} height={Math.max(0, zeroY - PAD.top)} /></clipPath>
            <clipPath id="clipBelow"><rect x="0" y={zeroY} width={W} height={Math.max(0, PAD.top + CHART_H - zeroY)} /></clipPath>
          </defs>

          {/* Grid + Y labels */}
          {ticks.map((v, i) => {
            const y = sy(v);
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={W} y2={y}
                  stroke={v === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth={v === 0 ? 1 : 0.5}
                  strokeDasharray={v === 0 ? '4 3' : 'none'} />
                <text x={yLabelX} y={y - 5} textAnchor="end"
                  fill={v > 0 ? 'rgba(34,211,238,0.5)' : v < 0 ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.3)'}
                  fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {fmtYLabel(v)}
                </text>
              </g>
            );
          })}

          {/* X labels */}
          {xLabels.map((d) => {
            const i = data.indexOf(d);
            return (
              <text key={d.date} x={sx(i)} y={H - 4} textAnchor="middle"
                fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="JetBrains Mono, monospace">
                {d.label}
              </text>
            );
          })}

          {/* Areas */}
          <path d={areaPath} fill="url(#eqAreaCyan)" clipPath="url(#clipAbove)" />
          <path d={areaPath} fill="url(#eqAreaRed)" clipPath="url(#clipBelow)" />

          {/* Line above zero (cyan) */}
          <g clipPath="url(#clipAbove)">
            <path d={curvePath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {/* Line below zero (red) */}
          <g clipPath="url(#clipBelow)">
            <path d={curvePath} fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </g>

          {/* Hover layer — DOM-only, no React re-renders */}
          <g ref={hoverRef} style={{ display: 'none' }}>
            <line className="hv" x1="0" y1={PAD.top} x2="0" y2={H - PAD.bottom} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
            <line className="hh" x1="0" y1="0" x2={W} y2="0" stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="4 3" />
            <circle className="d1" cx="0" cy="0" r="8" fill="rgba(34,211,238,0.12)" />
            <circle className="d2" cx="0" cy="0" r="5" fill="#0b0b14" stroke="#22d3ee" strokeWidth="2" />
            <circle className="d3" cx="0" cy="0" r="2" fill="#fff" />
            <rect className="tb" x="0" y="0" width="170" height="62" rx="10" fill="rgba(18,18,30,0.90)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
            <text className="td" x="0" y="0" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="10.5" fontWeight="600" fontFamily="Poppins, sans-serif" />
            <text className="tv" x="0" y="0" textAnchor="middle" fill="#22d3ee" fontSize="16" fontWeight="700" fontFamily="Poppins, sans-serif" />
            <text className="tl" x="0" y="0" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600" fontFamily="JetBrains Mono, monospace" letterSpacing="1.2">{modeLabel}</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
