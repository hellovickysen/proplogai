'use client';

import { useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts';

const CHART_COLORS = {
  profit: '#34d399',
  loss: '#f87171',
  primary: '#a78bfa',
  secondary: '#22d3ee',
  grid: 'rgba(255,255,255,0.04)',
  axis: 'rgba(255,255,255,0.25)',
  tooltip: '#0b0b14',
};

/* ── Equity Curve ──────────────────────────────────────────── */

export function EquityChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <ChartCard title="Equity Curve">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            tickFormatter={(v) => v?.slice(5, 10)}
          />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="equity" stroke="#a78bfa" fill="url(#eqGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Drawdown Curve ────────────────────────────────────────── */

export function DrawdownChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <ChartCard title="Drawdown">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="date"
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            tickFormatter={(v) => v?.slice(5, 10)}
          />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="drawdown" stroke="#f87171" fill="url(#ddGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Win/Loss Distribution ─────────────────────────────────── */

export function WinLossChart({ data }) {
  if (!data || data.length === 0) return null;

  // Bucket the P&L values
  const buckets = bucketize(data, 15);

  return (
    <ChartCard title="P&L Distribution">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={buckets}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="label" tick={{ fill: CHART_COLORS.axis, fontSize: 9 }} />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {buckets.map((b, i) => (
              <Cell key={i} fill={b.mid >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Session Analysis ──────────────────────────────────────── */

export function SessionChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <ChartCard title="Session Performance">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis type="number" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <YAxis type="category" dataKey="session" tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} width={80} />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
          <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Monthly Performance ───────────────────────────────────── */

export function MonthlyChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <ChartCard title="Monthly Performance">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="month" tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <YAxis tick={{ fill: CHART_COLORS.axis, fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Calendar Heatmap ──────────────────────────────────────── */

export function CalendarHeatmap({ data }) {
  if (!data || data.length === 0) return null;

  const maxPnl = Math.max(...data.map((d) => Math.abs(d.pnl)), 1);

  return (
    <ChartCard title="Daily P&L Calendar">
      <div className="flex flex-wrap gap-1.5">
        {data.map((d) => {
          const intensity = Math.min(1, Math.abs(d.pnl) / maxPnl);
          const color = d.pnl >= 0
            ? `rgba(52, 211, 153, ${0.15 + intensity * 0.6})`
            : `rgba(248, 113, 113, ${0.15 + intensity * 0.6})`;

          return (
            <div
              key={d.date}
              className="group relative h-5 w-5 rounded-sm transition-transform hover:scale-150"
              style={{ background: color }}
              title={`${d.date}: $${d.pnl.toFixed(2)} (${d.count} trades)`}
            />
          );
        })}
      </div>
    </ChartCard>
  );
}

/* ── Fail Reasons Pie ──────────────────────────────────────── */

export function FailReasonsChart({ failReasons }) {
  if (!failReasons) return null;
  const data = [
    { name: 'Daily DD', value: failReasons.dailyDD, color: '#f87171' },
    { name: 'Overall DD', value: failReasons.overallDD, color: '#fb923c' },
    { name: 'No Target', value: failReasons.noTarget, color: '#fbbf24' },
    { name: 'Min Days', value: failReasons.minDays, color: '#60a5fa' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <ChartCard title="Failure Reasons">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={50} outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Legend
            formatter={(v) => <span style={{ color: '#fff', fontSize: 11 }}>{v}</span>}
          />
          <Tooltip
            contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ── Chart card wrapper ────────────────────────────────────── */

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-white/55">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */

function bucketize(values, numBuckets) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = range / numBuckets;

  const buckets = Array.from({ length: numBuckets }, (_, i) => ({
    min: min + i * step,
    max: min + (i + 1) * step,
    mid: min + (i + 0.5) * step,
    count: 0,
    label: `${(min + i * step).toFixed(0)}`,
  }));

  values.forEach((v) => {
    const idx = Math.min(numBuckets - 1, Math.floor((v - min) / step));
    buckets[idx].count++;
  });

  return buckets;
}
