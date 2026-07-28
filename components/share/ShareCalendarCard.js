'use client';

import { forwardRef } from 'react';

const LOGO_MARK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAACtUlEQVR4nO3Zv2sTYRgH8O/zps09V5K+qbYKtYugYl0Eg61SXETcFaWIk4OCFP8CRZwFBRUXdwcnNycROvijhYAOijrpUERbWmKVXK7JPQ4K1utV7CW5t7XPB7LkTZ783+8lOZIDlFJKKaWUUkoptfnkXAdIp7/o+fmJXC4/n8+wbTfob14kyNFBgtu+ZrSy73Us7zbQzWhaYw3EAu2N3ny8UCtvSzNtoBRgiXEpaCMPu7akGtpYnW75fui2C/QlLc2G48DbNzA1TAHPpmohMrFyRzwCdArCUeaiseJ69GPvSE2ZbZ+47C4Bc5+so3y+dYLaN2Oabvm9Pu87Wccz2KLMN4kff83oTvwj/K55njzPbxYS3/mXX2TrNMPdeZbbN+OZ9v3TLdbiOKhaLW5nto4SjLsz2PtbZWctr5zDf7x1hth9X2fwDAN2dyJL6FMJsPwGYAfBYxDyt12kSmP+actYFAHcA5GNLDSJcqdWq1wHI77sHe3y/dgCIxkRwDMBwEFSH0rx2KwXMAuhfHhbAK6ypkCGfefEugHMJi18AnAmC6pOEDR/Bn0d9LgiqA2n20c4C4v5aiOcV9xDlHgKyL+G5k8bQTREZXmXDceuygLhlhdAzIrkBYFfsMQLgA4BBrO1znbqArjRPSqkLQBlAmUhWewwB2JlZIqyz04oLWoDrAK5pAa4DuKYFuA7gmhbgOoBrWoDrAK5t+gJa+DFkThJFh6MIh4gwAmBH21L9mxkRTBuDFyLmedohbbuo0NPTP9hsNstEUiZCWUTGAPS1afx3gF4SoSKCShSZShjOv27H4E5eVcnl81v2GhP9KgRlQA5i5d9ecU2A3gE/N2sMVWq1hWkAYSdCZnxZaaDAvFQmktEowigRRgFABFPGYEqEpoKguwLMfss2l1JKKaWUUkoppTaTH/eK6MSpCDdTAAAAAElFTkSuQmCC';

