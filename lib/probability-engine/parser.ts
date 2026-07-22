/* ── Statement Parser — MT4 & MT5 CSV / Excel ──────────────── */

import type { Trade, ParseResult } from './types';

/* ── Column signature detection ────────────────────────────── */

interface BrokerSignature {
  id: string;
  name: string;
  match: (cols: string[]) => boolean;
  multiRow: boolean;
}

const SIGNATURES: BrokerSignature[] = [
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    match: (cols) =>
      cols.includes('ticket') &&
      cols.includes('type') &&
      cols.includes('volume') &&
      cols.includes('entry'),
    multiRow: true,
  },
  {
    id: 'mt4',
    name: 'MetaTrader 4',
    match: (cols) =>
      (cols.includes('ticket') || cols.includes('ticket #')) &&
      cols.includes('open time') &&
      cols.includes('close time') &&
      cols.includes('open price') &&
      cols.includes('close price'),
    multiRow: false,
  },
];

/* ── Column maps ───────────────────────────────────────────── */

type AliasMap = Record<string, string[]>;

const MT5_MAP: AliasMap = {
  id:         ['ticket'],
  date:       ['date'],
  symbol:     ['symbol'],
  type:       ['type'],
  volume:     ['volume'],
  price:      ['price'],
  stopLoss:   ['stoploss', 'stop loss', 's/l'],
  takeProfit: ['takeprofit', 'take profit', 't/p'],
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
  stopLoss:   ['s/l', 'stoploss', 'stop loss'],
  takeProfit: ['t/p', 'takeprofit', 'take profit'],
  commission: ['commission'],
  swap:       ['swap'],
  profit:     ['profit'],
};

/* ── Utilities ─────────────────────────────────────────────── */

function norm(h: string): string {
  return (h || '').toString().trim().toLowerCase().replace(/[_\-]+/g, ' ');
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
  const d = new Date(String(v).trim().replace(/\./g, '-'));
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

/* ── Excel parsing (uses SheetJS) ──────────────────────────── */

export async function parseExcel(buffer: Uint8Array): Promise<Record<string, string>[]> {
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/* ── Detect broker format ──────────────────────────────────── */

function detect(headers: string[]): BrokerSignature | null {
  const cols = headers.map(norm);
  return SIGNATURES.find((s) => s.match(cols)) ?? null;
}

/* ── Normalize MT5 (multi-row open/close pairing) ──────────── */

function normalizeMT5(rows: Record<string, string>[]): Trade[] {
  const trades: Trade[] = [];
  const opens: Record<string, Record<string, string>[]> = {};

  for (const row of rows) {
    const entryType = num(findCol(row, MT5_MAP.entry));
    const type = num(findCol(row, MT5_MAP.type));
    const symbol = findCol(row, MT5_MAP.symbol);
    if (!symbol || type > 1) continue;               // skip balance/credit rows

    if (entryType === 0) {                            // opening deal
      const key = `${symbol}_${type}`;
      (opens[key] ??= []).push(row);
    } else {                                          // closing deal
      const openKey = `${symbol}_${type === 0 ? 1 : 0}`;
      const altKey  = `${symbol}_${type}`;
      const openArr = opens[openKey] ?? opens[altKey] ?? [];
      const open    = openArr.shift();

      const profit     = num(findCol(row, MT5_MAP.profit));
      const commission = num(findCol(row, MT5_MAP.commission)) + (open ? num(findCol(open, MT5_MAP.commission)) : 0);
      const swap       = num(findCol(row, MT5_MAP.swap));
      const fee        = num(findCol(row, MT5_MAP.fee)) + (open ? num(findCol(open, MT5_MAP.fee)) : 0);

      const openDate  = open ? parseDate(findCol(open, MT5_MAP.date)) : null;
      const closeDate = parseDate(findCol(row, MT5_MAP.date));

      trades.push({
        id:         findCol(row, MT5_MAP.id) || String(trades.length + 1),
        date:       closeDate || openDate || '',
        openDate,
        closeDate,
        symbol,
        direction:  open ? (num(findCol(open, MT5_MAP.type)) === 0 ? 'buy' : 'sell') : (type === 0 ? 'buy' : 'sell'),
        entry:      open ? num(findCol(open, MT5_MAP.price)) : 0,
        exit:       num(findCol(row, MT5_MAP.price)),
        stopLoss:   num(open ? findCol(open, MT5_MAP.stopLoss) : findCol(row, MT5_MAP.stopLoss)),
        takeProfit: num(open ? findCol(open, MT5_MAP.takeProfit) : findCol(row, MT5_MAP.takeProfit)),
        lotSize:    num(findCol(row, MT5_MAP.volume)) || (open ? num(findCol(open, MT5_MAP.volume)) : 0),
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

    const symbol     = findCol(row, MT4_MAP.symbol);
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
      'Detected columns: ' + Object.keys(rows[0]).slice(0, 6).join(', '),
    );
  }

  let trades = format.id === 'mt5' ? normalizeMT5(rows) : normalizeMT4(rows);

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
