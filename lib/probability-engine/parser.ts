/* ── Statement Parser — MT4 & MT5 CSV / Excel ──────────────── */

import type { Trade, ParseResult } from './types';

/* ── Column signature detection ────────────────────────────── */

interface BrokerSignature {
  id: string;
  name: string;
  match: (cols: string[]) => boolean;
}

const SIGNATURES: BrokerSignature[] = [
  {
    // MT5 Positions export (single-row: open+close on same line)
    // Columns: Time, Position, Symbol, Type, Volume, Price, S/L, T/P, Time, Price, Commission, Swap, Profit
    id: 'mt5-positions',
    name: 'MetaTrader 5',
    match: (cols) =>
      cols.includes('symbol') &&
      cols.includes('type') &&
      cols.includes('volume') &&
      (cols.includes('position') || cols.includes('ticket')) &&
      cols.includes('profit'),
  },
  {
    // MT5 Deals export (multi-row: separate open/close rows)
    id: 'mt5-deals',
    name: 'MetaTrader 5',
    match: (cols) =>
      cols.includes('ticket') &&
      cols.includes('type') &&
      cols.includes('volume') &&
      cols.includes('entry'),
  },
  {
    // MT4 export (single-row)
    id: 'mt4',
    name: 'MetaTrader 4',
    match: (cols) =>
      (cols.includes('ticket') || cols.includes('ticket #')) &&
      cols.includes('open time') &&
      cols.includes('close time') &&
      cols.includes('open price') &&
      cols.includes('close price'),
  },
];

/* ── Column maps ───────────────────────────────────────────── */

type AliasMap = Record<string, string[]>;

const MT5_POSITIONS_MAP: AliasMap = {
  id:         ['position', 'ticket', 'deal'],
  symbol:     ['symbol'],
  type:       ['type'],
  volume:     ['volume'],
  stopLoss:   ['s / l', 's/l', 'stoploss', 'stop loss', 's \\ l'],
  takeProfit: ['t / p', 't/p', 'takeprofit', 'take profit', 't \\ p'],
  commission: ['commission'],
  swap:       ['swap'],
  profit:     ['profit'],
};

const MT5_DEALS_MAP: AliasMap = {
  id:         ['ticket'],
  date:       ['date', 'time'],
  symbol:     ['symbol'],
  type:       ['type'],
  volume:     ['volume'],
  price:      ['price'],
  stopLoss:   ['stoploss', 'stop loss', 's/l', 's / l'],
  takeProfit: ['takeprofit', 'take profit', 't/p', 't / p'],
  profit:     ['profit'],
  commission: ['commission'],
  swap:       ['swap'],
  fee:        ['fee'],
  entry:      ['entry'],
};

const MT4_MAP: AliasMap = {
  id:         ['ticket', 'ticket #', 'ticket#'],
  openTime:   ['open time'],
  closeTime:  ['close time'],
  type:       ['type'],
  volume:     ['size', 'lot size', 'lots', 'volume'],
  symbol:     ['symbol'],
  openPrice:  ['open price'],
  closePrice: ['close price'],
  stopLoss:   ['s/l', 'stoploss', 'stop loss', 's / l'],
  takeProfit: ['t/p', 'takeprofit', 'take profit', 't / p'],
  commission: ['commission'],
  swap:       ['swap'],
  profit:     ['profit'],
};

/* ── Utilities ─────────────────────────────────────────────── */

function norm(h: string): string {
  return (h || '').toString().trim().toLowerCase();
}

function findCol(row: Record<string, string>, aliases: string[]): string | null {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => norm(k) === alias);
    if (found && row[found] !== undefined && row[found] !== '') return row[found];
  }
  return null;
}

function num(v: string | null): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/[,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseDate(v: string | null): string | null {
  if (!v) return null;
  const s = String(v).trim();
  // Handle YYYY.MM.DD HH:MM:SS format (MT4/MT5)
  const dotFmt = s.replace(/\./g, '-');
  const d = new Date(dotFmt);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/* ── CSV parsing (uses PapaParse) ──────────────────────────── */

export async function parseCSV(text: string): Promise<Record<string, string>[]> {
  const Papa = (await import('papaparse')).default;
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (r: any) => (r.data.length > 0 ? resolve(r.data) : reject(new Error('No rows found in CSV.'))),
      error: (e: any) => reject(e),
    });
  });
}

/* ── Excel parsing — finds the real header row ─────────────── */

