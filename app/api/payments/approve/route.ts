import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

/**
 * Finance admin confirms that a PENDING payment's money really reached the
 * bank account (checked in the bank app/alert, not just from a screenshot).
 */
export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['FINANCE_ADMIN']);
  if (error) return error;

  const { transactionId, note } = await request.json().catch(() => ({}));
  if (!transactionId) {
    return NextResponse.json({ error: 'transactionId is required.' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  if (payment.status === 'VERIFIED') {
    return NextResponse.json({ error: 'This payment is already approved.' }, { status: 400 });
  }
  if (payment.status === 'REFUNDED') {
    return NextResponse.json({ error: 'A refunded payment cannot be approved.' }, { status: 400 });
  }

  const newStatus = await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'VERIFIED', paidAt: new Date(), verifiedAt: new Date() },
    });

    const verified = await tx.payment.findMany({ where: { participantId: payment.participantId, status: 'VERIFIED' } });
    const totalPaid = verified.reduce((sum, p) => sum + p.amount, 0);
    const participant = await tx.participant.findUniqueOrThrow({ where: { id: payment.participantId } });
    const programme = await tx.programme.findUniqueOrThrow({ where: { id: participant.programmeId } });
    const owed = payment.planRate === 'EARLY_BIRD' ? programme.earlyBirdFee : programme.flatFee;
    const status = totalPaid >= owed ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'NOT_PAID';
    await tx.participant.update({ where: { id: payment.participantId }, data: { paymentStatus: status } });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'APPROVE_PAYMENT',
        targetType: 'Payment',
        targetId: payment.id,
        before: { status: payment.status },
        after: { status: 'VERIFIED', participantPaymentStatus: status, note: note || null },
      },
    });
    return status;
  });

  return NextResponse.json({ success: true, participantPaymentStatus: newStatus });
}
