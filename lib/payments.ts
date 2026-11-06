import crypto from 'crypto';
import type { NextRequest } from 'next/server';

const PAYSTACK_BASE = 'https://api.paystack.co';

export const INSTALLMENT_COUNT = 10;

interface ProgrammeFeeFields {
  earlyBirdFee: number;
  flatFee: number;
  earlyBirdDeadline: Date | string;
}

/**
 * Resolves what a participant owes right now, given the programme's fee
 * settings and the payment option they've chosen. Always evaluated at
 * payment time, never cached from registration time.
 */
export function computeFee(
  programme: ProgrammeFeeFields,
  paymentType: 'FULL' | 'INSTALLMENT',
  installmentNumber?: number
) {
  const now = new Date();
  const isEarlyBird = now <= new Date(programme.earlyBirdDeadline);
  const planRate: 'EARLY_BIRD' | 'FLAT' = isEarlyBird ? 'EARLY_BIRD' : 'FLAT';
  const totalFee = isEarlyBird ? programme.earlyBirdFee : programme.flatFee;

  if (paymentType === 'INSTALLMENT') {
    if (!isEarlyBird) {
      throw new Error('The instalment plan is only available before the early-bird deadline.');
    }
    const n = Number(installmentNumber);
    if (!n || n < 1 || n > INSTALLMENT_COUNT) {
      throw new Error(`installmentNumber must be between 1 and ${INSTALLMENT_COUNT}.`);
    }
    const base = Math.round(totalFee / INSTALLMENT_COUNT);
    // Last instalment absorbs the rounding remainder so the sum always
    // equals totalFee exactly.
    const amount = n < INSTALLMENT_COUNT ? base : totalFee - base * (INSTALLMENT_COUNT - 1);
    return { planRate, amount, totalFee };
  }

  return { planRate, amount: totalFee, totalFee };
}

/**
 * Recalculates a lapsed early-bird instalment plan's remaining balance
 * against the flat rate, crediting whatever was already verified-paid.
 */
export function computeLapsedBalance(totalPaidSoFar: number, flatFee: number) {
  return Math.max(0, flatFee - totalPaidSoFar);
}


// ─────────────────────────────────────────────────────────────────────────
// Bank-transfer provider
// ─────────────────────────────────────────────────────────────────────────

export interface PaymentAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

/**
 * PAYMENT_MODE decides how payers are told where to send money:
 *   provider (default) → a checkout is created with the payment provider and the
 *                        payer gets a dedicated account number for that payment.
 *   manual             → emergency fallback: one fixed account from env vars and
 *                        receipts sent on WhatsApp; admins approve by hand.
 *   mock               → fake account for local testing only (refused in production).
 */
export function getPaymentMode(): 'manual' | 'mock' | 'provider' {
  const m = process.env.PAYMENT_MODE;
  return m === 'mock' || m === 'manual' ? m : 'provider';
}

export const PROVIDER_NAME = 'ethica_checkout';

function bankName() {
  return process.env.PAYMENT_BANK_NAME || 'Ethica MFB';
}

/** Manual mode only. No account details live in the code: set them in env vars. */
export function getManualAccount(): PaymentAccount {
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER;
  const accountName = process.env.PAYMENT_ACCOUNT_NAME;
  if (!accountNumber || !accountName) {
    throw new Error('Manual payment account is not configured.');
  }
  return { bankName: process.env.PAYMENT_BANK_NAME || 'Bank', accountName, accountNumber };
}

/** Digits-only international number for wa.me links (Nigerian numbers get 234). */
export function getWhatsappNumber(): string {
  const raw = (process.env.PAYMENT_WHATSAPP || '').replace(/\D/g, '');
  if (!raw) throw new Error('PAYMENT_WHATSAPP is not configured.');
  if (raw.startsWith('234')) return raw;
  if (raw.startsWith('0')) return '234' + raw.slice(1);
  return raw.length === 10 ? '234' + raw : raw;
}

export function createMockAccount(reference: string): PaymentAccount {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PAYMENT_MODE=mock is not allowed in production.');
  }
  const digits = (parseInt(crypto.createHash('sha1').update(reference).digest('hex').slice(0, 8), 16) % 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return { accountNumber: `9${digits}`, bankName: 'Test Bank', accountName: 'SB HIC 2026 (TEST)' };
}

// ── Payment provider: Dynamic Checkout API ──────────────────────────────

function providerBase() {
  return (process.env.PAYMENT_API_BASE || 'https://bassapi.ethicamfb.org').replace(/\/$/, '');
}

function providerAuthHeader() {
  const id = process.env.PAYMENT_MERCHANT_ID;
  const key = process.env.PAYMENT_SECRET_KEY;
  if (!id || !key) throw new Error('Payment provider credentials are not configured.');
  return 'Basic ' + Buffer.from(`${id}:${key}`).toString('base64');
}

async function providerCall(path: string, init: { body?: object }): Promise<any> {
  const res = await fetch(`${providerBase()}${path}`, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      Authorization: providerAuthHeader(),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  // statusCode in the BODY is what counts, not only the HTTP status.
  if (!json || json.statusCode !== 200) {
    console.error('payment provider error', path, res.status, json?.message || json?.description);
    throw new Error('Could not reach the payment service. Please try again in a moment.');
  }
  return json.data;
}

/**
 * When PAYMENT_RELAY_URL is set, provider calls go through the relay server
 * (which has the fixed IP the provider whitelists and holds the provider keys).
 */
async function relayCall(path: string, body: object): Promise<any> {
  const base = process.env.PAYMENT_RELAY_URL;
  const secret = process.env.PAYMENT_RELAY_SECRET;
  if (!base || !secret) throw new Error('Payment relay is not configured.');

  const raw = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex');

  const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-relay-timestamp': timestamp,
      'x-relay-signature': signature,
    },
    body: raw,
    signal: AbortSignal.timeout(25_000),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    console.error('payment relay error', path, res.status, json?.error);
    throw new Error('Could not reach the payment service. Please try again in a moment.');
  }
  return json.data;
}

