// SB HIC payment relay.
//
// Runs on a server with a fixed IPv4 address. The website (on Vercel) asks this
// relay to talk to the payment provider, so the provider only ever sees THIS
// server's IP, which is what its IP whitelist needs.
//
// Only two operations exist (create a checkout, look a checkout up). Every
// request must carry an HMAC signature made with RELAY_SECRET, so a stranger who
// finds this address cannot use it. The provider's Merchant ID and Secret Key
// live ONLY in this server's environment file, never on Vercel.
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
const RELAY_SECRET = process.env.RELAY_SECRET;
const MERCHANT_ID = process.env.PAYMENT_MERCHANT_ID;
const SECRET_KEY = process.env.PAYMENT_SECRET_KEY;
const API_BASE = (process.env.PAYMENT_API_BASE || 'https://bassapi.ethicamfb.org').replace(/\/$/, '');
const MAX_SKEW_SECONDS = 60;
const MAX_BODY_BYTES = 4096;

if (!RELAY_SECRET || RELAY_SECRET.length < 32) {
  console.error('RELAY_SECRET must be set (at least 32 characters).');
  process.exit(1);
}
if (!MERCHANT_ID || !SECRET_KEY) {
  console.error('PAYMENT_MERCHANT_ID and PAYMENT_SECRET_KEY must be set.');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${MERCHANT_ID}:${SECRET_KEY}`).toString('base64');

function safeEqualHex(a, b) {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Calls the payment provider over IPv4 only, so the source address is the whitelisted IPv4. */
function providerRequest(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const lib = url.protocol === 'http:' ? http : https; // http only for local testing
    const payload = body ? JSON.stringify(body) : null;
    const req = lib.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || undefined,
        path: url.pathname + url.search,
        family: 4,
        timeout: 20_000,
        headers: {
          Accept: '*/*',
          Authorization: AUTH,
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ http: res.statusCode, json: JSON.parse(data) });
          } catch {
            resolve({ http: res.statusCode, json: null });
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('provider timeout')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function getCheckout(reference) {
  const r = await providerRequest(`/checkout/${encodeURIComponent(reference)}`, null);
  // statusCode in the BODY is what counts, not only the HTTP status.
  if (!r.json || r.json.statusCode !== 200 || !r.json.data?.accountNumber) {
    console.error('provider checkout lookup failed', r.http, r.json?.message || r.json?.description);
    throw new Error('lookup failed');
  }
  return {
    reference: String(r.json.data.reference || reference),
    accountNumber: String(r.json.data.accountNumber),
    accountName: String(r.json.data.accountName || ''),
  };
}

async function createCheckout(amount, email) {
  const r = await providerRequest('/api/dynamic-checkout', { amount, email });
  if (!r.json || r.json.statusCode !== 200 || !r.json.data?.reference) {
    console.error('provider checkout create failed', r.http, r.json?.message || r.json?.description);
    throw new Error('create failed');
  }
  return getCheckout(String(r.json.data.reference));
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });

  const chunks = [];
  let size = 0;
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY_BYTES) {
      send(res, 413, { ok: false, error: 'too large' });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', async () => {
    if (res.writableEnded) return;
    const raw = Buffer.concat(chunks).toString('utf8');

    // 1) Authenticate: timestamp + HMAC over "<timestamp>.<raw body>".
    const ts = String(req.headers['x-relay-timestamp'] || '');
    const sig = String(req.headers['x-relay-signature'] || '');
    const tsNum = Number(ts);
    if (!/^\d{9,12}$/.test(ts) || Math.abs(Date.now() / 1000 - tsNum) > MAX_SKEW_SECONDS) {
      return send(res, 401, { ok: false, error: 'bad timestamp' });
    }
    const expected = crypto.createHmac('sha256', RELAY_SECRET).update(`${ts}.${raw}`).digest('hex');
    if (!sig || !safeEqualHex(sig, expected)) return send(res, 401, { ok: false, error: 'bad signature' });

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { ok: false, error: 'bad json' });
    }

    // 2) Only two narrow operations.
    try {
      if (req.url === '/checkout') {
        const amount = Number(body.amount);
        const email = String(body.email || '');
        if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
          return send(res, 400, { ok: false, error: 'bad amount' });
        }
        if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return send(res, 400, { ok: false, error: 'bad email' });
        }
        return send(res, 200, { ok: true, data: await createCheckout(amount, email) });
      }
      if (req.url === '/checkout/details') {
        const reference = String(body.reference || '');
        if (!/^[A-Za-z0-9_-]{6,64}$/.test(reference)) return send(res, 400, { ok: false, error: 'bad reference' });
        return send(res, 200, { ok: true, data: await getCheckout(reference) });
      }
      return send(res, 404, { ok: false, error: 'not found' });
    } catch (e) {
      console.error('relay error:', e.message);
      return send(res, 502, { ok: false, error: 'provider unavailable' });
    }
  });
});

server.listen(PORT, HOST, () => console.log(`relay listening on ${HOST}:${PORT}`));