const LOGO_FULL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NTIiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgNDUyIDEwMCIgZmlsbD0ibm9uZSI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBsZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjYTc4YmZhIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyZDNlZSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMiIgZmlsbD0idXJsKCNwbGcpIi8+CiAgPHBvbHlnb24gcG9pbnRzPSIyMiw0MiA1MCw0OSA1MCw3NSAyMiw2OSIgZmlsbD0iIzA4MDgwZiIvPgogIDxwb2x5Z29uIHBvaW50cz0iNzgsNDIgNTAsNDkgNTAsNzUgNzgsNjkiIGZpbGw9IiMwODA4MGYiLz4KICA8cG9seWxpbmUgcG9pbnRzPSI1MCw0OSA2MywzOSA3NCwyNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDgwODBmIiBzdHJva2Utd2lkdGg9IjYuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iNzQiIGN5PSIyNyIgcj0iNC41IiBmaWxsPSIjMDgwODBmIi8+CiAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTI2LjAwLDcxLjg2KSBzY2FsZSgwLjA2MjAwLC0wLjA2MjAwKSIgZmlsbD0iI2ZmZmZmZiIgZD0iTTMzOSAyNTJIMjMzVjBINjJWNzAySDMzOVE0MjMgNzAyIDQ4MS4wIDY3My4wUTUzOSA2NDQgNTY4LjAgNTkzLjBRNTk3IDU0MiA1OTcgNDc2UTU5NyA0MTUgNTY5LjAgMzY0LjVRNTQxIDMxNCA0ODMuMCAyODMuMFE0MjUgMjUyIDMzOSAyNTJaTTQyMyA0NzZRNDIzIDUxOCAzOTkuMCA1NDEuMFEzNzUgNTY0IDMyNiA1NjRIMjMzVjM4OEgzMjZRMzc1IDM4OCAzOTkuMCA0MTEuMFE0MjMgNDM0IDQyMyA0NzZaIi8+CiAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTY0LjY5LDcxLjg2KSBzY2FsZSgwLjA2MjAwLC0wLjA2MjAwKSIgZmlsbD0iI2ZmZmZmZiIgZD0iTTQwOCA1NjRWMzgzSDM2MVEyOTcgMzgzIDI2NS4wIDM1NS41UTIzMyAzMjggMjMzIDI1OVYwSDYyVjU1OEgyMzNWNDY1UTI2MyA1MTEgMzA4LjAgNTM3LjVRMzUzIDU2NCA0MDggNTY0WiIvPgogIDxwYXRoIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE5MS4yMiw3MS44Nikgc2NhbGUoMC4wNjIwMCwtMC4wNjIwMCkiIGZpbGw9IiNmZmZmZmYiIGQ9Ik0yOCAyNzlRMjggMzY1IDY2LjAgNDMwLjVRMTA0IDQ5NiAxNzAuMCA1MzEuMFEyMzYgNTY2IDMxOCA1NjZRNDAwIDU2NiA0NjYuMCA1MzEuMFE1MzIgNDk2IDU3MC4wIDQzMC41UTYwOCAzNjUgNjA4IDI3OVE2MDggMTkzIDU2OS41IDEyNy41UTUzMSA2MiA0NjQuNSAyNy4wUTM5OCAtOCAzMTYgLThRMjM0IC04IDE2OC41IDI3LjBRMTAzIDYyIDY1LjUgMTI3LjBRMjggMTkyIDI4IDI3OVpNNDM0IDI3OVE0MzQgMzQ2IDQwMC41IDM4Mi4wUTM2NyA0MTggMzE4IDQxOFEyNjggNDE4IDIzNS4wIDM4Mi41UTIwMiAzNDcgMjAyIDI3OVEyMDIgMjEyIDIzNC41IDE3Ni4wUTI2NyAxNDAgMzE2IDE0MFEzNjUgMTQwIDM5OS41IDE3Ni4wUTQzNCAyMTIgNDM0IDI3OVoiLz4KICA8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMzAuNzIsNzEuODYpIHNjYWxlKDAuMDYyMDAsLTAuMDYyMDApIiBmaWxsPSIjZmZmZmZmIiBkPSJNNDA1IDU2NlE0NzQgNTY2IDUzMC4wIDUzMS4wUTU4NiA0OTYgNjE4LjUgNDMxLjBRNjUxIDM2NiA2NTEgMjgwUTY1MSAxOTQgNjE4LjUgMTI4LjVRNTg2IDYzIDUzMC4wIDI3LjVRNDc0IC04IDQwNSAtOFEzNDcgLTggMzAyLjUgMTYuMFEyNTggNDAgMjMzIDc4Vi0yNjZINjJWNTU4SDIzM1Y0NzlRMjU4IDUxOCAzMDIuMCA1NDIuMFEzNDYgNTY2IDQwNSA1NjZaTTM1NCA0MTdRMzAzIDQxNyAyNjcuNSAzODAuMFEyMzIgMzQzIDIzMiAyNzlRMjMyIDIxNSAyNjcuNSAxNzguMFEzMDMgMTQxIDM1NCAxNDFRNDA1IDE0MSA0NDEuMCAxNzguNVE0NzcgMjE2IDQ3NyAyODBRNDc3IDM0NCA0NDEuNSAzODAuNVE0MDYgNDE3IDM1NCA0MTdaIi8+CiAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjcyLjgyLDcxLjg2KSBzY2FsZSgwLjA2MjAwLC0wLjA2MjAwKSIgZmlsbD0iI2ZmZmZmZiIgZD0iTTIzMyAxMzJINDU3VjBINjJWNzAySDIzM1oiLz4KICA8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMDIuMzksNzEuODYpIHNjYWxlKDAuMDYyMDAsLTAuMDYyMDApIiBmaWxsPSIjZmZmZmZmIiBkPSJNMjggMjc5UTI4IDM2NSA2Ni4wIDQzMC41UTEwNCA0OTYgMTcwLjAgNTMxLjBRMjM2IDU2NiAzMTggNTY2UTQwMCA1NjYgNDY2LjAgNTMxLjBRNTMyIDQ5NiA1NzAuMCA0MzAuNVE2MDggMzY1IDYwOCAyNzlRNjA4IDE5MyA1NjkuNSAxMjcuNVE1MzEgNjIgNDY0LjUgMjcuMFEzOTggLTggMzE2IC04UTIzNCAtOCAxNjguNSAyNy4wUTEwMyA2MiA2NS41IDEyNy4wUTI4IDE5MiAyOCAyNzlaTTQzNCAyNzlRNDM0IDM0NiA0MDAuNSAzODIuMFEzNjcgNDE4IDMxOCA0MThRMjY4IDQxOCAyMzUuMCAzODIuNVEyMDIgMzQ3IDIwMiAyNzlRMjAyIDIxMiAyMzQuNSAxNzYuMFEyNjcgMTQwIDMxNiAxNDBRMzY1IDE0MCAzOTkuNSAxNzYuMFE0MzQgMjEyIDQzNCAyNzlaIi8+CiAgPHBhdGggdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzQxLjg4LDcxLjg2KSBzY2FsZSgwLjA2MjAwLC0wLjA2MjAwKSIgZmlsbD0iI2ZmZmZmZiIgZD0iTTQ0NiA0NzlWNTU4SDYxN1YxUTYxNyAtNzYgNTg2LjUgLTEzOC41UTU1NiAtMjAxIDQ5My41IC0yMzguMFE0MzEgLTI3NSAzMzggLTI3NVEyMTQgLTI3NSAxMzcuMCAtMjE2LjVRNjAgLTE1OCA0OSAtNThIMjE4UTIyNiAtOTAgMjU2LjAgLTEwOC41UTI4NiAtMTI3IDMzMCAtMTI3UTM4MyAtMTI3IDQxNC41IC05Ni41UTQ0NiAtNjYgNDQ2IDFWODBRNDIxIDQxIDM3Ny4wIDE2LjVRMzMzIC04IDI3NCAtOFEyMDUgLTggMTQ5LjAgMjcuNVE5MyA2MyA2MC41IDEyOC41UTI4IDE5NCAyOCAyODBRMjggMzY2IDYwLjUgNDMxLjBROTMgNDk2IDE0OS4wIDUzMS4wUTIwNSA1NjYgMjc0IDU2NlEzMzMgNTY2IDM3Ny41IDU0Mi4wUTQyMiA1MTggNDQ2IDQ3OVpNMzI0IDQxN1EyNzMgNDE3IDIzNy41IDM4MC41UTIwMiAzNDQgMjAyIDI4MFEyMDIgMjE2IDIzNy41IDE3OC41UTI3MyAxNDEgMzI0IDE0MVEzNzUgMTQxIDQxMC41IDE3OC4wUTQ0NiAyMTUgNDQ2IDI3OVE0NDYgMzQzIDQxMC41IDM4MC4wUTM3NSA0MTcgMzI0IDQxN1oiLz4KICA8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzODMuOTgsNzEuODYpIHNjYWxlKDAuMDYyMDAsLTAuMDYyMDApIiBmaWxsPSIjMjJkM2VlIiBkPSJNNDk5IDEyNEgyMzdMMTk1IDBIMTZMMjcwIDcwMkg0NjhMNzIyIDBINTQxWk00NTUgMjU2IDM2OCA1MTMgMjgyIDI1NloiLz4KICA8cGF0aCB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MjkuNjgsNzEuODYpIHNjYWxlKDAuMDYyMDAsLTAuMDYyMDApIiBmaWxsPSIjMjJkM2VlIiBkPSJNMjMzIDcwMlYwSDYyVjcwMloiLz4KPC9zdmc+Cg==';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* Tailwind font-mono stack — matches the calendar page's font-mono class exactly */
var MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

