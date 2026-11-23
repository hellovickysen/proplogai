"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildPerformanceHistory, performanceCalendarMonths, performanceMonthLabel, performanceSvg, performanceWeeks, PERFORMANCE_CHART_HEIGHT } from "@/lib/analytics-performance.mjs";

async function pngFromSvg(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 2400; canvas.height = PERFORMANCE_CHART_HEIGHT * 2;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not generate the image.")), "image/png"));
  } finally { URL.revokeObjectURL(url); }
}

function SharePerformance({ rows, title, scope, period, filename, onClose }) {
  const dialogRef = useRef(null);
  const [light, setLight] = useState(true);
  const [image, setImage] = useState({ svg: null, blob: null, error: "" });
  const [notice, setNotice] = useState("");
  const [canShare, setCanShare] = useState(false);
  const svg = useMemo(() => performanceSvg({ rows, title, scope, period, light, idPrefix: "performance-share" }), [rows, title, scope, period, light]);
  const ready = image.svg === svg && image.blob;
  useEffect(() => {
    dialogRef.current.showModal();
    setCanShare(typeof navigator.share === "function" && typeof navigator.canShare === "function");
  }, []);
  useEffect(() => {
    let cancelled = false;
    setNotice("");
    pngFromSvg(svg).then((blob) => { if (!cancelled) setImage({ svg, blob, error: "" }); }).catch((error) => { if (!cancelled) setImage({ svg, blob: null, error: error.message }); });
    return () => { cancelled = true; };
  }, [svg]);
  function download() {
    if (!ready) return;
    const url = URL.createObjectURL(image.blob), link = document.createElement("a");
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("PNG downloaded.");
  }
  async function share() {
    if (!ready) return;
    const file = new File([image.blob], filename, { type: "image/png" });
    if (!navigator.canShare({ files: [file] })) { setNotice("Image sharing is unavailable here. Use Download PNG."); return; }
    try { await navigator.share({ files: [file], title }); }
    catch (error) { if (error.name !== "AbortError") setNotice("Sharing could not open. You can download the PNG instead."); }
  }
  return <dialog ref={dialogRef} aria-labelledby="performance-share-title" onCancel={onClose} onClose={onClose} className="fixed inset-0 m-auto max-h-[92vh] w-[calc(100%-24px)] max-w-5xl overflow-y-auto rounded-2xl border border-white/20 bg-[#0b111b] p-4 text-white shadow-2xl backdrop:bg-black/80 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><h2 id="performance-share-title" className="text-lg font-semibold">Share performance chart</h2><p className="mt-1 text-xs text-white/55">Preview your chart before downloading or sharing it.</p></div><button autoFocus type="button" onClick={onClose} aria-label="Close chart share preview" className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">×</button></div>
    <div className="my-4 flex gap-2" aria-label="Export appearance">{[true, false].map((value) => <button key={String(value)} type="button" aria-pressed={light === value} onClick={() => setLight(value)} className={`rounded-lg border px-3 py-1.5 text-xs ${light === value ? "border-cyan-300 text-cyan-200" : "border-white/15 text-white/60"}`}>{value ? "Light" : "Dark"}</button>)}</div>
    <div className="overflow-x-auto rounded-lg border border-white/10"><div className="min-w-[620px]" dangerouslySetInnerHTML={{ __html: svg }} /></div>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={!ready} onClick={download} className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">{ready ? "Download PNG" : "Preparing image…"}</button>{canShare && <button type="button" disabled={!ready} onClick={share} className="rounded-xl border border-white/20 px-5 py-2.5 text-sm disabled:opacity-40">Share image</button>}</div>
    <p aria-live="polite" className="mt-3 text-xs text-white/55">{image.svg === svg && image.error ? image.error : notice || "Exports contain the displayed P&L and account scope. No trade notes or screenshots are included."}</p>
  </dialog>;
}

