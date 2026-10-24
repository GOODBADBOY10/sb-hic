import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { computeFee, createPaymentAccount } from '@/lib/payments';

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

  // const existing = await prisma.payment.findUnique({
  //   where: { participantId_installmentNumber: { participantId, installmentNumber: slotNumber } },
  // });

  const existing = await prisma.payment.findFirst({
    where: { participantId, installmentNumber: slotNumber },
  });

  if (existing?.status === 'VERIFIED') {
    return NextResponse.json({ error: 'This payment has already been completed.' }, { status: 400 });
  }

  const reference = existing?.transactionId ?? `SBHIC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

  // Reuse the account already issued for this payment slot, so a refresh
  // or a second click never hands the person a different account.
  let account = existing?.virtualAccountNumber
    ? { accountNumber: existing.virtualAccountNumber, bankName: process.env.PAYMENT_BANK_NAME || 'Bank', accountName: process.env.PAYMENT_ACCOUNT_NAME || 'SB HIC' }
    : null;
  if (!account) {
    try {
      account = await createPaymentAccount({
        reference,
        amount: fee.amount,
        name: `${participant.otherName} ${participant.surname}`,
        email: participant.email,
      });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 502 });
    }
  }

  const payment = existing
    ? await prisma.payment.update({
      where: { id: existing.id },
      data: { amount: fee.amount, planRate: fee.planRate, status: 'PENDING', virtualAccountNumber: account.accountNumber },
    })
    : await prisma.payment.create({
      data: {
        participantId,
        transactionId: reference,
        amount: fee.amount,
        paymentType,
        installmentNumber: slotNumber,
        planRate: fee.planRate,
        provider: 'bank_transfer',
        status: 'PENDING',
        virtualAccountNumber: account.accountNumber,
      },
    });

  return NextResponse.json({
    success: true,
    transactionId: payment.transactionId,
    amount: fee.amount,
    account,
  });
}
