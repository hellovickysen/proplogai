"use client";

import { Fragment, useMemo, useState } from "react";
import { buildPerformanceHistory, performanceCalendarMonths, performanceMonthLabel } from "@/lib/analytics-performance.mjs";
import { buildPerformanceTable } from "@/lib/analytics-performance-table.mjs";

const percent = value => value === null ? "—" : `${Math.round(value)}%`;
const money = cents => `${cents > 0 ? "+" : cents < 0 ? "−" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tone = cents => cents > 0 ? "text-emerald-400" : cents < 0 ? "text-rose-400" : "text-white/65";

function ResultCells({ row }) {
  return <>
    <td className="px-4 py-4 text-right tabular-nums">{row.trades}<span className="mt-1 block whitespace-nowrap text-[11px] font-normal text-white/45">{row.wins}W · {row.losses}L · {row.breakEven}BE</span></td>
    <td className="px-4 py-4 text-right tabular-nums">{percent(row.winRate)}</td>
    <td className={`whitespace-nowrap px-4 py-4 text-right tabular-nums ${row.trades ? tone(row.pnlCents) : "text-white/40"}`}>{row.trades ? money(row.pnlCents) : "—"}</td>
    <td className="px-4 py-4 text-right tabular-nums">{percent(row.winDayRate)}<span className="mt-1 block whitespace-nowrap text-[11px] font-normal text-white/45">{row.winDays} / {row.tradedDays} traded days</span></td>
  </>;
}

function PerformanceDetails({ row, label, id }) {
  const stats = [
    ["Avg winning trade", row.averageWinCents === null ? "—" : money(row.averageWinCents), "text-emerald-400"],
    ["Avg losing trade", row.averageLossCents === null ? "—" : money(row.averageLossCents), "text-rose-400"],
    ["Profit factor", row.profitFactor === null ? row.grossProfitCents > 0 ? "No losses" : "—" : row.profitFactor.toFixed(2), "text-white/90"],
    ["Profitable days", row.winDays, "text-emerald-400"],
    ["Losing days", row.losingDays, "text-rose-400"],
    ["Break-even days", row.flatDays, "text-white/65"],
  ];
  return <div id={id} role="region" aria-label={`${label} performance details`} className="sticky left-4 rounded-xl border border-violet-300/20 bg-violet-400/[0.04] p-3 sm:p-4" style={{ width: "calc(100cqw - 32px)" }}>
    <h3 className="text-sm font-semibold text-violet-200">{label} · Details</h3>
    <dl className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">{stats.map(([name, value, color]) => <div key={name} className="min-w-0 rounded-lg border border-white/5 bg-[#0b111b] p-3"><dt className="text-[11px] leading-4 text-white/50">{name}</dt><dd className={`mt-1 break-words text-lg font-semibold tabular-nums ${color}`}>{value}</dd></div>)}</dl>
    <p className="mt-3 text-[11px] leading-5 text-white/45">{row.trades ? `${row.trades} completed trades · ${row.tradedDays} traded dates. Trade averages exclude break-even trades. Day counts use each date’s combined net P&L in the selected accounts.` : "No completed trades in this period. Trade averages and profit factor are unavailable."}</p>
  </div>;
}

export default function PerformanceTable({ trades, scope = "All accounts", periodLabel = "All time" }) {
  const [mode, setMode] = useState("Monthly"), [year, setYear] = useState(""), [month, setMonth] = useState(""), [expanded, setExpanded] = useState(null);
  const history = useMemo(() => buildPerformanceHistory(trades), [trades]);
  const selectedYear = history.years.includes(year) ? year : history.years.at(-1);
  const months = useMemo(() => performanceCalendarMonths(history, selectedYear), [history, selectedYear]);
  const selectedMonth = months.some(row => row.key === month) ? month : months.filter(row => row.trades).at(-1)?.key || months[0]?.key;
  const result = useMemo(() => buildPerformanceTable(history, { mode, year: selectedYear, month: selectedMonth }), [history, mode, selectedYear, selectedMonth]);
  return <section aria-labelledby="performance-table-title" className="analytics-panel min-w-0 rounded-2xl border border-white/15 bg-[#0b111b] p-4 sm:p-5">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div><h2 id="performance-table-title" className="text-xl font-semibold sm:text-2xl">Performance analysis</h2><p className="mt-1 text-xs leading-5 text-white/50">{periodLabel} · {scope}. Compare monthly results or explore the weeks within a month.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex h-10 shrink-0 rounded-xl border border-white/10 bg-black/20 p-1" aria-label="Performance table interval">{["Monthly", "Weekly"].map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => { setMode(value); setExpanded(null); }} className={`h-full rounded-lg px-3 text-xs font-medium ${mode === value ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white" : "text-white/50 hover:text-white"}`}>{value}</button>)}</div>
        {history.years.length > 1 && <select aria-label="Performance table year" value={selectedYear} onChange={event => { setYear(event.target.value); setExpanded(null); }} className="h-10 rounded-lg border border-white/15 bg-[#0b111b] px-2 text-xs">{history.years.map(value => <option key={value}>{value}</option>)}</select>}
        {mode === "Weekly" && months.length > 0 && <select aria-label="Performance table month" value={selectedMonth} onChange={event => { setMonth(event.target.value); setExpanded(null); }} className="h-10 rounded-lg border border-white/15 bg-[#0b111b] px-2 text-xs">{months.map(row => <option key={row.key} value={row.key}>{performanceMonthLabel(row.key)}</option>)}</select>}
      </div>
    </div>
    <p className="mt-5 text-sm font-medium text-violet-200">{mode === "Monthly" ? `Monthly breakdown${selectedYear ? ` · ${selectedYear}` : ""}` : `Weekly breakdown${selectedMonth ? ` · ${performanceMonthLabel(selectedMonth)}` : ""}`}</p>
    <p className="mt-1 text-[11px] text-white/45">{mode === "Monthly" ? "Select a month to see its weeks." : "Weeks run Monday–Sunday and stay within the selected month."} Swipe horizontally on smaller screens.</p>
    {!result.total.trades && <p role="status" className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm text-white/60">No completed trades in this selection. Try another month or Analytics period.</p>}
    <div role="region" aria-label="Performance breakdown table" tabIndex={0} className="analytics-table-scrollbar mt-3 overflow-x-auto rounded-xl border border-white/10" style={{ containerType: "inline-size" }}>
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{mode} performance for {mode === "Monthly" ? selectedYear : selectedMonth}, {periodLabel}, {scope}</caption>
        <thead><tr className="text-xs font-normal text-white/50"><th scope="col" className="sticky left-0 z-10 border-b border-white/10 bg-[#0b111b] px-4 py-4 text-left font-normal">{mode === "Monthly" ? "Month" : "Week"}</th>{["Trades", "Win rate", "Net P&L", "Win days %"].map(label => <th scope="col" key={label} className="whitespace-nowrap border-b border-white/10 px-4 py-4 text-right font-normal">{label}</th>)}</tr></thead>
        <tbody>{result.rows.map(row => {
          const label = mode === "Monthly" ? performanceMonthLabel(row.key) : `${row.label} · ${row.detail} ${selectedYear}`;
          const id = `performance-details-${mode.toLowerCase()}-${row.key}`;
          const open = expanded === row.key;
          return <Fragment key={row.key}>
            <tr className={`text-white/90 [&>td]:border-b [&>td]:border-white/5 ${open ? "bg-violet-400/[0.04]" : ""}`}>
              <th scope="row" className="sticky left-0 z-10 border-b border-white/5 bg-[#0b111b] px-4 py-4 text-left font-medium">
                {mode === "Monthly" ? <button type="button" aria-label={`View weeks for ${label}`} onClick={() => { setMonth(row.key); setMode("Weekly"); setExpanded(null); }} className="whitespace-nowrap text-violet-200 underline-offset-4 hover:underline focus-visible:underline">{label} <span aria-hidden="true">→</span></button> : <><span className="whitespace-nowrap">{row.label}</span><span className="mt-1 block whitespace-nowrap text-[11px] font-normal text-white/45">{row.detail}</span></>}
                <button type="button" aria-label={`${open ? "Hide details" : "Details"} for ${label}`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setExpanded(open ? null : row.key)} className="mt-2 block whitespace-nowrap rounded-md border border-violet-300/20 px-2 py-1 text-[11px] text-violet-200 hover:border-violet-300/50 hover:bg-violet-400/10">{open ? "Hide details −" : "Details +"}</button>
              </th>
              <ResultCells row={row} />
            </tr>
            {open && <tr><td colSpan={5} className="border-b border-white/10 p-4"><PerformanceDetails row={row} label={label} id={id} /></td></tr>}
          </Fragment>;
        })}</tbody>
        <tfoot><tr className="bg-white/[0.035] font-semibold"><th scope="row" className="sticky left-0 z-10 bg-[#121923] px-4 py-4 text-left">Total</th><ResultCells row={result.total} /></tr></tfoot>
      </table>
    </div>
    <details className="mt-4 rounded-xl border border-white/10 p-3 text-xs text-white/55"><summary className="cursor-pointer text-cyan-200">How are these percentages calculated?</summary><div className="mt-3 space-y-2 leading-5"><p>Win rate = winning trades ÷ completed trades. Break-even trades stay in the total.</p><p>Win days % = profitable traded dates ÷ all traded dates. We add the day’s P&L across the selected accounts first; a date counts once. Losing and break-even dates stay in the total.</p><p>Average winning/losing trade = total profit/loss from those trades ÷ their count. Break-even trades are excluded from both averages. Profit factor = gross profit ÷ absolute gross loss. With wins and no losses, it displays “No losses”; with no wins or losses, it displays a dash.</p><p>Totals use the underlying trades and dates, rather than averaging the displayed percentages. Only logs within the shared Analytics period and account selection are included.</p></div></details>
  </section>;
}