export async function parseExcel(buffer: Uint8Array): Promise<Record<string, string>[]> {
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  // Read ALL rows as raw arrays first (no header assumption)
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Find the actual header row by scanning for a row containing trading keywords
  const HEADER_KEYWORDS = ['symbol', 'type', 'volume', 'profit'];
  let headerIdx = -1;

  for (let i = 0; i < Math.min(20, rawRows.length); i++) {
    const cells = rawRows[i].map((c: any) => norm(String(c)));
    const matchCount = HEADER_KEYWORDS.filter((kw) => cells.some((c: string) => c === kw)).length;
    if (matchCount >= 3) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error('Could not find column headers in Excel file. Expected columns like Symbol, Type, Volume, Profit.');
  }

  // Build proper header-keyed rows
  const headers = rawRows[headerIdx].map((c: any) => String(c).trim());

  // MT5 Positions format has duplicate column names: two "Time" and two "Price" columns
  // Rename duplicates: Time → Open Time / Close Time, Price → Open Price / Close Price
  const seenHeaders: Record<string, number> = {};
  const resolvedHeaders = headers.map((h: string) => {
    const lower = h.toLowerCase();
    if (!seenHeaders[lower]) {
      seenHeaders[lower] = 1;
      return h;
    }
    seenHeaders[lower]++;
    // For MT5: first Time = Open Time, second Time = Close Time
    if (lower === 'time') return 'Close Time';
    if (lower === 'price') return 'Close Price';
    return h + ' ' + seenHeaders[lower];
  });

  // Rename first occurrences to be explicit
  const firstTimeIdx = resolvedHeaders.findIndex((h: string) => h.toLowerCase() === 'time');
  if (firstTimeIdx >= 0) resolvedHeaders[firstTimeIdx] = 'Open Time';
  const firstPriceIdx = resolvedHeaders.findIndex((h: string) => h.toLowerCase() === 'price');
  if (firstPriceIdx >= 0) resolvedHeaders[firstPriceIdx] = 'Open Price';

  const result: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    // Skip empty rows or section headers
    if (!row[0] || String(row[0]).trim() === '') continue;
    // Skip non-data rows (section labels like "Orders", "Deals", "Results", etc.)
    const firstCell = String(row[0]).trim();
    if (firstCell.length < 5 && isNaN(Number(firstCell[0]))) continue;
    // Skip rows that don't start with a date-like value or number
    if (!/^\d/.test(firstCell)) continue;

    const obj: Record<string, string> = {};
    resolvedHeaders.forEach((h: string, idx: number) => {
      if (h) obj[h] = row[idx] !== undefined ? String(row[idx]) : '';
    });
    result.push(obj);
  }

  return result;
}

/* ── Detect broker format ──────────────────────────────────── */

function detect(headers: string[]): BrokerSignature | null {
  const cols = headers.map(norm);
  return SIGNATURES.find((s) => s.match(cols)) ?? null;
}

/* ── Normalize MT5 Positions (single-row) ──────────────────── */

function normalizeMT5Positions(rows: Record<string, string>[]): Trade[] {
  const trades: Trade[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const symbol = findCol(row, MT5_POSITIONS_MAP.symbol);
    if (!symbol) continue;

    const type = (findCol(row, MT5_POSITIONS_MAP.type) || '').toLowerCase();
    if (type !== 'buy' && type !== 'sell') continue;

    const profit     = num(findCol(row, MT5_POSITIONS_MAP.profit));
    const commission = num(findCol(row, MT5_POSITIONS_MAP.commission));
    const swap       = num(findCol(row, MT5_POSITIONS_MAP.swap));

    // Find open/close time and price using resolved header names
    const openTime  = row['Open Time']  || findCol(row, ['open time', 'time']);
    const closeTime = row['Close Time'] || findCol(row, ['close time']);
    const openPrice  = row['Open Price']  || findCol(row, ['open price', 'price']);
    const closePrice = row['Close Price'] || findCol(row, ['close price']);

    trades.push({
      id:         findCol(row, MT5_POSITIONS_MAP.id) || String(i + 1),
      date:       parseDate(closeTime) || parseDate(openTime) || '',
      openDate:   parseDate(openTime),
      closeDate:  parseDate(closeTime),
      symbol:     symbol.trim(),
      direction:  type as 'buy' | 'sell',
      entry:      num(openPrice),
      exit:       num(closePrice),
      stopLoss:   num(findCol(row, MT5_POSITIONS_MAP.stopLoss)),
      takeProfit: num(findCol(row, MT5_POSITIONS_MAP.takeProfit)),
      lotSize:    num(findCol(row, MT5_POSITIONS_MAP.volume)),
      profit,
      commission,
      swap,
      netProfit:  profit + commission + swap,
      duration:   0,
    });
  }

  return trades;
}

/* ── Normalize MT5 Deals (multi-row open/close pairing) ───── */

