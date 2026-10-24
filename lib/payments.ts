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
 * Gives the payer an account to transfer to for ONE payment.
 *
 * PAYMENT_MODE=mock  → fake account, for local testing only (refused in production).
 * anything else      → TODO: call the provider's "create account" endpoint here
 *                      once they share the API docs.
 */
export async function createPaymentAccount(params: {
  reference: string;
  amount: number;
  name: string;
  email: string;
}): Promise<PaymentAccount> {
  if (process.env.PAYMENT_MODE === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PAYMENT_MODE=mock is not allowed in production.');
    }
    const digits = (parseInt(crypto.createHash('sha1').update(params.reference).digest('hex').slice(0, 8), 16) % 1_000_000_000)
      .toString()
      .padStart(9, '0');
    return { accountNumber: `9${digits}`, bankName: 'Test Bank', accountName: 'SB HIC 2026 (TEST)' };
  }
  throw new Error('The payment provider is not configured yet.');
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
 * With no secret set, production fails CLOSED unless you explicitly opt out.
 */
export function authorizeWebhook(
  request: NextRequest,
  rawBody: string
): { ok: true } | { ok: false; status: number; reason: string } {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_WEBHOOK_ALLOW_UNAUTHENTICATED !== 'true') {
      return { ok: false, status: 500, reason: 'Webhook authentication is not configured.' };
    }
    return { ok: true };
  }

  const headerName = process.env.PAYMENT_WEBHOOK_HEADER || 'x-webhook-secret';
  const provided = request.headers.get(headerName);
  if (!provided) return { ok: false, status: 401, reason: 'Missing authentication header.' };

  const mode = process.env.PAYMENT_WEBHOOK_AUTH_MODE || 'header';
  const expected =
    mode === 'hmac'
      ? crypto.createHmac(process.env.PAYMENT_WEBHOOK_HMAC_ALGO || 'sha256', secret).update(rawBody).digest('hex')
      : secret;

  return safeEqual(provided, expected) ? { ok: true } : { ok: false, status: 401, reason: 'Invalid signature.' };
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
