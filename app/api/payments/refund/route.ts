import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['FINANCE_ADMIN']);
  if (error) return error;

  const { transactionId, reason } = await request.json().catch(() => ({}));
  if (!transactionId || !reason) {
    return NextResponse.json({ error: 'transactionId and reason are required.' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
  if (payment.status !== 'VERIFIED') {
    return NextResponse.json({ error: 'Only a verified payment can be refunded.' }, { status: 400 });
  }

  // NOTE: this records the refund and updates participant status. Actually
  // issuing the money back through Paystack's refund API is a separate call
  // you can add here once you confirm the refund policy cutoffs — kept
  // deliberately explicit rather than automatic, since money is involved.
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } });
    await tx.participant.update({ where: { id: payment.participantId }, data: { paymentStatus: 'REFUNDED' } });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'REFUND_PAYMENT',
        targetType: 'Payment',
        targetId: payment.id,
        before: { status: 'VERIFIED' },
        after: { status: 'REFUNDED', reason },
      },
    });
  });

  return NextResponse.json({ success: true });
}
