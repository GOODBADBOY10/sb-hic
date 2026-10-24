import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { verifyPaystackTransaction } from '@/lib/payments';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['FINANCE_ADMIN']);
  if (error) return error;

  const { transactionId } = await request.json().catch(() => ({}));
  if (!transactionId) return NextResponse.json({ error: 'transactionId is required.' }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
  if (payment.status === 'VERIFIED') {
    return NextResponse.json({ status: 'already_verified' });
  }

  let verified;
  try {
    verified = await verifyPaystackTransaction(transactionId);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  const newTxStatus = verified.status === 'success' ? 'VERIFIED' : 'FAILED';

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data:
        newTxStatus === 'VERIFIED'
          ? { status: 'VERIFIED', paidAt: new Date(), verifiedAt: new Date() }
          : { status: 'FAILED' },
    });

    if (newTxStatus === 'VERIFIED') {
      const verifiedPayments = await tx.payment.findMany({
        where: { participantId: payment.participantId, status: 'VERIFIED' },
      });
      const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
      const participant = await tx.participant.findUniqueOrThrow({ where: { id: payment.participantId } });
      const programme = await tx.programme.findUniqueOrThrow({ where: { id: participant.programmeId } });
      const owedAtPlan = payment.planRate === 'EARLY_BIRD' ? programme.earlyBirdFee : programme.flatFee;
      const newStatus = totalPaid >= owedAtPlan ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'NOT_PAID';
      await tx.participant.update({ where: { id: payment.participantId }, data: { paymentStatus: newStatus } });
    }

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'MANUAL_VERIFY_STUCK_PAYMENT',
        targetType: 'Payment',
        targetId: payment.id,
        before: { status: payment.status },
        after: { status: newTxStatus },
      },
    });
  });

  return NextResponse.json({ status: newTxStatus.toLowerCase() });
}
