/**
 * Statement Import Engine
 * Supports MT5 CSV, MT5 Excel, MT4 CSV, cTrader CSV, DXTrade CSV
 * Auto-detects broker format via column header matching.
 * Never hardcodes columns — uses parser mapping.
 */

import Papa from 'papaparse';

/* ── Column Signature Maps ─────────────────────────────────── */

const BROKER_SIGNATURES = [
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    // MT5 deals export has these distinctive columns
    match: (cols) =>
      cols.includes('ticket') &&
      cols.includes('type') &&
      cols.includes('volume') &&
      cols.includes('entry'),
    multiRow: true, // open and close are separate rows
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
  {
    id: 'ctrader',
    name: 'cTrader',
    match: (cols) =>
      cols.includes('opening direction') &&
      cols.includes('closing direction') &&
      cols.includes('entry price') &&
      cols.includes('closing price'),
    multiRow: false,
  },
  {
    id: 'dxtrade',
    name: 'DXTrade',
    match: (cols) =>
      cols.includes('side') &&
      cols.includes('entry price') &&
      cols.includes('exit price') &&
      (cols.includes('real p&l') || cols.includes('pnl') || cols.includes('p&l')),
    multiRow: false,
  },
];

/* ── Column Mapping per Broker ─────────────────────────────── */

const COLUMN_MAPS = {
  mt5: {
    id: ['ticket'],
    date: ['date'],
    symbol: ['symbol'],
    type: ['type'],
    volume: ['volume'],
    price: ['price'],
    stopLoss: ['stoploss', 'stop loss', 's/l'],
    takeProfit: ['takeprofit', 'take profit', 't/p'],
    profit: ['profit'],
    commission: ['commission'],
    swap: ['swap'],
    fee: ['fee'],
    entry: ['entry'],
    comment: ['comment'],
  },
  mt4: {
    id: ['ticket', 'ticket #', 'ticket#'],
    openTime: ['open time'],
    closeTime: ['close time'],
    type: ['type'],
    volume: ['size', 'lot size', 'lots', 'volume'],
    symbol: ['symbol'],
    openPrice: ['open price'],
    closePrice: ['close price'],
    stopLoss: ['s/l', 'stoploss', 'stop loss'],
    takeProfit: ['t/p', 'takeprofit', 'take profit'],
    commission: ['commission'],
    swap: ['swap'],
    profit: ['profit'],
  },
  ctrader: {
    id: ['id'],
    symbol: ['symbol'],
    direction: ['opening direction'],
    openTime: ['opening time'],
    closeTime: ['closing time'],
    openPrice: ['entry price'],
    closePrice: ['closing price'],
    volume: ['closing quantity', 'volume', 'quantity'],
    commission: ['commissions', 'commission'],
    swap: ['swap'],
    profit: ['net (usd)', 'net', 'gross (usd)', 'gross'],
    pips: ['pips'],
  },
  dxtrade: {
    id: ['order id', 'orderid', 'id'],
    symbol: ['symbol'],
    direction: ['side'],
    openTime: ['entry time', 'open time'],
    closeTime: ['exit time', 'close time'],
    openPrice: ['entry price', 'open price'],
    closePrice: ['exit price', 'close price'],
    volume: ['volume', 'quantity', 'size'],
    commission: ['commission'],
    swap: ['swap'],
    profit: ['real p&l', 'pnl', 'p&l', 'profit'],
    stopLoss: ['stop loss', 'sl'],
    takeProfit: ['take profit', 'tp'],
  },
};

/* ── Utilities ─────────────────────────────────────────────── */

function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase().replace(/[_\-]+/g, ' ');
}

function findCol(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => normalizeHeader(k) === alias);
    if (found && row[found] !== undefined && row[found] !== '') return row[found];
  }
  return null;
}

function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  const cleaned = String(v).replace(/[,\s]/g, '').replace(/[()]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  // Handle YYYY.MM.DD HH:MM:SS format (MT4/MT5)
  const dotFmt = s.replace(/\./g, '-');
  const d = new Date(dotFmt);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/* ── Detect Broker Format ──────────────────────────────────── */

export function detectFormat(headers) {
  const normalized = headers.map(normalizeHeader);
  for (const sig of BROKER_SIGNATURES) {
    if (sig.match(normalized)) return sig;
  }
  return null;
}

/* ── Parse CSV string ──────────────────────────────────────── */

export function parseCSV(csvString) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error('Failed to parse CSV: ' + results.errors[0]?.message));
        } else {
          resolve(results.data);
        }
      },
      error: (err) => reject(err),
    });
  });
}

/* ── Parse Excel buffer ────────────────────────────────────── */

