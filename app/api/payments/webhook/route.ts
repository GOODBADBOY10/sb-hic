import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authorizeWebhook, parseTransferPayload } from '@/lib/payments';

type Tx = Prisma.TransactionClient;

/**
 * Finds which pending Payment a bank credit belongs to. Tried in order:
 *   1. the account number it landed in (each payment gets its own account)
 *   2. customerIdentifier / externalRef equal to our payment reference
 *   3. our reference (SBHIC-XXXXXXXXXXXXXXXX) appearing in the narration
 * If the provider's design differs, this is the ONLY function to change.
 */
async function findPayment(tx: Tx, p: { accountNumber?: string | null; customerIdentifier?: string | null; externalRef?: string | null; narration?: string | null }) {
  const keys = [p.accountNumber, p.customerIdentifier, p.externalRef].filter(Boolean) as string[];
  for (const key of keys) {
    const hit = await tx.payment.findFirst({
      where: { OR: [{ virtualAccountNumber: key }, { transactionId: key }] },
      orderBy: { status: 'asc' },
    });
    if (hit) return hit;
  }
  const m = p.narration?.match(/SBHIC-[A-F0-9]{16}/i);
  if (m) return tx.payment.findUnique({ where: { transactionId: m[0].toUpperCase() } });
  return null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const auth = authorizeWebhook(request, rawBody);
  if (!auth.ok) return NextResponse.json({ error: auth.reason }, { status: auth.status });

  let payload;
  try {
    payload = parseTransferPayload(JSON.parse(rawBody));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const payment = await findPayment(tx, payload);
      const record = (outcome: string) =>
        tx.paymentEvent.create({
          data: {
            providerReference: payload.transactionReference,
            paymentId: payment?.id ?? null,
            amount: payload.amountNaira,
            outcome,
            raw: JSON.parse(rawBody),
          },
        });

      if (!payment) {
        await record('UNMATCHED');
        return 'unmatched';
      }
      if (payment.status === 'VERIFIED') {
        // Same payment already settled, so this is a second transfer. Record it
        // for an admin to refund; never change state twice.
        await record('DUPLICATE_PAYMENT');
        return 'duplicate_payment';
      }
      if (payload.amountNaira < payment.amount) {
        await record('UNDERPAID');
        return 'underpaid';
      }

      await record('MATCHED');
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'VERIFIED',
          paidAt: new Date(),
          verifiedAt: new Date(),
          providerReference: payload.transactionReference,
        },
      });

      const verified = await tx.payment.findMany({ where: { participantId: payment.participantId, status: 'VERIFIED' } });
      const totalPaid = verified.reduce((sum, v) => sum + v.amount, 0);
      const participant = await tx.participant.findUniqueOrThrow({ where: { id: payment.participantId } });
      const programme = await tx.programme.findUniqueOrThrow({ where: { id: participant.programmeId } });
      const owed = payment.planRate === 'EARLY_BIRD' ? programme.earlyBirdFee : programme.flatFee;
      const newStatus = totalPaid >= owed ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'NOT_PAID';
      await tx.participant.update({ where: { id: payment.participantId }, data: { paymentStatus: newStatus } });

      await tx.auditLog.create({
        data: {
          actorId: 'payment_webhook',
          action: 'VERIFY_PAYMENT',
          targetType: 'Payment',
          targetId: payment.id,
          before: { status: payment.status },
          after: { status: 'VERIFIED', participantPaymentStatus: newStatus, providerReference: payload.transactionReference },
        },
      });
      return 'verified';
    });

    return NextResponse.json({ status: outcome }, { status: 200 });
  } catch (e: any) {
    // Same transactionReference delivered twice (retry or race): already handled.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ status: 'already_processed' }, { status: 200 });
    }
    console.error('payment webhook failed', e);
    // 500 so the provider retries; nothing was committed.
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 });
  }
}