export default function PerformanceHistory({ trades, scope = "All accounts", periodLabel = "All time" }) {
  const [mode, setMode] = useState("Monthly"), [year, setYear] = useState(""), [month, setMonth] = useState("");
  const [shareOpen, setShareOpen] = useState(false), [width, setWidth] = useState(1000);
  const containerRef = useRef(null);
  const history = useMemo(() => buildPerformanceHistory(trades), [trades]);
  const selectedYear = history.years.includes(year) ? year : history.years.at(-1);
  const months = useMemo(() => performanceCalendarMonths(history, selectedYear), [history, selectedYear]);
  const selectedMonth = months.some((item) => item.key === month) ? month : months.filter((item) => item.trades).at(-1)?.key || months[0]?.key;
  const weeks = useMemo(() => performanceWeeks(history, selectedMonth), [history, selectedMonth]);
  const monthlyRows = useMemo(() => history.months.filter((item) => item.key.startsWith(selectedYear)), [history, selectedYear]);
  const rows = mode === "Monthly" ? monthlyRows : weeks;
  const title = mode === "Monthly" ? `Monthly net P&L · ${selectedYear || "No data"}` : `Weekly net P&L · ${selectedMonth ? performanceMonthLabel(selectedMonth) : "No data"}`;
  const svg = useMemo(() => performanceSvg({ rows, title, scope, period: periodLabel, width: Math.max(width, rows.length * 110 + 116), interactive: mode === "Monthly", idPrefix: "performance-dashboard" }), [rows, title, scope, periodLabel, width, mode]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(720, Math.round(entry.contentRect.width))));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  function browse(event) {
    const bar = event.target.closest("[data-month]");
    if (!bar || mode !== "Monthly") return;
    if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    event.preventDefault(); setMonth(bar.dataset.month); setMode("Weekly");
  }
  return <section aria-labelledby="performance-history-title" className="analytics-panel relative min-w-0 overflow-hidden rounded-2xl border border-cyan-200/15 bg-[#0b111b] p-4 sm:p-5">
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><h2 id="performance-history-title" className="text-[18px] font-semibold">Performance over time</h2><p className="mt-1 text-xs text-white/45">Your logged P&L, with a closer look at every month.</p></div><div className="flex flex-wrap items-center gap-2 xl:shrink-0">
      <div className="inline-flex h-10 shrink-0 rounded-xl border border-white/10 bg-black/20 p-1" aria-label="Performance chart interval">{["Monthly", "Weekly"].map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={`h-full rounded-md px-3 text-xs font-medium ${mode === item ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-950/50" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>{item}</button>)}</div>
      <div className="flex flex-wrap items-center gap-2">
      {history.years.length > 1 && <select aria-label="Performance chart year" value={selectedYear} onChange={(event) => setYear(event.target.value)} className="h-10 rounded-lg border border-white/15 bg-[#0b111b] px-2 text-xs">{history.years.map((item) => <option key={item}>{item}</option>)}</select>}
      <select aria-label="Performance chart month" value={mode === "Monthly" ? "all" : selectedMonth || "all"} onChange={(event) => { if (event.target.value === "all") setMode("Monthly"); else { setMonth(event.target.value); setMode("Weekly"); } }} className="h-10 rounded-lg border border-white/15 bg-[#0b111b] px-2 text-xs"><option value="all">All months</option>{months.map((item) => <option key={item.key} value={item.key}>{performanceMonthLabel(item.key)}</option>)}</select>
      <button type="button" aria-label="Share performance chart" title={rows.some((row) => row.trades) ? "Share performance chart" : "No trades to share in this selection"} disabled={!rows.some((row) => row.trades)} onClick={() => setShareOpen(true)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-200/30 bg-cyan-300/10 text-cyan-100 hover:border-cyan-200/60 hover:bg-cyan-300/20 disabled:opacity-40"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></svg></button>
      </div>
    </div></div>
    {mode === "Weekly" && !rows.some((row) => row.trades) && <p role="status" className="mt-3 text-xs text-white/50">No completed trades in {selectedMonth ? performanceMonthLabel(selectedMonth) : "this month"} within the selected Analytics period.</p>}
    <div ref={containerRef} tabIndex={0} role="region" aria-label="Net P&L history chart" className="analytics-table-scrollbar mt-3 overflow-x-auto"><div style={{ minWidth: Math.max(720, rows.length * 110 + 116) }} onClick={browse} onKeyDown={browse} dangerouslySetInnerHTML={{ __html: svg }} /></div>
    <p className="mt-1 text-[10px] text-cyan-200/75 sm:hidden">Swipe horizontally to see the full chart →</p>
    <p className="mt-2 text-[10px] leading-4 text-white/40">{mode === "Monthly" ? "Choose any month, or select a bar, to see its weeks. " : "Weeks run Monday–Sunday and are clipped to the selected month. "}Uses the selected Analytics period and account scope. A dash means no logged trades; $0.00 means break-even.</p>
    {shareOpen && <SharePerformance rows={rows} title={title} scope={scope} period={periodLabel} filename={`proplogai-${mode.toLowerCase()}-pnl-${mode === "Monthly" ? selectedYear : selectedMonth}.png`} onClose={() => setShareOpen(false)} />}
  </section>;
}