export async function parseExcel(buffer) {
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/* ── Normalize MT5 deals (multi-row pairing) ───────────────── */

function normalizeMT5(rows) {
  const map = COLUMN_MAPS.mt5;
  const trades = [];

  // MT5 type enum: 0=buy, 1=sell
  // MT5 entry enum: 0=in, 1=out, 2=in/out, 3=out/by
  // Group deals by symbol + magic to pair open/close
  const openDeals = {};

  for (const row of rows) {
    const entryType = num(findCol(row, map.entry));
    const type = num(findCol(row, map.type));
    const symbol = findCol(row, map.symbol);
    const ticket = findCol(row, map.id);

    if (!symbol || symbol === '') continue;
    // Skip balance/credit operations
    if (type > 1) continue;

    if (entryType === 0) {
      // Entry deal
      const key = `${symbol}_${type}`;
      openDeals[key] = openDeals[key] || [];
      openDeals[key].push(row);
    } else if (entryType === 1 || entryType === 2 || entryType === 3) {
      // Exit deal — pair with earliest open of same symbol + direction
      const key = `${symbol}_${type === 0 ? 1 : 0}`;
      // Actually for closing, the type is opposite direction for the close
      // Let's try matching same symbol
      const openKey = `${symbol}_${type === 0 ? 0 : 1}`;
      const altKey = `${symbol}_${type}`;
      const openArr = openDeals[openKey] || openDeals[altKey] || [];
      const openDeal = openArr.shift();

      const direction = type === 0 ? 'buy' : 'sell';
      const profit = num(findCol(row, map.profit));
      const commission = num(findCol(row, map.commission)) + num(openDeal ? findCol(openDeal, map.commission) : 0);
      const swap = num(findCol(row, map.swap));
      const fee = num(findCol(row, map.fee)) + num(openDeal ? findCol(openDeal, map.fee) : 0);

      trades.push({
        id: ticket || String(trades.length + 1),
        date: parseDate(findCol(row, map.date)) || parseDate(openDeal ? findCol(openDeal, map.date) : null),
        openDate: openDeal ? parseDate(findCol(openDeal, map.date)) : null,
        closeDate: parseDate(findCol(row, map.date)),
        symbol: symbol,
        direction: openDeal ? (num(findCol(openDeal, map.type)) === 0 ? 'buy' : 'sell') : direction,
        entry: openDeal ? num(findCol(openDeal, map.price)) : 0,
        exit: num(findCol(row, map.price)),
        stopLoss: num(openDeal ? findCol(openDeal, map.stopLoss) : findCol(row, map.stopLoss)),
        takeProfit: num(openDeal ? findCol(openDeal, map.takeProfit) : findCol(row, map.takeProfit)),
        lotSize: num(findCol(row, map.volume)) || (openDeal ? num(findCol(openDeal, map.volume)) : 0),
        profit: profit,
        commission: commission,
        swap: swap + fee,
        netProfit: profit + commission + swap + fee,
      });
    }
  }

  // Handle unpaired: treat remaining open deals as standalone if they have profit
  return trades;
}

/* ── Normalize single-row brokers ──────────────────────────── */

function normalizeSingleRow(rows, brokerId) {
  const map = COLUMN_MAPS[brokerId];
  if (!map) return [];

  return rows
    .map((row, i) => {
      const symbol = findCol(row, map.symbol);
      if (!symbol) return null;

      let direction;
      if (brokerId === 'mt4') {
        const t = (findCol(row, map.type) || '').toString().toLowerCase();
        if (t !== 'buy' && t !== 'sell') return null; // skip balance rows
        direction = t;
      } else {
        direction = (findCol(row, map.direction) || '').toString().toLowerCase();
        if (direction !== 'buy' && direction !== 'sell') return null;
      }

      const profit = num(findCol(row, map.profit));
      const commission = num(findCol(row, map.commission));
      const swap = num(findCol(row, map.swap));

      const openTime = findCol(row, map.openTime);
      const closeTime = findCol(row, map.closeTime);

      return {
        id: findCol(row, map.id) || String(i + 1),
        date: parseDate(closeTime) || parseDate(openTime),
        openDate: parseDate(openTime),
        closeDate: parseDate(closeTime),
        symbol: symbol.toString().trim(),
        direction,
        entry: num(findCol(row, map.openPrice)),
        exit: num(findCol(row, map.closePrice)),
        stopLoss: num(findCol(row, map.stopLoss)),
        takeProfit: num(findCol(row, map.takeProfit)),
        lotSize: num(findCol(row, map.volume)),
        profit,
        commission,
        swap,
        netProfit: profit + commission + swap,
      };
    })
    .filter(Boolean);
}

/* ── Main parse + normalize pipeline ───────────────────────── */

export async function parseAndNormalize(fileContent, fileName) {
  let rows;
  const ext = (fileName || '').split('.').pop().toLowerCase();

  if (ext === 'xlsx' || ext === 'xls') {
    rows = await parseExcel(fileContent);
  } else {
    // CSV or text
    const text = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
    rows = await parseCSV(text);
  }

  if (!rows || rows.length === 0) {
    throw new Error('No data found in file. Please check the file format.');
  }

  // Detect format from headers
  const headers = Object.keys(rows[0]);
  const format = detectFormat(headers);

  if (!format) {
    throw new Error(
      'Could not detect broker format. Supported: MT5 CSV, MT4 CSV, cTrader CSV, DXTrade CSV, MT5/MT4 Excel.\n\n' +
      'Detected columns: ' + headers.slice(0, 8).join(', ')
    );
  }

  let trades;
  if (format.id === 'mt5') {
    trades = normalizeMT5(rows);
  } else {
    trades = normalizeSingleRow(rows, format.id);
  }

  if (trades.length === 0) {
    throw new Error(
      `Detected ${format.name} format but found no valid trades. ` +
      'Make sure the file contains closed trade history.'
    );
  }

  // Sort by date
  trades.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute duration for each trade
  trades.forEach((t) => {
    if (t.openDate && t.closeDate) {
      t.duration = (new Date(t.closeDate) - new Date(t.openDate)) / (1000 * 60); // minutes
    } else {
      t.duration = 0;
    }
  });

  return {
    broker: format.name,
    brokerId: format.id,
    totalRows: rows.length,
    trades,
    tradeCount: trades.length,
  };
}
