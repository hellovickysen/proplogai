const PROVISIONING_URL = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

function metastatsBase(region) {
  return 'https://metastats-api-v1.' + (region || 'new-york') + '.agiliumtrade.ai';
}

function token() {
  const t = process.env.METAAPI_TOKEN;
  if (!t) throw new Error('MetaApi is not configured yet (missing METAAPI_TOKEN in environment).');
  return t;
}

function transactionId() {
  let s = '';
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

// Create (provision) a MetaApi account for an MT5 trading account.
export async function createAccount({ login, password, server, name, region, keywords }) {
  const body = {
    login: String(login),
    password: password,
    name: name || 'MT5 ' + login,
    server: server,
    platform: 'mt5',
    magic: 0,
    region: region || 'new-york',
  };
  if (keywords && keywords.length) body.keywords = keywords;

  const res = await fetch(PROVISIONING_URL + '/users/current/accounts', {
    method: 'POST',
    headers: {
      'auth-token': token(),
      'transaction-id': transactionId(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok && res.status !== 202) {
    throw new Error('MetaApi create failed (' + res.status + '): ' + text.slice(0, 300));
  }
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {}
  return data;
}

// Deploy an account so MetaApi spins up a terminal and connects to the broker.
// Best-effort + idempotent: deploying an already-deployed account is a no-op.
export async function deployAccount(accountId) {
  try {
    const res = await fetch(PROVISIONING_URL + '/users/current/accounts/' + accountId + '/deploy', {
      method: 'POST',
      headers: {
        'auth-token': token(),
        'transaction-id': transactionId(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

function fmtTime(d) {
  const p = (n, l) => String(n).padStart(l || 2, '0');
  return (
    d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' +
    p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + '.' + p(d.getUTCMilliseconds(), 3)
  );
}

// Fetch historical (closed) trades for a MetaApi account from MetaStats.
// Returns { pending: true } when the account is still deploying / connecting.
export async function getHistoricalTrades(accountId, region) {
  const start = '2015-01-01 00:00:00.000';
  const end = fmtTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const url =
    metastatsBase(region) +
    '/users/current/accounts/' + accountId +
    '/historical-trades/' + encodeURIComponent(start) + '/' + encodeURIComponent(end);

  const res = await fetch(url, { headers: { 'auth-token': token(), Accept: 'application/json' } });
  if (res.status === 202) return { pending: true, trades: [] };
  const text = await res.text();
  if (!res.ok) {
    // Account still deploying / connecting / synchronizing -> treat as pending, not a hard error.
    if (
      (res.status === 400 || res.status === 404) &&
      /not connected|not deployed|deploy|connecting|synchroniz|undeployed/i.test(text)
    ) {
      return { pending: true, trades: [] };
    }
    throw new Error('MetaApi history failed (' + res.status + '): ' + text.slice(0, 300));
  }
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {}
  const trades = Array.isArray(data) ? data : data.trades || [];
  return { pending: false, trades };
}