/** Fetches the account a checkout is paid into. */
export async function getProviderCheckout(reference: string): Promise<PaymentAccount> {
  const data = process.env.PAYMENT_RELAY_URL
    ? await relayCall('/checkout/details', { reference })
    : await providerCall(`/checkout/${encodeURIComponent(reference)}`, {});
  if (!data?.accountNumber) throw new Error('Could not reach the payment service. Please try again in a moment.');
  return {
    accountNumber: String(data.accountNumber),
    accountName: String(data.accountName || 'ETHICA'),
    bankName: bankName(),
  };
}

/** Creates a checkout for one payment and returns its reference and account. */
export async function createProviderCheckout(params: {
  amount: number;
  email: string;
}): Promise<{ reference: string; account: PaymentAccount }> {
  if (process.env.PAYMENT_RELAY_URL) {
    const data = await relayCall('/checkout', { amount: params.amount, email: params.email });
    if (!data?.reference || !data?.accountNumber) {
      throw new Error('Could not reach the payment service. Please try again in a moment.');
    }
    return {
      reference: String(data.reference),
      account: {
        accountNumber: String(data.accountNumber),
        accountName: String(data.accountName || 'ETHICA'),
        bankName: bankName(),
      },
    };
  }
  const data = await providerCall('/api/dynamic-checkout', { body: { amount: params.amount, email: params.email } });
  if (!data?.reference) throw new Error('Could not reach the payment service. Please try again in a moment.');
  const reference = String(data.reference);
  const account = await getProviderCheckout(reference);
  return { reference, account };
}

/** Shape of the provider's credit-notification webhook. */
export interface TransferWebhookPayload {
  transactionReference: string;
  amount: string | number;
  accountNumber?: string | null;
  customerIdentifier?: string | null;
  externalRef?: string | null;
  narration?: string | null;
  senderName?: string | null;
  senderBankName?: string | null;
  settledAmount?: string | number | null;
  feeCharged?: string | number | null;
  transactionDate?: string | null;
}

export function parseTransferPayload(body: any): TransferWebhookPayload & { amountNaira: number } {
  if (!body || typeof body !== 'object') throw new Error('Body must be a JSON object.');
  const ref = String(body.transactionReference ?? '').trim();
  if (!ref) throw new Error('transactionReference is required.');
  const amountNaira = Math.round(Number(String(body.amount ?? '').replace(/,/g, '')));
  if (!Number.isFinite(amountNaira) || amountNaira <= 0) throw new Error('amount must be a positive number.');
  return { ...body, transactionReference: ref, amountNaira };
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/**
 * Decides whether a webhook call really came from the provider.
 * Configure ONE of these once the provider tells you how they authenticate:
 *   PAYMENT_WEBHOOK_AUTH_MODE=header (default): header PAYMENT_WEBHOOK_HEADER must equal PAYMENT_WEBHOOK_SECRET
 *   PAYMENT_WEBHOOK_AUTH_MODE=hmac: header holds HMAC(PAYMENT_WEBHOOK_HMAC_ALGO, secret, rawBody) as hex
 * You can also (or instead) restrict callers with PAYMENT_WEBHOOK_ALLOWED_IPS=ip1,ip2.
 * With neither set, production fails CLOSED unless you explicitly opt out.
 */
export function authorizeWebhook(
  request: NextRequest,
  rawBody: string
): { ok: true } | { ok: false; status: number; reason: string } {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const allowedIps = (process.env.PAYMENT_WEBHOOK_ALLOWED_IPS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  if (!secret && allowedIps.length === 0) {
    if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_WEBHOOK_ALLOW_UNAUTHENTICATED !== 'true') {
      return { ok: false, status: 500, reason: 'Webhook authentication is not configured.' };
    }
    return { ok: true };
  }

  // IP allowlist (Vercel sets x-forwarded-for itself, so the first entry is the real caller).
  if (allowedIps.length > 0) {
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '').trim();
    if (!allowedIps.includes(ip)) return { ok: false, status: 403, reason: 'Caller not allowed.' };
  }

  if (secret) {
    const headerName = process.env.PAYMENT_WEBHOOK_HEADER || 'x-webhook-secret';
    const provided = request.headers.get(headerName);
    if (!provided) return { ok: false, status: 401, reason: 'Missing authentication header.' };

    const mode = process.env.PAYMENT_WEBHOOK_AUTH_MODE || 'header';
    const expected =
      mode === 'hmac'
        ? crypto.createHmac(process.env.PAYMENT_WEBHOOK_HMAC_ALGO || 'sha256', secret).update(rawBody).digest('hex')
        : secret;
    if (!safeEqual(provided, expected)) return { ok: false, status: 401, reason: 'Invalid signature.' };
  }

  return { ok: true };
}

// ── Paystack (no longer used by the main flow; kept because verify-stuck still imports it) ──

export async function initializePaystackTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
}) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.');

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100, // Paystack expects kobo
      reference: params.reference,
      ...(params.callbackUrl && { callback_url: params.callbackUrl }),
    }),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Failed to initialize transaction with Paystack.');
  return data.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured.');

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || 'Failed to verify transaction with Paystack.');
  return data.data as { status: string; amount: number; reference: string };
}