/* Poppins stack — matches the app's next/font display face; used for the share header */
var POPPINS = "'Poppins', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function fmtPnlShort(v) {
  if (v === 0) return '$0';
  const sign = v < 0 ? '-' : '+';
  const abs = Math.abs(v);
  if (abs >= 10000) return sign + '$' + (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1) + 'K';
  return sign + '$' + Math.round(abs);
}

function fmtPnlHeader(v) {
  if (v === 0) return '$0';
  const sign = v < 0 ? '-' : '+';
  const abs = Math.abs(v);
  if (abs >= 100000) return sign + '$' + (abs / 1000).toFixed(0) + 'K';
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(2).replace(/0$/, '').replace(/\.$/, '') + 'K';
  return sign + '$' + abs.toFixed(2);
}

const ShareCalendarCard = forwardRef(function ShareCalendarCard(
  { trades, year, month, ratio, monthlyPnl },
  ref
) {
  const isSquare = ratio === '1:1';
  const w = isSquare ? 720 : 960;
  const h = isSquare ? 720 : 540;

  /* ── aggregate by day ── */
  const byDay = {};
  (trades || []).forEach(function (t) {
    var raw = t.trade_date || t.closed_at || t.created_at;
    if (!raw) return;
    var d = new Date(raw);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month) return;
    var day = d.getUTCDate();
    var e = byDay[day] || { net: 0, count: 0 };
    e.net += Number(t.pnl) || 0;
    e.count += 1;
    byDay[day] = e;
  });

  /* ── build weeks ── */
  var firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  var daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  var prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  var weeks = [];
  var currentWeek = [];
  for (var i = 0; i < firstDow; i++) {
    currentWeek.push({ day: prevMonthDays - firstDow + 1 + i, overflow: true });
  }
  for (var dd = 1; dd <= daysInMonth; dd++) {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ day: dd, overflow: false });
  }
  var nextDay = 1;
  while (currentWeek.length < 7) {
    currentWeek.push({ day: nextDay++, overflow: true });
  }
  weeks.push(currentWeek);
  while (weeks.length < 6) {
    var extraWeek = [];
    for (var j = 0; j < 7; j++) {
      extraWeek.push({ day: nextDay++, overflow: true });
    }
    weeks.push(extraWeek);
  }

  /* ── week summaries ── */
  var weekSummaries = weeks.map(function (week, idx) {
    var net = 0, count = 0, days = 0;
    week.forEach(function (cell) {
      if (!cell.overflow && byDay[cell.day]) {
        net += byDay[cell.day].net;
        count += byDay[cell.day].count;
        days += 1;
      }
    });
    return { weekNum: idx + 1, net: net, count: count, days: days };
  });

  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  var monthName = monthNames[month] || '';
  var monthAbbr = monthName.slice(0, 3);
  var tradingDays = Object.keys(byDay).length;
  var totalTrades = Object.values(byDay).reduce(function (s, e) { return s + e.count; }, 0);
  var totalPnl =
    monthlyPnl != null
      ? monthlyPnl
      : Object.values(byDay).reduce(function (s, e) { return s + e.net; }, 0);
  var isWin = totalPnl >= 0;

  var accentColor = isWin ? '#34d399' : '#f87171';
  var accentGlow = isWin ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.2)';
  var secondaryGlow = isWin ? 'rgba(34,211,238,0.15)' : 'rgba(251,191,36,0.12)';
  var accentGradient = isWin
    ? 'linear-gradient(120deg, #34d399, #22d3ee)'
    : 'linear-gradient(120deg, #f87171, #fbbf24)';

  /* ── layout sizing ── */
  var pad = isSquare ? 20 : 24;
  var dowH = isSquare ? 28 : 24;
  var sidebarW = isSquare ? 110 : 136;
  var gapX = isSquare ? 8 : 12;

  var now = new Date();
  var todayDay =
    now.getUTCFullYear() === year && now.getUTCMonth() === month
      ? now.getUTCDate()
      : null;

  return (
    <div
      ref={ref}
      style={{
        width: w,
        height: h,
        background: '#07070b',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── glow orbs ── */}
      <div
        style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '45%', height: '45%', borderRadius: '50%',
          background: 'radial-gradient(circle, ' + accentGlow + ' 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-15%', right: '-8%',
          width: '40%', height: '40%', borderRadius: '50%',
          background: 'radial-gradient(circle, ' + secondaryGlow + ' 0%, transparent 70%)',
          filter: 'blur(45px)',
        }}
      />
      <div
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '25%', height: '25%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          filter: 'blur(35px)', transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── accent bar ── */}
      <div style={{ height: 3, width: '100%', background: accentGradient, flexShrink: 0 }} />

      {/* ── content wrapper ── */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          padding: pad + 'px',
          flex: 1, display: 'flex', flexDirection: 'column',
          boxSizing: 'border-box',
          minHeight: 0,
        }}
      >
        {/* ── header (logo left · Monthly P/L center · month right) ──
            html2canvas-safe: center block uses text-align:center (not flex),
            logo/month are absolutely positioned; logo lockup uses inline-block +
            vertical-align:middle so the wordmark centers on the mark reliably. */}
        <div style={{ position: 'relative', marginBottom: isSquare ? 12 : 8, flexShrink: 0 }}>
          {/* CENTER: Monthly P/L hero — full-width, text-align center */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: POPPINS,
                fontSize: 9, fontWeight: 600,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1,
              }}
            >
              Monthly P/L
            </div>
            <div
              style={{
                fontFamily: POPPINS,
                fontSize: 22, fontWeight: 800,
                color: accentColor,
                textShadow: '0 0 16px ' + accentGlow,
                lineHeight: 1.2, marginTop: 5,
              }}
            >
              {fmtPnlHeader(totalPnl)}
            </div>
            <div
              style={{
                fontFamily: POPPINS,
                fontSize: 9, color: 'rgba(255,255,255,0.4)',
                lineHeight: 1, marginTop: 7,
              }}
            >
              {totalTrades} trade{totalTrades !== 1 ? 's' : ''} &middot; {tradingDays} day{tradingDays !== 1 ? 's' : ''}
            </div>
          </div>

          {/* LEFT: logo — single standalone SVG (icon + wordmark baked together as
              vector paths), absolute + vertically centered. Rendered as an <img>
              data-URI so html2canvas rasterizes it faithfully with zero layout or
              font drift. Aspect ratio 452:100 → 136x30. */}
          <div
            style={{
              position: 'absolute', left: 0, top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <img
              src={LOGO_FULL}
              alt="PropLogAI"
              width={136}
              height={30}
              style={{ display: 'block', width: 136, height: 30 }}
            />
          </div>

          {/* RIGHT: month + year (one line, abbreviated) — absolute, vertically centered */}
          <div
            style={{
              position: 'absolute', right: 0, top: '50%',
              transform: 'translateY(-50%)', whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontFamily: POPPINS,
                fontSize: isSquare ? 18 : 16, fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {monthAbbr}
            </span>
            <span
              style={{
                marginLeft: 6,
                fontFamily: POPPINS,
                fontSize: isSquare ? 15 : 13, fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1,
              }}
            >
              {year}
            </span>
          </div>
        </div>

        {/* ── calendar body + sidebar ── */}
        <div style={{ flex: 1, display: 'flex', gap: gapX, minHeight: 0 }}>
          {/* calendar grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* DOW header */}
            <div
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                height: dowH, gap: 1, flexShrink: 0,
              }}
            >
              {DOW.map(function (d) {
                return (
                  <div
                    key={d}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600,
                      color: 'rgba(255,255,255,0.4)',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* rows */}
            <div
              style={{
                flex: 1, display: 'grid',
                gridTemplateRows: 'repeat(6, 1fr)',
                gap: 1, minHeight: 0,
              }}
            >
              {weeks.map(function (week, wi) {
                return (
                  <div
                    key={'w' + wi}
                    style={{
                      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: 1, minHeight: 0,
                    }}
                  >
                    {week.map(function (cell, ci) {
                      var e = !cell.overflow ? byDay[cell.day] : null;
                      var isToday = !cell.overflow && cell.day === todayDay;

                      var cellBg = 'rgba(255,255,255,0.02)';
                      if (e) {
                        var intensity = Math.min(0.35, 0.1 + Math.abs(e.net) / 2500);
                        cellBg = e.net >= 0
                          ? 'rgba(34, 197, 94, ' + intensity + ')'
                          : 'rgba(239, 68, 68, ' + intensity + ')';
                      }

                      return (
                        <div
                          key={'c' + ci}
                          style={{
                            background: cellBg,
                            border: isToday
                              ? '1.5px solid rgba(34,211,238,0.6)'
                              : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: isSquare ? 4 : 5,
                            display: 'flex', flexDirection: 'column',
                            padding: isSquare ? '3px 4px' : '3px 5px',
                            opacity: cell.overflow ? 0.15 : 1,
                            overflow: 'hidden', minHeight: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: isToday ? 700 : 500,
                              color: isToday ? '#22d3ee' : 'rgba(255,255,255,0.5)',
                              lineHeight: 1, flexShrink: 0,
                            }}
                          >
                            {cell.day}
                          </div>
                          {e ? (
                            <div
                              style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                minHeight: 0, gap: 4,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: isSquare ? 14 : 14,
                                  fontWeight: 700,
                                  fontFamily: MONO,
                                  color: e.net >= 0 ? '#34d399' : '#f87171',
                                  whiteSpace: 'nowrap', lineHeight: 1,
                                }}
                              >
                                {fmtPnlShort(e.net)}
                              </div>
                              <div
                                style={{
                                  fontSize: 9, color: 'rgba(255,255,255,0.4)',
                                  lineHeight: 1, whiteSpace: 'nowrap',
                                }}
                              >
                                {e.count} trade{e.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── weekly sidebar ── */}
          <div
            style={{
              width: sidebarW, flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: isSquare ? 3 : 4,
              paddingTop: dowH + 2,
            }}
          >
            {weekSummaries.map(function (ws) {
              return (
                <div
                  key={'ws' + ws.weekNum}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '2px 4px', minHeight: 0, overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10, fontWeight: 600,
                      color: 'rgba(255,255,255,0.4)',
                      letterSpacing: '0.04em', lineHeight: 1,
                    }}
                  >
                    Week {ws.weekNum}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: MONO,
                      color:
                        ws.count === 0
                          ? 'rgba(255,255,255,0.2)'
                          : ws.net >= 0
                          ? '#34d399'
                          : '#f87171',
                      lineHeight: 1.3,
                      marginTop: 2,
                    }}
                  >
                    {ws.count === 0 ? '$0' : fmtPnlShort(ws.net)}
                  </div>
                  <div
                    style={{
                      fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1,
                      marginTop: 2,
                    }}
                  >
                    {ws.count} trade{ws.count !== 1 ? 's' : ''} &middot; {ws.days} day{ws.days !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── footer ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: isSquare ? 8 : 6, flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.06em',
            }}
          >
            proplogai.com &mdash; AI Trading Discipline
          </span>
        </div>
      </div>
    </div>
  );
});

export default ShareCalendarCard;
