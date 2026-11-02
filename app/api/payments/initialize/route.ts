import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  PROVIDER_NAME,
  computeFee,
  createMockAccount,
  createProviderCheckout,
  getManualAccount,
  getPaymentMode,
  getProviderCheckout,
  getWhatsappNumber,
  type PaymentAccount,
} from '@/lib/payments';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { participantId, paymentType, installmentNumber } = body || {};

  if (!participantId || !paymentType) {
    return NextResponse.json({ error: 'participantId and paymentType are required.' }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

  const programme = await prisma.programme.findUnique({ where: { id: participant.programmeId } });
  if (!programme) return NextResponse.json({ error: 'Programme not found.' }, { status: 500 });

  let fee;
  try {
    fee = computeFee(programme, paymentType, installmentNumber);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const slotNumber = paymentType === 'INSTALLMENT' ? Number(installmentNumber) : null;

  // findFirst (not findUnique): a full payment has no instalment number, and
  // Prisma rejects null inside a compound unique key.
  const existing = await prisma.payment.findFirst({
    where: { participantId, installmentNumber: slotNumber },
  });

  if (existing?.status === 'VERIFIED') {
    return NextResponse.json({ error: 'This payment has already been completed.' }, { status: 400 });
  }

  const mode = getPaymentMode();
  let reference: string;
  let account: PaymentAccount;
  let storedAccountNumber: string | null = null;
  let providerName: string;

  try {
    if (mode === 'provider') {
      providerName = PROVIDER_NAME;
      // Reuse this slot's checkout if it is still valid (same provider, same
      // amount), so refreshing never hands the person a different account.
      let reused: PaymentAccount | null = null;
      if (existing && existing.provider === PROVIDER_NAME && existing.amount === fee.amount) {
        reused = await getProviderCheckout(existing.transactionId).catch(() => null);
      }
      if (reused && existing) {
        reference = existing.transactionId;
        account = reused;
      } else {
        const checkout = await createProviderCheckout({ amount: fee.amount, email: participant.email });
        reference = checkout.reference;
        account = checkout.account;
      }
      storedAccountNumber = account.accountNumber;
    } else if (mode === 'manual') {
      // One shared account: never stored on the payment, so the webhook can
      // never match a transfer to it by account number.
      providerName = 'manual_transfer';
      reference = existing?.transactionId ?? `SBHIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      account = getManualAccount();
    } else {
      providerName = 'mock';
      reference = existing?.transactionId ?? `SBHIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      account = createMockAccount(reference);
      storedAccountNumber = account.accountNumber;
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  const payment = existing
    ? await prisma.payment.update({
        where: { id: existing.id },
        data: {
          transactionId: reference,
          amount: fee.amount,
          planRate: fee.planRate,
          provider: providerName,
          status: 'PENDING',
          virtualAccountNumber: storedAccountNumber,
        },
      })
    : await prisma.payment.create({
        data: {
          participantId,
          transactionId: reference,
          amount: fee.amount,
          paymentType,
          installmentNumber: slotNumber,
          planRate: fee.planRate,
          provider: providerName,
          status: 'PENDING',
          virtualAccountNumber: storedAccountNumber,
        },
      });

  let whatsapp: string | null = null;
  if (mode === 'manual') {
    try {
      whatsapp = getWhatsappNumber();
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
  }

  return NextResponse.json({
    success: true,
    transactionId: payment.transactionId,
    amount: fee.amount,
    account,
    manual: mode === 'manual',
    whatsapp,
    registrationId: participant.registrationId,
    name: `${participant.otherName} ${participant.surname}`,
    label: paymentType === 'INSTALLMENT' ? `Instalment ${slotNumber}/10` : 'Full payment',
  });
}
