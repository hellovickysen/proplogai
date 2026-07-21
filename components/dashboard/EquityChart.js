"use client";

import { useState, useRef, useEffect } from 'react';

const W = 800;
const H = 280;
const PAD = { top: 16, right: 8, bottom: 32, left: 52 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;
const T = 0.2; /* Catmull-Rom tension */

function fmtVal(v) {
  const s = v >= 0 ? '+' : '-';
  return s + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtY(v) {
  if (v === 0) return '$0';
  const s = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1000) return s + '$' + (a / 1000).toFixed(1) + 'K';
  return s + '$' + a.toFixed(0);
}

function fmtDate(ds) {
  const d = new Date(ds + 'T00:00:00');
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()] + ', ' +
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] +
    ' ' + d.getDate() + ', ' + d.getFullYear();
}

function niceStep(r, tgt) {
  const raw = r / tgt, mag = Math.pow(10, Math.floor(Math.log10(raw))), res = raw / mag;
  return (res <= 1.5 ? 1 : res <= 3 ? 2 : res <= 7 ? 5 : 10) * mag;
}

function getTicks(min, max) {
  const r = max - min || 1, step = niceStep(r, 5);
  const s = Math.floor(min / step) * step, e = Math.ceil(max / step) * step;
  const t = [];
  for (let v = s; v <= e + step * 0.01; v += step) t.push(Math.round(v * 100) / 100);
  return t;
}