function normalizeMT5Deals(rows: Record<string, string>[]): Trade[] {
  const trades: Trade[] = [];
  const opens: Record<string, Record<string, string>[]> = {};

  for (const row of rows) {
    const entryType = num(findCol(row, MT5_DEALS_MAP.entry));
    const type = num(findCol(row, MT5_DEALS_MAP.type));
    const symbol = findCol(row, MT5_DEALS_MAP.symbol);
    if (!symbol || type > 1) continue;

    if (entryType === 0) {
      const key = `${symbol}_${type}`;
      (opens[key] ??= []).push(row);
    } else {
      const openKey = `${symbol}_${type === 0 ? 1 : 0}`;
      const altKey  = `${symbol}_${type}`;
      const openArr = opens[openKey] ?? opens[altKey] ?? [];
      const open    = openArr.shift();

      const profit     = num(findCol(row, MT5_DEALS_MAP.profit));
      const commission = num(findCol(row, MT5_DEALS_MAP.commission)) + (open ? num(findCol(open, MT5_DEALS_MAP.commission)) : 0);
      const swap       = num(findCol(row, MT5_DEALS_MAP.swap));
      const fee        = num(findCol(row, MT5_DEALS_MAP.fee)) + (open ? num(findCol(open, MT5_DEALS_MAP.fee)) : 0);

      const openDate  = open ? parseDate(findCol(open, MT5_DEALS_MAP.date)) : null;
      const closeDate = parseDate(findCol(row, MT5_DEALS_MAP.date));

      trades.push({
        id:         findCol(row, MT5_DEALS_MAP.id) || String(trades.length + 1),
        date:       closeDate || openDate || '',
        openDate,
        closeDate,
        symbol,
        direction:  open ? (num(findCol(open, MT5_DEALS_MAP.type)) === 0 ? 'buy' : 'sell') : (type === 0 ? 'buy' : 'sell'),
        entry:      open ? num(findCol(open, MT5_DEALS_MAP.price)) : 0,
        exit:       num(findCol(row, MT5_DEALS_MAP.price)),
        stopLoss:   num(open ? findCol(open, MT5_DEALS_MAP.stopLoss) : findCol(row, MT5_DEALS_MAP.stopLoss)),
        takeProfit: num(open ? findCol(open, MT5_DEALS_MAP.takeProfit) : findCol(row, MT5_DEALS_MAP.takeProfit)),
        lotSize:    num(findCol(row, MT5_DEALS_MAP.volume)) || (open ? num(findCol(open, MT5_DEALS_MAP.volume)) : 0),
        profit,
        commission,
        swap:       swap + fee,
        netProfit:  profit + commission + swap + fee,
        duration:   0,
      });
    }
  }
  return trades;
}

/* ── Normalize MT4 (single-row) ────────────────────────────── */

function normalizeMT4(rows: Record<string, string>[]): Trade[] {
  const trades: Trade[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const t = (findCol(row, MT4_MAP.type) || '').toLowerCase();
    if (t !== 'buy' && t !== 'sell') continue;

    const symbol = findCol(row, MT4_MAP.symbol);
    if (!symbol) continue;

    const profit     = num(findCol(row, MT4_MAP.profit));
    const commission = num(findCol(row, MT4_MAP.commission));
    const swap       = num(findCol(row, MT4_MAP.swap));
    const openTime   = findCol(row, MT4_MAP.openTime);
    const closeTime  = findCol(row, MT4_MAP.closeTime);

    trades.push({
      id:         findCol(row, MT4_MAP.id) || String(i + 1),
      date:       parseDate(closeTime) || parseDate(openTime) || '',
      openDate:   parseDate(openTime),
      closeDate:  parseDate(closeTime),
      symbol:     symbol.trim(),
      direction:  t as 'buy' | 'sell',
      entry:      num(findCol(row, MT4_MAP.openPrice)),
      exit:       num(findCol(row, MT4_MAP.closePrice)),
      stopLoss:   num(findCol(row, MT4_MAP.stopLoss)),
      takeProfit: num(findCol(row, MT4_MAP.takeProfit)),
      lotSize:    num(findCol(row, MT4_MAP.volume)),
      profit,
      commission,
      swap,
      netProfit:  profit + commission + swap,
      duration:   0,
    });
  }
  return trades;
}

/* ── Main entry point ──────────────────────────────────────── */

export async function parseTrades(
  fileContent: string | Uint8Array,
  fileName: string,
): Promise<ParseResult> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  let rows: Record<string, string>[];
  if (ext === 'xlsx' || ext === 'xls') {
    rows = await parseExcel(fileContent as Uint8Array);
  } else {
    const text = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
    rows = await parseCSV(text);
  }

  if (!rows.length) throw new Error('No data found in file.');

  const format = detect(Object.keys(rows[0]));
  if (!format) {
    throw new Error(
      'Could not detect broker format. Supported formats: MT4 CSV/Excel, MT5 CSV/Excel.\n\n' +
      'Detected columns: ' + Object.keys(rows[0]).slice(0, 8).join(', '),
    );
  }

  let trades: Trade[];
  switch (format.id) {
    case 'mt5-positions': trades = normalizeMT5Positions(rows); break;
    case 'mt5-deals':     trades = normalizeMT5Deals(rows); break;
    case 'mt4':           trades = normalizeMT4(rows); break;
    default:              trades = []; break;
  }

  if (trades.length < 10) {
    throw new Error(
      `Only ${trades.length} closed trade${trades.length === 1 ? '' : 's'} found. ` +
      'A minimum of 10 closed trades is required for meaningful analysis.',
    );
  }

  // Sort by date and compute duration
  trades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  trades.forEach((t) => {
    if (t.openDate && t.closeDate) {
      t.duration = (new Date(t.closeDate).getTime() - new Date(t.openDate).getTime()) / 60000;
    }
  });

  return { broker: format.name, trades, tradeCount: trades.length };
}
