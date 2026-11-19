import { validRuleDate } from "./rulebook-history.mjs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const performanceMonthLabel = (key) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
const dateString = (date) => date.toISOString().slice(0, 10);
const money = (cents) => `${cents > 0 ? "+" : cents < 0 ? "−" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const escapeXml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]));

export function buildPerformanceHistory(input = []) {
  const trades = input.filter((trade) => validRuleDate(trade.trade_date) && trade.pnl !== null && trade.pnl !== undefined && trade.pnl !== "" && Number.isFinite(Number(trade.pnl)));
  const groups = new Map();
  for (const trade of trades) {
    const key = trade.trade_date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(trade);
  }
  const keys = [...groups.keys()].sort();
  const years = [...new Set(keys.map((key) => key.slice(0, 4)))];
  const months = [];
  for (const year of years) {
    const yearKeys = keys.filter((key) => key.startsWith(year));
    for (let month = Number(yearKeys[0].slice(5)); month <= Number(yearKeys.at(-1).slice(5)); month += 1) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const rows = groups.get(key) || [];
      months.push({ key, label: MONTHS[month - 1], detail: year, trades: rows.length, pnlCents: rows.reduce((sum, trade) => sum + Math.round(Number(trade.pnl) * 100), 0) });
    }
  }
  return { trades, years, months };
}

export function performanceCalendarMonths(history, year) {
  if (!/^\d{4}$/.test(year || "") || !validRuleDate(`${year}-01-01`)) return [];
  const observed = new Map((history.months || []).map((row) => [row.key, row]));
  return Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    return observed.get(key) || { key, label: MONTHS[index], detail: year, trades: 0, pnlCents: 0 };
  });
}

export function performanceWeeks(history, month) {
  if (!/^\d{4}-\d{2}$/.test(month || "") || !validRuleDate(month + "-01")) return [];
  const first = new Date(month + "-01T00:00:00Z");
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  const rows = [];
  let start = first;
  while (start <= last) {
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + (7 - end.getUTCDay()) % 7);
    if (end > last) end.setTime(last.getTime());
    const from = dateString(start), to = dateString(end);
    const trades = history.trades.filter((trade) => trade.trade_date >= from && trade.trade_date <= to);
    rows.push({ key: from, label: `Week ${rows.length + 1}`, detail: `${start.getUTCDate()}–${end.getUTCDate()} ${MONTHS[first.getUTCMonth()]}`, from, to, trades: trades.length, pnlCents: trades.reduce((sum, trade) => sum + Math.round(Number(trade.pnl) * 100), 0) });
    start = new Date(end);
    start.setUTCDate(start.getUTCDate() + 1);
  }
  return rows;
}

export function performanceDomain(rows) {
  const values = rows.filter((row) => row.trades).map((row) => row.pnlCents);
  let low = Math.min(0, ...values), high = Math.max(0, ...values);
  if (low === high) high = 100;
  const rough = (high - low) / 4;
  const scale = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].find((factor) => factor * scale >= rough) * scale;
  low = Math.floor(low / step) * step;
  high = Math.ceil(high / step) * step;
  return { low, high, step };
}

export const PERFORMANCE_CHART_HEIGHT = 560;

// The same self-contained, escaped SVG powers the dashboard and PNG artwork.
export function performanceSvg({ rows, title, scope, period, width = 1200, light = false, interactive = false, idPrefix = "performance" }) {
  const prefix = String(idPrefix).replace(/[^a-z0-9_-]/gi, "") || "performance";
  const height = PERFORMANCE_CHART_HEIGHT, left = 80, right = width - 28, top = 196, bottom = 414;
  const domain = performanceDomain(rows);
  const y = (value) => bottom - (value - domain.low) / (domain.high - domain.low) * (bottom - top);
  const baseline = y(0), slot = (right - left) / Math.max(rows.length, 1), barWidth = Math.min(116, slot * 0.44);
  const text = light ? "#172536" : "#f0f5fc", muted = light ? "#728094" : "#8193ac", grid = light ? "#dfe7f1" : "#29384c";
  const green = light ? "#128263" : "#5ce8bd", red = light ? "#c53f59" : "#ff8598";
  const logged = rows.filter((row) => row.trades > 0), profitable = logged.filter((row) => row.pnlCents > 0).length;
  const highest = logged.reduce((best, row) => !best || row.pnlCents > best.pnlCents ? row : best, null);
  const total = rows.reduce((sum, row) => sum + row.pnlCents, 0), count = rows.reduce((sum, row) => sum + row.trades, 0);
  const toneFor = (value) => value > 0 ? green : value < 0 ? red : muted;
  const isWeekly = title.startsWith("Weekly");
  const periodWord = isWeekly ? "weeks" : "months";
  const statX = Math.round(width * 0.46), statGap = 12, statWidth = (width - statX - 24 - statGap) / 2;
  const ticks = [];
  for (let value = domain.low; value <= domain.high + domain.step / 2; value += domain.step) {
    if (value === 0) continue;
    ticks.push(`<line x1="${left}" x2="${right}" y1="${y(value)}" y2="${y(value)}" stroke="${grid}" stroke-opacity="${light ? ".8" : ".55"}" stroke-dasharray="3 6"/><text x="${left - 13}" y="${y(value) + 4}" text-anchor="end" fill="${muted}" font-size="11">${value < 0 ? "−" : ""}$${(Math.abs(value) / 100).toLocaleString("en-US")}</text>`);
  }
  const bars = rows.map((row, index) => {
    const x = left + slot * (index + 0.5), valueY = y(row.pnlCents), tone = toneFor(row.pnlCents);
    const label = row.trades ? money(row.pnlCents) : "—";
    const fontSize = Math.max(9, Math.min(13, (slot - 24) / label.length * 1.65));
    const pillWidth = Math.min(slot - 8, Math.max(70, label.length * fontSize * 0.59 + 22));
    const pillY = row.pnlCents >= 0 ? valueY - 34 : valueY + 12;
    const accessible = `${row.label} ${row.detail}: ${row.trades ? money(row.pnlCents) : "No trades"}, ${row.trades} completed trades`;
    const positive = row.pnlCents > 0, negative = row.pnlCents < 0;
    const gradient = positive ? `url(#${prefix}-positive)` : negative ? `url(#${prefix}-negative)` : muted;
    const highestMark = highest?.key === row.key && positive;
    return `<g${interactive && row.trades ? ` data-month="${escapeXml(row.key)}" role="button" tabindex="0" class="performance-month" style="cursor:pointer"` : ""} aria-label="${escapeXml(accessible)}">${interactive && row.trades ? `<rect class="performance-hit" x="${x - slot / 2 + 5}" y="177" width="${slot - 10}" height="350" rx="12" fill="transparent"/>` : ""}<title>${escapeXml(accessible)}</title>${highestMark ? `<rect x="${x - barWidth / 2 - 5}" y="${valueY - 5}" width="${barWidth + 10}" height="${Math.max(2, Math.abs(baseline - valueY)) + 10}" rx="9" fill="none" stroke="${green}" stroke-opacity=".22"/>` : ""}${row.trades ? `<rect x="${x - barWidth / 2}" y="${Math.min(baseline, valueY)}" width="${barWidth}" height="${Math.max(2, Math.abs(baseline - valueY))}" rx="6" fill="${gradient}"/><rect x="${x - pillWidth / 2}" y="${pillY}" width="${pillWidth}" height="24" rx="8" fill="${light ? positive ? "#eaf8f1" : negative ? "#fff0f2" : "#f0f3f7" : positive ? "#102f29" : negative ? "#331f2a" : "#1c2838"}" stroke="${tone}" stroke-opacity=".16"/><text x="${x}" y="${pillY + 16}" text-anchor="middle" fill="${tone}" font-size="${fontSize}" font-weight="700">${label}</text>` : `<text x="${x}" y="${baseline - 14}" text-anchor="middle" fill="${muted}" font-size="13">—</text>`}<text x="${x}" y="474" text-anchor="middle" fill="${highestMark ? tone : text}" font-size="14" font-weight="${highestMark ? "700" : "500"}">${escapeXml(row.label)}</text><text x="${x}" y="494" text-anchor="middle" fill="${muted}" font-size="11">${escapeXml(row.detail)}</text><text x="${x}" y="514" text-anchor="middle" fill="${muted}" font-size="10">${row.trades ? `${row.trades} trades` : "No trades"}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}" style="display:block;width:100%;height:auto;font-family:Arial,sans-serif"><defs><linearGradient id="${prefix}-surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light ? "#f8fbff" : "#101d2e"}"/><stop offset="1" stop-color="${light ? "#ffffff" : "#0b111b"}"/></linearGradient><linearGradient id="${prefix}-positive" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${light ? "#28bf91" : "#68efc8"}"/><stop offset="1" stop-color="${light ? "#109773" : "#16b88e"}"/></linearGradient><linearGradient id="${prefix}-negative" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${light ? "#f17b8d" : "#ff9aa8"}"/><stop offset="1" stop-color="${light ? "#ce405b" : "#ee526f"}"/></linearGradient></defs><style>.performance-month:hover .performance-hit,.performance-month:focus-visible .performance-hit{fill:${light ? "#edf3f9" : "#16263a"}}.performance-month:focus-visible{outline:2px solid #38bdf8;outline-offset:-2px}</style><rect width="100%" height="100%" rx="14" fill="url(#${prefix}-surface)"/><text x="26" y="31" fill="${text}" font-size="19" font-weight="700">${escapeXml(title)}</text><text x="26" y="53" fill="${muted}" font-size="11">${escapeXml(period)} · ${escapeXml(scope)} · ${count} completed trades</text><text x="26" y="82" fill="${muted}" font-size="10" letter-spacing="1.5">NET P&amp;L</text><text x="24" y="127" fill="${toneFor(total)}" font-size="${width < 900 ? 38 : 44}" font-weight="700" letter-spacing="-1">${money(total)}</text><text x="26" y="148" fill="${muted}" font-size="10">Logged results · USD</text><rect x="${statX}" y="74" width="${statWidth}" height="82" rx="12" fill="${light ? "#ffffff" : "#122034"}" stroke="${grid}" stroke-opacity=".65"/><text x="${statX + 16}" y="96" fill="${muted}" font-size="11">Profitable ${periodWord}</text><text x="${statX + 16}" y="128" fill="${green}" font-size="27" font-weight="700">${profitable}<tspan fill="${muted}" font-size="16" font-weight="400"> / ${logged.length}</tspan></text><text x="${statX + 16}" y="145" fill="${muted}" font-size="9">With completed trades</text><rect x="${statX + statWidth + statGap}" y="74" width="${statWidth}" height="82" rx="12" fill="${light ? "#ffffff" : "#122034"}" stroke="${grid}" stroke-opacity=".65"/><text x="${statX + statWidth + statGap + 16}" y="96" fill="${muted}" font-size="11">Highest ${isWeekly ? "week" : "month"}${highest ? ` · ${escapeXml(highest.label)}` : ""}</text><text x="${statX + statWidth + statGap + 16}" y="128" fill="${highest ? toneFor(highest.pnlCents) : muted}" font-size="${width < 900 ? 19 : 23}" font-weight="700">${highest ? money(highest.pnlCents) : "—"}</text><text x="${statX + statWidth + statGap + 16}" y="145" fill="${muted}" font-size="9">${highest ? highest.trades + " completed trades" : "No logged trades"}</text><line x1="24" x2="${width - 24}" y1="171" y2="171" stroke="${grid}" stroke-opacity=".5"/><text x="26" y="187" fill="${muted}" font-size="9">Net P&amp;L (USD)</text>${ticks.join("")}<text x="${left - 13}" y="${baseline + 4}" text-anchor="end" fill="${muted}" font-size="11">$0</text><line x1="${left}" x2="${right}" y1="${baseline}" y2="${baseline}" stroke="${muted}" stroke-opacity=".65"/>${bars}<text x="26" y="546" fill="${muted}" font-size="9">PropLogAI · Historical logs only. Past outcomes do not predict future results.</text></svg>`;
}