/* ── Build Catmull-Rom path + store bezier segments for interpolation ── */
function buildCurve(points) {
  const n = points.length;
  const segments = []; /* Each: { p0, cp1, cp2, p3 } for cubic bezier eval */
  if (n < 2) return { path: '', segments };
  if (n === 2) {
    segments.push({ p0: points[0], cp1: points[0], cp2: points[1], p3: points[1] });
    return { path: `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}L${points[1][0].toFixed(1)},${points[1][1].toFixed(1)}`, segments };
  }

  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[i];
    const c = points[i + 1];
    const e = points[Math.min(n - 1, i + 2)];

    const cp1 = [b[0] + (c[0] - a[0]) * T, b[1] + (c[1] - a[1]) * T];
    const cp2 = [c[0] - (e[0] - b[0]) * T, c[1] - (e[1] - b[1]) * T];

    segments.push({ p0: b, cp1, cp2, p3: c });
    d += ` C${cp1[0].toFixed(1)},${cp1[1].toFixed(1)} ${cp2[0].toFixed(1)},${cp2[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
  }
  return { path: d, segments };
}

/* ── Evaluate cubic bezier at parameter t ── */
function bezierY(seg, t) {
  const u = 1 - t;
  return u * u * u * seg.p0[1] + 3 * u * u * t * seg.cp1[1] + 3 * u * t * t * seg.cp2[1] + t * t * t * seg.p3[1];
}

function bezierX(seg, t) {
  const u = 1 - t;
  return u * u * u * seg.p0[0] + 3 * u * u * t * seg.cp1[0] + 3 * u * t * t * seg.cp2[0] + t * t * t * seg.p3[0];
}

export default function EquityChart({ data }) {
  const [mode, setMode] = useState('cumulative');
  const svgRef = useRef(null);
  const hRef = useRef(null);
  const raf = useRef(0);
  const cacheRef = useRef({ pts: [], segs: [], data: [] });

  const ok = data && data.length >= 2;
  const vals = ok ? data.map(d => mode === 'cumulative' ? d.cumulative : d.daily) : [];
  const mn = ok ? Math.min(0, ...vals) : 0;
  const mx = ok ? Math.max(0, ...vals) : 0;
  const ticks = ok ? getTicks(mn, mx) : [];
  const tMin = ticks[0] || 0, tMax = ticks[ticks.length - 1] || 1, tR = tMax - tMin || 1;

  const sx = i => PAD.left + (i / ((data ? data.length : 2) - 1)) * CW;
  const sy = v => PAD.top + CH * (1 - (v - tMin) / tR);
  const syInv = y => tMin + (1 - (y - PAD.top) / CH) * tR; /* pixel Y → data value */
  const zeroY = ok ? sy(0) : H / 2;

  /* Build curve + cache segments */
  let curvePath = '', areaPath = '', curveSegs = [];
  if (ok) {
    const pts = data.map((_, i) => [sx(i), sy(vals[i])]);
    const built = buildCurve(pts);
    curvePath = built.path;
    curveSegs = built.segments;
    areaPath = curvePath + ` L${pts[pts.length-1][0].toFixed(1)},${zeroY.toFixed(1)} L${pts[0][0].toFixed(1)},${zeroY.toFixed(1)} Z`;

    cacheRef.current = {
      pts: data.map((d, i) => ({ x: sx(i), y: sy(vals[i]), v: vals[i], date: d.date, label: d.label })),
      segs: curveSegs,
      data: data,
    };
  }

  /* ── Native hover — interpolates along the bezier curve ── */
  useEffect(() => {
    const svg = svgRef.current, hg = hRef.current;
    if (!svg || !hg || !ok) return;

    const q = s => hg.querySelector(s);
    const el = { vl: q('.vl'), hl: q('.hl'), d1: q('.d1'), d2: q('.d2'), d3: q('.d3'), bg: q('.bg'), td: q('.td'), tv: q('.tv'), tl: q('.tl') };

    function upd(clientX) {
      const c = cacheRef.current;
      const n = c.pts.length;
      if (!n) return;

      /* Use SVG's CTM for pixel-perfect coordinate mapping */
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const mouseX = (clientX - ctm.e) / ctm.a;

      /* Clamp to chart bounds */
      const clampedX = Math.max(PAD.left, Math.min(PAD.left + CW, mouseX));

      /* Find fractional index */
      const frac = ((clampedX - PAD.left) / CW) * (n - 1);
      const segIdx = Math.min(Math.floor(frac), n - 2);
      const t = frac - segIdx;

      /* Evaluate bezier curve at this point */
      const seg = c.segs[segIdx];
      let dotX, dotY;
      if (seg) {
        dotX = bezierX(seg, t);
        dotY = bezierY(seg, t);
      } else {
        dotX = clampedX;
        dotY = c.pts[Math.round(frac)].y;
      }

      /* Get interpolated data value from Y position */
      const dotVal = syInv(dotY);

      /* Nearest data point for date display */
      const nearIdx = Math.round(frac);
      const nearPt = c.pts[nearIdx];

      const pos = dotVal >= 0;
      const col = pos ? '#22d3ee' : '#f87171';

      el.vl.setAttribute('x1', dotX); el.vl.setAttribute('x2', dotX);
      el.hl.setAttribute('y1', dotY); el.hl.setAttribute('y2', dotY);
      [el.d1, el.d2, el.d3].forEach(e => { e.setAttribute('cx', dotX); e.setAttribute('cy', dotY); });
      el.d1.setAttribute('fill', pos ? 'rgba(34,211,238,0.12)' : 'rgba(248,113,113,0.12)');
      el.d2.setAttribute('stroke', col);

      const tw = 164, th = 58;
      const tx = dotX + tw + 20 > W ? dotX - tw - 12 : dotX + 12;
      const ty = Math.max(PAD.top, Math.min(dotY - th / 2, H - PAD.bottom - th));
      el.bg.setAttribute('x', tx); el.bg.setAttribute('y', ty);
      el.td.setAttribute('x', tx + tw / 2); el.td.setAttribute('y', ty + 17);
      el.td.textContent = nearPt ? fmtDate(nearPt.date) : '';
      el.tv.setAttribute('x', tx + tw / 2); el.tv.setAttribute('y', ty + 37);
      el.tv.setAttribute('fill', col);
      el.tv.textContent = fmtVal(dotVal);
      el.tl.setAttribute('x', tx + tw / 2); el.tl.setAttribute('y', ty + 51);

      hg.style.display = '';
    }

    function onM(e) { if (!raf.current) { const cx = e.clientX; raf.current = requestAnimationFrame(() => { raf.current = 0; upd(cx); }); } }
    function onT(e) { if (!raf.current && e.touches[0]) { const cx = e.touches[0].clientX; raf.current = requestAnimationFrame(() => { raf.current = 0; upd(cx); }); } }
    function off() { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0; } hg.style.display = 'none'; }

    svg.addEventListener('mousemove', onM, { passive: true });
    svg.addEventListener('touchmove', onT, { passive: true });
    svg.addEventListener('mouseleave', off);
    svg.addEventListener('touchend', off);
    return () => { svg.removeEventListener('mousemove', onM); svg.removeEventListener('touchmove', onT); svg.removeEventListener('mouseleave', off); svg.removeEventListener('touchend', off); if (raf.current) cancelAnimationFrame(raf.current); };
  });

  if (!ok) return <div className="flex h-[200px] items-center justify-center text-sm text-white/55">Log at least two trades to see your equity curve.</div>;

  const ls = Math.max(1, Math.ceil(data.length / 7));
  const xLbls = data.filter((_, i) => i % ls === 0 || i === data.length - 1);
  const ml = mode === 'cumulative' ? 'CUMULATIVE P&L' : 'DAILY P&L';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 truncate font-display text-base font-semibold">P&amp;L Performance</div>
        <div className="flex shrink-0 gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5">
          {[{k:'cumulative',l:'Cumulative'},{k:'daily',l:'Daily'}].map(m=>(
            <button key={m.k} onClick={()=>setMode(m.k)}
              className={'rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-200 sm:px-3 sm:py-1.5 sm:text-xs '+(mode===m.k?'bg-white/[0.1] text-white shadow-sm':'text-white/40 hover:text-white/60')}>
              {m.l}
            </button>
          ))}
        </div>
      </div>
      <div className="-mx-5 -mb-5">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block h-[210px] w-full select-none sm:h-[280px]" style={{shapeRendering:'geometricPrecision'}}>
          <defs>
            <linearGradient id="ac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".18"/><stop offset=".6" stopColor="#22d3ee" stopOpacity=".05"/><stop offset="1" stopColor="#22d3ee" stopOpacity=".01"/></linearGradient>
            <linearGradient id="ar" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#f87171" stopOpacity=".18"/><stop offset=".6" stopColor="#f87171" stopOpacity=".05"/><stop offset="1" stopColor="#f87171" stopOpacity=".01"/></linearGradient>
            <clipPath id="ca"><rect x="0" y={PAD.top} width={W} height={Math.max(0,zeroY-PAD.top)}/></clipPath>
            <clipPath id="cb"><rect x="0" y={zeroY} width={W} height={Math.max(0,PAD.top+CH-zeroY)}/></clipPath>
          </defs>

          {ticks.map((v,i)=>{const y=sy(v);return(
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W-PAD.right} y2={y} stroke={v===0?'rgba(255,255,255,.1)':'rgba(255,255,255,.04)'} strokeWidth={v===0?1:.5} strokeDasharray={v===0?'4 3':'none'}/>
              <text x={PAD.left-8} y={y+4} textAnchor="end" fill={v>0?'rgba(34,211,238,.45)':v<0?'rgba(248,113,113,.45)':'rgba(255,255,255,.3)'} fontSize="10" fontFamily="JetBrains Mono,monospace">{fmtY(v)}</text>
            </g>
          );})}

          {xLbls.map(d=>{const i=data.indexOf(d);return(
            <text key={d.date} x={sx(i)} y={H-6} textAnchor="middle" fill="rgba(255,255,255,.22)" fontSize="10" fontFamily="JetBrains Mono,monospace">{d.label}</text>
          );})}

          <path d={areaPath} fill="url(#ac)" clipPath="url(#ca)"/>
          <path d={areaPath} fill="url(#ar)" clipPath="url(#cb)"/>
          <g clipPath="url(#ca)"><path d={curvePath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></g>
          <g clipPath="url(#cb)"><path d={curvePath} fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></g>

          <g ref={hRef} style={{display:'none'}}>
            <line className="vl" x1="0" y1={PAD.top} x2="0" y2={H-PAD.bottom} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="4 3"/>
            <line className="hl" x1={PAD.left} y1="0" x2={W-PAD.right} y2="0" stroke="rgba(255,255,255,.08)" strokeWidth="1" strokeDasharray="4 3"/>
            <circle className="d1" cx="0" cy="0" r="7" fill="rgba(34,211,238,.12)"/>
            <circle className="d2" cx="0" cy="0" r="4" fill="#0b0b14" stroke="#22d3ee" strokeWidth="1.5"/>
            <circle className="d3" cx="0" cy="0" r="1.5" fill="#fff"/>
            <rect className="bg" x="0" y="0" width="164" height="58" rx="8" fill="rgba(14,14,24,.92)" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
            <text className="td" x="0" y="0" textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="10" fontWeight="600" fontFamily="Poppins,sans-serif"/>
            <text className="tv" x="0" y="0" textAnchor="middle" fill="#22d3ee" fontSize="15" fontWeight="700" fontFamily="Poppins,sans-serif"/>
            <text className="tl" x="0" y="0" textAnchor="middle" fill="rgba(255,255,255,.25)" fontSize="7.5" fontWeight="600" fontFamily="JetBrains Mono,monospace" letterSpacing="1">{ml}</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
