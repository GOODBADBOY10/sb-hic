import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Paystack appends both `reference` and `trxref` to the callback URL —
  // accept either so the callback page works regardless of which it reads.
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get('ref') || searchParams.get('reference') || searchParams.get('trxref');
  if (!ref) return NextResponse.json({ error: 'ref query param is required.' }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { transactionId: ref },
    include: { participant: { include: { class: true, programme: true } } },
  });
  if (!payment) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });

  const totalOwed =
    payment.planRate === 'FLAT' ? payment.participant.programme.flatFee : payment.participant.programme.earlyBirdFee;

  // Purely reflects whatever the webhook has already recorded — this
  // endpoint never sets paid status itself.
  return NextResponse.json({
    status: payment.status,
    amount: payment.amount,
    paidAt: payment.paidAt,
    paymentType: payment.paymentType,
    installmentNumber: payment.installmentNumber,
    participant: {
      id: payment.participant.id,
      registrationId: payment.participant.registrationId,
      name: `${payment.participant.otherName} ${payment.participant.surname}`,
      class: payment.participant.class?.name ?? null,
      paymentStatus: payment.participant.paymentStatus,
      totalOwed,
    },
  });
}
